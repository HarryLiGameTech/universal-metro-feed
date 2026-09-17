import GtfsRealtimeBindings, { type transit_realtime } from "gtfs-realtime-bindings";
import { fetchTimetableSource, findScheduledEventTime, type TimetableSource } from "./timetable";
import type { Arrival, ArrivalSnapshot, DelayStatus, Direction } from "../types";

const BASE_URL = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/";

const FEED_BY_ROUTE: Record<string, string> = {
  "1": "nyct%2Fgtfs",
  "2": "nyct%2Fgtfs",
  "3": "nyct%2Fgtfs",
  "4": "nyct%2Fgtfs",
  "5": "nyct%2Fgtfs",
  "5X": "nyct%2Fgtfs",
  "6": "nyct%2Fgtfs",
  "6X": "nyct%2Fgtfs",
  "7": "nyct%2Fgtfs",
  "7X": "nyct%2Fgtfs",
  GS: "nyct%2Fgtfs",
  A: "nyct%2Fgtfs-ace",
  C: "nyct%2Fgtfs-ace",
  E: "nyct%2Fgtfs-ace",
  H: "nyct%2Fgtfs-ace",
  B: "nyct%2Fgtfs-bdfm",
  D: "nyct%2Fgtfs-bdfm",
  F: "nyct%2Fgtfs-bdfm",
  FX: "nyct%2Fgtfs-bdfm",
  M: "nyct%2Fgtfs-bdfm",
  FS: "nyct%2Fgtfs-bdfm",
  G: "nyct%2Fgtfs-g",
  J: "nyct%2Fgtfs-jz",
  Z: "nyct%2Fgtfs-jz",
  N: "nyct%2Fgtfs-nqrw",
  Q: "nyct%2Fgtfs-nqrw",
  R: "nyct%2Fgtfs-nqrw",
  W: "nyct%2Fgtfs-nqrw",
  L: "nyct%2Fgtfs-l",
  SI: "nyct%2Fgtfs-si",
};

export function feedNameForRoute(routeId: string) {
  const feedName = FEED_BY_ROUTE[routeId];
  if (!feedName) throw new Error(`No realtime feed is configured for the ${routeId} line.`);
  return feedName;
}

function numberFromLong(value: number | { toString(): string } | null | undefined) {
  return value == null ? null : Number(value.toString());
}

function parentStopId(stopId: string | null | undefined) {
  if (!stopId) return null;
  return /[NS]$/.test(stopId) ? stopId.slice(0, -1) : stopId;
}

const delayLabels: Record<DelayStatus, string> = {
  early: "Early",
  "on-time": "On-time or almost",
  mild: "Mildly delayed",
  noticeable: "Noticeably delayed",
  official: "Officially delayed",
  undetermined: "Untimed",
};

export function classifyDelay(delaySeconds: number | null) {
  if (delaySeconds == null || delaySeconds < -120 || delaySeconds > 600) {
    return { delayStatus: "undetermined" as const, delayLabel: delayLabels.undetermined };
  }

  if (delaySeconds <= -20) return { delayStatus: "early" as const, delayLabel: delayLabels.early };
  const difference = Math.abs(delaySeconds);
  if (difference <= 30) return { delayStatus: "on-time" as const, delayLabel: delayLabels["on-time"] };
  if (difference <= 60) return { delayStatus: "mild" as const, delayLabel: delayLabels.mild };
  if (difference <= 299) return { delayStatus: "noticeable" as const, delayLabel: delayLabels.noticeable };
  return { delayStatus: "official" as const, delayLabel: delayLabels.official };
}

export function normalizeArrivals(
  feed: transit_realtime.FeedMessage,
  stationId: string,
  routeId: string,
  direction: Direction,
  timetableSource?: TimetableSource | null,
  stationNameLookup: ReadonlyMap<string, string> = new Map(),
): ArrivalSnapshot {
  const selectedStopId = `${stationId}${direction}`;
  const arrivals: Arrival[] = [];

  for (const entity of feed.entity) {
    const tripUpdate = entity.tripUpdate;
    if (!tripUpdate || tripUpdate.trip.routeId !== routeId) continue;

    const updates = tripUpdate.stopTimeUpdate ?? [];
    const selected = updates.find((update) => update.stopId === selectedStopId);
    if (!selected) continue;

    const arrivalTime = numberFromLong(selected.arrival?.time);
    const departureTime = numberFromLong(selected.departure?.time);
    const eventTime = arrivalTime ?? departureTime;
    if (eventTime == null) continue;
    const eventKind = arrivalTime == null ? "departure" : "arrival";
    const tripId = tripUpdate.trip.tripId ?? entity.id;
    const serviceDate = tripUpdate.trip.startDate;
    const scheduledTime = timetableSource && serviceDate
      ? findScheduledEventTime(timetableSource, tripId, serviceDate, eventKind, eventTime)
      : null;
    const delaySeconds = scheduledTime == null ? null : Math.round(eventTime - scheduledTime);
    const delay = classifyDelay(delaySeconds);

    const destinationId = parentStopId(updates.at(-1)?.stopId);
    arrivals.push({
      id: entity.id,
      tripId,
      routeId,
      stopId: selectedStopId,
      direction,
      destinationId,
      destinationName: destinationId ? stationNameLookup.get(destinationId) ?? "Unknown terminal" : "Unknown terminal",
      eventTime,
      eventKind,
      scheduledTime,
      delaySeconds,
      ...delay,
    });
  }

  arrivals.sort((left, right) => left.eventTime - right.eventTime);

  return {
    arrivals,
    feedTimestamp: numberFromLong(feed.header.timestamp) ?? 0,
    fetchedAt: Math.floor(Date.now() / 1000),
  };
}

export async function fetchArrivals(
  stationId: string,
  routeId: string,
  direction: Direction,
  signal?: AbortSignal,
) {
  feedNameForRoute(routeId);
  const timetableSourcePromise = fetchTimetableSource(stationId, routeId, direction, signal).catch(() => null);
  const feed = await fetchMtaFeed(routeId, signal);
  // Kept only for pre-refactor parity tests. The active composed path loads a
  // provider catalog at runtime and passes its own lookup to normalizeArrivals.
  const { stations } = await import("../data/stations.generated");
  const stationNameLookup = new Map(stations.map((station) => [station.id, station.name]));
  return normalizeArrivals(feed, stationId, routeId, direction, await timetableSourcePromise, stationNameLookup);
}

export async function fetchMtaFeed(routeId: string, signal?: AbortSignal) {
  const feedName = feedNameForRoute(routeId);

  const response = await fetch(`${BASE_URL}${feedName}`, {
    cache: "no-store",
    headers: { Accept: "application/x-protobuf, application/octet-stream" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`MTA returned ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes);
}
