import GtfsRealtimeBindings, { type transit_realtime } from "gtfs-realtime-bindings";
import { estimatedTime } from "../../domain/strict-time";
import type { Arrival, ArrivalSnapshot } from "../../types";
import { fetchGtfsRealtimeFeed } from "../gtfs-realtime/source";
import { loadProviderCatalog, type ProviderManifest } from "../registry";
import type { ProviderRuntime } from "../runtime";
import { loadToeiTripMap, type ToeiTripMap } from "./trip-map";

const realtime = GtfsRealtimeBindings.transit_realtime;

// protobuf defaults live on the prototype: an absent direction must not become 0.
function published<T extends object, K extends keyof T>(value: T, key: K): NonNullable<T[K]> | null {
  return Object.prototype.hasOwnProperty.call(value, key) ? value[key] ?? null : null;
}

function eventTime(event: transit_realtime.TripUpdate.IStopTimeEvent | null | undefined) {
  const time = event && published(event, "time");
  return time == null ? null : Number(time.toString());
}

/** Join published trip/stop-sequence IDs to lightweight static references, never static times. */
export function toeiArrivals(feed: transit_realtime.FeedMessage, timezone: string, map?: ToeiTripMap): ArrivalSnapshot {
  if (feed.header.incrementality === realtime.FeedHeader.Incrementality.DIFFERENTIAL) {
    throw new Error("Toei predictions require a full feed snapshot.");
  }
  const arrivals: Arrival[] = [];
  let incomplete = false;
  const feedVersion = published(feed.header, "feedVersion");
  for (const entity of feed.entity) {
    const update = entity.tripUpdate;
    if (entity.isDeleted || !update ||
        update.trip.scheduleRelationship === realtime.TripDescriptor.ScheduleRelationship.CANCELED ||
        update.trip.scheduleRelationship === realtime.TripDescriptor.ScheduleRelationship.DELETED) continue;
    const tripId = published(update.trip, "tripId");
    const patternId = map && tripId != null && Object.hasOwn(map.trips, tripId) ? map.trips[tripId] : undefined;
    if (patternId === null) continue;
    let pattern = patternId === undefined ? undefined : map?.patterns[patternId];
    const date = published(update.trip, "startDate");
    const sourceRoute = published(update.trip, "routeId");
    const sourceDirection = published(update.trip, "directionId");
    if (map && ((date != null && ((map.source.feedStartDate != null && date < map.source.feedStartDate) ||
        (map.source.feedEndDate != null && date > map.source.feedEndDate))) ||
        (feedVersion != null && map.source.feedVersion != null && feedVersion !== map.source.feedVersion) ||
        (pattern && ((sourceRoute != null && sourceRoute !== pattern.routeId) ||
          (sourceDirection != null && pattern.direction != null && String(sourceDirection) !== pattern.direction))))) {
      pattern = undefined;
    }
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
      const stopSequence = published(stop, "stopSequence");
      const stopId = published(stop, "stopId") ?? (stopSequence == null ? null : pattern?.stops[stopSequence] ?? null);
      if (map && (!pattern || stopId == null)) incomplete = true;
      arrivals.push({
        id: JSON.stringify([entity.id, stopSequence, stopId, index, eventKind]),
        tripId,
        routeId: sourceRoute ?? pattern?.routeId ?? null,
        stopId,
        stopSequence,
        direction: sourceDirection == null ? pattern?.direction ?? null : String(sourceDirection),
        destinationId: null,
        destinationName: pattern?.headsign ?? null,
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
    ...(incomplete ? { warnings: ["Some live trips could not be matched to stations. Arrival results may be incomplete."] } : {}),
  };
}

export function createToeiRuntime(manifest: ProviderManifest): ProviderRuntime {
  if (manifest.predictions.kind !== "gtfs-realtime" || manifest.predictions.adapter !== "toei" ||
      !manifest.predictions.urlTemplate || manifest.topology.kind !== "gtfs-static" ||
      !manifest.topology.tripMapUrl || manifest.schedule.kind !== "none") {
    throw new Error("Toei requires a TripUpdate URL and static station mappings.");
  }
  const url = manifest.predictions.urlTemplate;
  const { catalogUrl, tripMapUrl } = manifest.topology;
  let reference: Promise<ToeiTripMap> | undefined;
  const mapping = () => reference ??= loadToeiTripMap(tripMapUrl, manifest.id).catch((error: unknown) => {
    reference = undefined;
    throw error;
  });
  return {
    arrivalScope: "platform",
    loadArrivals: async (stationId, routeIds, direction, signal) => {
      const catalog = await loadProviderCatalog(catalogUrl, manifest.id);
      const station = catalog.stations.find((station) => station.id === stationId);
      const routes = routeIds.map((routeId) => station?.routes.find((route) =>
        route.routeId === routeId && route.directions.includes(direction)));
      if (!station || routes.length === 0 || routes.some((route) => !route)) throw new Error("Select a valid station, line, and direction.");
      const stopsByRoute = new Map(routes.map((route) => [route!.routeId, new Set(route!.stopIds?.[direction] ?? [])]));
      signal?.throwIfAborted();
      const [feed, map] = await Promise.all([fetchGtfsRealtimeFeed(url, signal), mapping()]);
      signal?.throwIfAborted();
      const snapshot = toeiArrivals(feed, manifest.timezone, map);
      return {
        ...snapshot,
        arrivals: snapshot.arrivals.filter((arrival) => arrival.routeId != null && arrival.stopId != null &&
          arrival.direction === direction && stopsByRoute.get(arrival.routeId)?.has(arrival.stopId)),
      };
    },
    loadTripPath: null,
    loadTimetable: null,
    arrivalSource: "prediction",
    feedLabel: "Toei feed",
    refreshIntervalMs: manifest.refreshIntervalMs ?? 10_000,
  };
}
