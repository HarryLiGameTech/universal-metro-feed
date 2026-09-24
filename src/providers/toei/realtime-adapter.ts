import GtfsRealtimeBindings, { type transit_realtime } from "gtfs-realtime-bindings";
import { estimatedTime } from "../../domain/strict-time";
import type { Arrival, ArrivalSnapshot } from "../../types";
import { fetchGtfsRealtimeFeed } from "../gtfs-realtime/source";
import type { ProviderManifest } from "../registry";
import type { ProviderRuntime } from "../runtime";

const realtime = GtfsRealtimeBindings.transit_realtime;

// protobuf defaults live on the prototype: an absent direction must not become 0.
function published<T extends object, K extends keyof T>(value: T, key: K): NonNullable<T[K]> | null {
  return Object.prototype.hasOwnProperty.call(value, key) ? value[key] ?? null : null;
}

function eventTime(event: transit_realtime.TripUpdate.IStopTimeEvent | null | undefined) {
  const time = event && published(event, "time");
  return time == null ? null : Number(time.toString());
}

/** Toei publishes trip/stop-sequence predictions before station mappings are available. */
export function toeiArrivals(feed: transit_realtime.FeedMessage, timezone: string): ArrivalSnapshot {
  if (feed.header.incrementality === realtime.FeedHeader.Incrementality.DIFFERENTIAL) {
    throw new Error("Toei predictions require a full feed snapshot.");
  }
  const arrivals: Arrival[] = [];
  for (const entity of feed.entity) {
    const update = entity.tripUpdate;
    if (entity.isDeleted || !update ||
        update.trip.scheduleRelationship === realtime.TripDescriptor.ScheduleRelationship.CANCELED ||
        update.trip.scheduleRelationship === realtime.TripDescriptor.ScheduleRelationship.DELETED) continue;
    for (const [index, stop] of (update.stopTimeUpdate ?? []).entries()) {
      if (stop.scheduleRelationship === realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.SKIPPED ||
          stop.scheduleRelationship === realtime.TripUpdate.StopTimeUpdate.ScheduleRelationship.NO_DATA) continue;
      const arrivalTime = eventTime(stop.arrival);
      const departureTime = eventTime(stop.departure);
      const time = arrivalTime ?? departureTime;
      // A delay alone cannot produce an absolute time without the static schedule.
      if (time == null || !Number.isFinite(time)) continue;
      const eventKind = arrivalTime == null ? "departure" : "arrival";
      const event = eventKind === "arrival" ? stop.arrival! : stop.departure!;
      const direction = published(update.trip, "directionId");
      const stopId = published(stop, "stopId");
      const stopSequence = published(stop, "stopSequence");
      arrivals.push({
        id: JSON.stringify([entity.id, stopSequence, stopId, index, eventKind]),
        tripId: published(update.trip, "tripId"),
        routeId: published(update.trip, "routeId"),
        stopId,
        stopSequence,
        direction: direction == null ? null : String(direction),
        destinationId: null,
        destinationName: null,
        timeSource: "prediction",
        eventTime: time,
        eventKind,
        scheduledTime: null,
        delaySeconds: published(event, "delay"),
        delayStatus: "undetermined",
        delayLabel: "",
        displayTime: estimatedTime(time, timezone, "second", published(event, "uncertainty")),
      });
    }
  }
  const timestamp = published(feed.header, "timestamp");
  return {
    arrivals: arrivals.sort((left, right) => left.eventTime - right.eventTime || left.id.localeCompare(right.id)),
    feedTimestamp: timestamp == null ? null : Number(timestamp.toString()),
    fetchedAt: Math.floor(Date.now() / 1_000),
  };
}

export function createToeiRuntime(manifest: ProviderManifest): ProviderRuntime {
  if (manifest.predictions.kind !== "gtfs-realtime" || manifest.predictions.adapter !== "toei" ||
      !manifest.predictions.urlTemplate || manifest.topology.kind !== "none" || manifest.schedule.kind !== "none") {
    throw new Error("Toei requires a TripUpdate URL and realtime-only configuration.");
  }
  const url = manifest.predictions.urlTemplate;
  return {
    arrivalScope: "feed",
    loadArrivals: async (_stationId, _routeIds, _direction, signal) =>
      toeiArrivals(await fetchGtfsRealtimeFeed(url, signal), manifest.timezone),
    loadTripPath: null,
    loadTimetable: null,
    arrivalSource: "prediction",
    feedLabel: "Toei feed",
    refreshIntervalMs: manifest.refreshIntervalMs ?? 10_000,
  };
}
