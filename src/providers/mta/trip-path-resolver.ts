import type { transit_realtime } from "gtfs-realtime-bindings";
import { assetUrl } from "../../lib/asset-url";
import {
  CompositeMetroDataResolver,
  type FusionPolicy,
  type Resolved,
  type ResolutionContext,
  type ScheduleSource,
  type TopologySource,
  type PredictionSource,
} from "../../domain/resolver";
import type { TripPath, TripPathQuery, TripStopTime } from "../../domain/trip-path";
import { classifyDelay, fetchMtaFeed } from "./feed";
import {
  activeServiceIds,
  fetchTimetableSource,
  matchesStaticTripId,
  newYorkDateKey,
  newYorkServiceTimeToEpoch,
  shiftDateKey,
  type TimetableSource,
} from "../../lib/timetable";
import { loadProviderCatalog } from "../registry";
import { mtaPredictedTime, mtaScheduledTime } from "./time-policy";

const providerId = "mta-subway";

export interface StaticTripPath {
  routeId: string;
  serviceId: string;
  stops: Array<{ stopId: string; sequence: number; arrival: string | null; departure: string | null }>;
}

interface StaticTripPathShard { trips: Record<string, StaticTripPath> }
interface ScheduleCandidates { timetable: TimetableSource; paths: Record<string, StaticTripPath> }
interface MtaTripPrediction { feed: transit_realtime.FeedMessage; feedTimestamp: number }

function validate(query: TripPathQuery) {
  if (query.providerId !== providerId || !["N", "S"].includes(query.directionId)) {
    throw new Error("Unsupported MTA trip path query.");
  }
}

export function tripPathBucket(tripId: string) {
  let hash = 0;
  for (let index = 0; index < tripId.length; index += 1) {
    hash = (Math.imul(hash, 31) + tripId.charCodeAt(index)) >>> 0;
  }
  return (hash % 128).toString(16).padStart(2, "0");
}

class MtaTripTopologySource implements TopologySource<ReadonlyMap<string, string>, TripPathQuery> {
  async load(query: TripPathQuery, context: ResolutionContext): Promise<Resolved<ReadonlyMap<string, string>>> {
    validate(query);
    const catalog = await loadProviderCatalog("/providers/mta-subway/catalog.json", providerId);
    return {
      data: new Map(catalog.stations.map((station) => [station.id, station.name])),
      generatedAt: context.nowSeconds,
      freshness: "static",
      sources: [{ providerId, sourceId: "mta-static-gtfs" }],
      warnings: [],
    };
  }
}

class MtaTripScheduleSource implements ScheduleSource<ScheduleCandidates, TripPathQuery> {
  async load(query: TripPathQuery, context: ResolutionContext): Promise<Resolved<ScheduleCandidates>> {
    validate(query);
    const timetable = await fetchTimetableSource(query.stationId, query.routeId, query.directionId as "N" | "S", context.signal);
    const matchingIds = new Set(Object.values(timetable.shard.services).flatMap((events) =>
      events.flatMap((event) => event.tripId && matchesStaticTripId(event.tripId, query.tripId) ? [event.tripId] : [])));
    const paths: Record<string, StaticTripPath> = {};
    const shards = await Promise.all([...new Set([...matchingIds].map(tripPathBucket))].map(async (bucket) => {
      const response = await fetch(assetUrl(`/trip-paths/${providerId}/${bucket}.json`), { signal: context.signal });
      if (!response.ok) throw new Error("Trip stop sequence could not be loaded.");
      return response.json() as Promise<StaticTripPathShard>;
    }));
    for (const shard of shards) {
      for (const tripId of matchingIds) {
        if (shard.trips[tripId]) paths[tripId] = shard.trips[tripId];
      }
    }
    return {
      data: { timetable, paths },
      generatedAt: context.nowSeconds,
      freshness: "static",
      sources: [{ providerId, sourceId: "mta-static-gtfs" }],
      warnings: [],
    };
  }
}

class MtaTripPredictionSource implements PredictionSource<MtaTripPrediction, TripPathQuery> {
  constructor(private readonly getFeed = fetchMtaFeed) {}

