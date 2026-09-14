import GtfsRealtimeBindings, { type transit_realtime } from "gtfs-realtime-bindings";
import { stations } from "../data/stations.generated";
import type { Arrival, ArrivalSnapshot, Direction } from "../types";

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

const stationNames = new Map(stations.map((station) => [station.id, station.name]));

function numberFromLong(value: number | { toString(): string } | null | undefined) {
  return value == null ? null : Number(value.toString());
}

function parentStopId(stopId: string | null | undefined) {
  if (!stopId) return null;
  return /[NS]$/.test(stopId) ? stopId.slice(0, -1) : stopId;
}

export function normalizeArrivals(
  feed: transit_realtime.FeedMessage,
  stationId: string,
  routeId: string,
  direction: Direction,
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

    const destinationId = parentStopId(updates.at(-1)?.stopId);
    arrivals.push({
      id: entity.id,
      tripId: tripUpdate.trip.tripId ?? entity.id,
      routeId,
      stopId: selectedStopId,
      direction,
      destinationId,
      destinationName: destinationId ? stationNames.get(destinationId) ?? "Unknown terminal" : "Unknown terminal",
      eventTime,
      eventKind: arrivalTime == null ? "departure" : "arrival",
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
  const feedName = FEED_BY_ROUTE[routeId];
  if (!feedName) throw new Error(`No realtime feed is configured for the ${routeId} line.`);

  const response = await fetch(`${BASE_URL}${feedName}`, {
    cache: "no-store",
    headers: { Accept: "application/x-protobuf, application/octet-stream" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`MTA returned ${response.status} ${response.statusText}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes);
  return normalizeArrivals(feed, stationId, routeId, direction);
}