  async load(query: TripPathQuery, context: ResolutionContext): Promise<Resolved<MtaTripPrediction>> {
    validate(query);
    const feed = await this.getFeed(query.routeId, context.signal);
    const feedTimestamp = feed.header.timestamp == null ? 0 : Number(feed.header.timestamp.toString());
    return {
      data: { feed, feedTimestamp },
      generatedAt: context.nowSeconds,
      validUntil: feedTimestamp + 90,
      freshness: context.nowSeconds - feedTimestamp > 90 ? "stale" : "live",
      sources: [{ providerId, sourceId: "mta-gtfs-realtime", observedAt: feedTimestamp }],
      warnings: [],
    };
  }
}

function liveEpoch(value: number | { toString(): string } | null | undefined) {
  return value == null ? null : Number(value.toString());
}

function scheduleTime(dateKey: string, raw: string | null): TripStopTime | null {
  if (!raw) return null;
  return {
    time: mtaScheduledTime(newYorkServiceTimeToEpoch(dateKey, raw)),
    source: "schedule",
  };
}

function liveTime(epoch: number | null, nowSeconds: number, isPast: boolean, isFresh: boolean): TripStopTime | null {
  if (epoch == null || !Number.isFinite(epoch) || isPast || !isFresh || epoch < nowSeconds - 5) return null;
  return { time: mtaPredictedTime(epoch), source: "prediction" };
}

function selectedPrediction(feed: transit_realtime.FeedMessage | null, query: TripPathQuery) {
  if (!feed) return null;
  const matchingEntity = feed.entity.find((entity) => entity.id === query.entityId &&
    entity.tripUpdate?.trip.routeId === query.routeId);
  if (matchingEntity) return matchingEntity.tripUpdate ?? null;
  const matches = feed.entity.filter((entity) => entity.tripUpdate?.trip.routeId === query.routeId &&
    entity.tripUpdate.trip.tripId === query.tripId);
  return matches.length === 1 ? matches[0]!.tripUpdate ?? null : null;
}

function chooseStaticPath(
  candidates: ScheduleCandidates | null,
  query: TripPathQuery,
  prediction: transit_realtime.ITripUpdate | null,
) {
  if (!candidates) return null;
  const serviceDate = prediction?.trip.startDate || newYorkDateKey(new Date(query.anchorEventTime * 1_000));
  const options: Array<{ tripId: string; path: StaticTripPath; dateKey: string; distance: number | null }> = [];
  for (const dateKey of [serviceDate, shiftDateKey(serviceDate, -1)]) {
    const active = activeServiceIds(candidates.timetable.calendar, dateKey);
    for (const [tripId, path] of Object.entries(candidates.paths)) {
      if (path.routeId !== query.routeId || !active.has(path.serviceId)) continue;
      const anchor = path.stops.find((stop) => stop.stopId === `${query.stationId}${query.directionId}`);
      const raw = query.anchorEventKind === "arrival"
        ? anchor?.arrival ?? anchor?.departure
        : anchor?.departure ?? anchor?.arrival;
      if (!anchor) continue;
      options.push({
        tripId, path, dateKey,
        distance: raw ? Math.abs(newYorkServiceTimeToEpoch(dateKey, raw) - query.anchorEventTime) : null,
      });
    }
  }
  const timed = options.filter((option): option is typeof option & { distance: number } => option.distance != null)
    .sort((left, right) => left.distance - right.distance);
  if (timed.length === 1 || (timed.length > 1 && timed[1]!.distance - timed[0]!.distance >= 60)) {
    const selected = timed[0]!;
    return { path: selected.path, dateKey: selected.dateKey };
  }

  // Ambiguous or missing anchor times must not erase source-backed topology.
  // Show the common stop sequence, but suppress static clock times because the
  // service day or trip pattern is not safely resolved.
  if (options.length === 0) {
    const paths = Object.values(candidates.paths).filter((path) =>
      path.routeId === query.routeId && path.stops.some((stop) => stop.stopId === `${query.stationId}${query.directionId}`));
    const signatures = new Set(paths.map((path) => path.stops.map((stop) => stop.stopId).join(">")));
    return signatures.size === 1 ? { path: paths[0]!, dateKey: null } : null;
  }
  const signatures = new Set(options.map((option) => option.path.stops.map((stop) => stop.stopId).join(">")));
  if (signatures.size !== 1) return null;
  const only = options[0]!;
  return { path: only.path, dateKey: options.length === 1 ? only.dateKey : null };
}

/** Pure provider fusion: no UI knows MTA's trip-ID, service-day or feed quirks. */
export function resolveMtaTripPath(
  query: TripPathQuery,
  names: ReadonlyMap<string, string>,
  schedule: ScheduleCandidates | null,
  feed: transit_realtime.FeedMessage | null,
  feedFresh: boolean,
  nowSeconds: number,
): TripPath {
  const prediction = selectedPrediction(feed, query);
  const staticChoice = chooseStaticPath(schedule, query, prediction);
  const updates = prediction?.stopTimeUpdate ?? [];
  const staticStops = staticChoice?.path.stops;
  const stops = staticStops ?? updates.map((update, index) => ({
    stopId: update.stopId ?? "",
    sequence: update.stopSequence ?? index + 1,
    arrival: null,
    departure: null,
  })).filter((stop) => stop.stopId);
  const ordered = [...stops].sort((left, right) => left.sequence - right.sequence);
  const selectedIndex = ordered.findIndex((stop) => stop.stopId === `${query.stationId}${query.directionId}`);
  const updateByStop = new Map(updates.map((update) => [update.stopId, update]));

  return {
    tripId: query.tripId,
    topology: staticChoice ? "full" : "partial",
    stops: ordered.map((stop, index) => {
      const update = updateByStop.get(stop.stopId);
      const isPast = selectedIndex >= 0 && index < selectedIndex;
      const position = isPast ? "past" : index === selectedIndex ? "current" : "ahead";
      const scheduledArrival = staticChoice?.dateKey ? scheduleTime(staticChoice.dateKey, stop.arrival) : null;
      const scheduledDeparture = staticChoice?.dateKey ? scheduleTime(staticChoice.dateKey, stop.departure) : null;
      const predictedArrival = liveTime(liveEpoch(update?.arrival?.time), nowSeconds, isPast, feedFresh);
      const predictedDeparture = liveTime(liveEpoch(update?.departure?.time), nowSeconds, isPast, feedFresh);
      const departureDelayStatus = predictedDeparture?.time.kind === "estimate" &&
        scheduledDeparture?.time.kind === "exact"
        ? classifyDelay(predictedDeparture.time.epochSeconds - scheduledDeparture.time.epochSeconds).delayStatus
        : null;
      return {
        stopId: stop.stopId,
        name: names.get(stop.stopId.replace(/[NS]$/, "")) ?? stop.stopId,
        sequence: stop.sequence,
        position,
        arrival: predictedArrival ?? scheduledArrival,
        departure: predictedDeparture ?? scheduledDeparture,
        scheduledArrival,
        scheduledDeparture,
        departureDelayStatus,
      };
    }),
  };
}

const fusion: FusionPolicy<ReadonlyMap<string, string>, ScheduleCandidates, MtaTripPrediction, never, TripPath, TripPathQuery> = {
  resolve({ query, context, topology, schedule, prediction, warnings }) {
    const path = resolveMtaTripPath(
      query, topology.data, schedule?.data ?? null, prediction?.data.feed ?? null,
      prediction?.freshness === "live", context.nowSeconds,
    );
    return {
      data: path,
      generatedAt: context.nowSeconds,
      validUntil: prediction?.validUntil,
      freshness: prediction?.freshness ?? "static",
      sources: [...topology.sources, ...(schedule?.sources ?? []), ...(prediction?.sources ?? [])],
      warnings: [...warnings, ...topology.warnings, ...(schedule?.warnings ?? []), ...(prediction?.warnings ?? [])],
    };
  },
};

export const mtaTripPathResolver = new CompositeMetroDataResolver(
  new MtaTripTopologySource(), new MtaTripScheduleSource(), new MtaTripPredictionSource(), null, fusion,
);

export function fetchMtaTripPath(query: TripPathQuery, signal?: AbortSignal) {
  return mtaTripPathResolver.resolveDepartures(query, { signal, nowSeconds: Math.floor(Date.now() / 1_000) });
}
