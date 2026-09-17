import type { transit_realtime } from "gtfs-realtime-bindings";
import {
  CompositeMetroDataResolver,
  type FusionPolicy,
  type PlatformQuery,
  type PredictionSource,
  type Resolved,
  type ResolutionContext,
  type ScheduleSource,
  type TopologySource,
} from "../../domain/resolver";
import type { StrictTime } from "../../domain/strict-time";
import { feedNameForRoute, fetchMtaFeed, normalizeArrivals } from "../../lib/mta";
import { fetchTimetableSource, type TimetableSource } from "../../lib/timetable";
import { loadProviderCatalog } from "../registry";
import type { Arrival, ArrivalSnapshot, Direction } from "../../types";
import { mtaPredictedTime, mtaScheduledTime } from "./time-policy";

const providerId = "mta-subway";

interface MtaTopology {
  stationNames: ReadonlyMap<string, string>;
}

interface MtaFeedSnapshot {
  feed: transit_realtime.FeedMessage;
  feedTimestamp: number;
  fetchedAt: number;
}

export interface ResolvedMtaArrival extends Omit<Arrival, "eventTime" | "scheduledTime"> {
  predictionTime: StrictTime;
  scheduleTime: StrictTime | null;
}

export interface MtaDepartures {
  arrivals: ResolvedMtaArrival[];
  feedTimestamp: number;
  fetchedAt: number;
}

function validateQuery(query: PlatformQuery): Direction {
  if (query.providerId !== providerId) throw new Error(`Unsupported provider: ${query.providerId}`);
  if (query.directionId !== "N" && query.directionId !== "S") {
    throw new Error(`Unsupported MTA direction: ${query.directionId}`);
  }
  return query.directionId;
}

class MtaTopologySource implements TopologySource<MtaTopology> {
  async load(query: PlatformQuery, context: ResolutionContext): Promise<Resolved<MtaTopology>> {
    validateQuery(query);
    const catalog = await loadProviderCatalog("/providers/mta-subway/catalog.json", providerId);
    return {
      data: { stationNames: new Map(catalog.stations.map((station) => [station.id, station.name])) },
      generatedAt: context.nowSeconds,
      freshness: "static",
      sources: [{ providerId, sourceId: "mta-static-gtfs" }],
      warnings: [],
    };
  }
}

class MtaScheduleSource implements ScheduleSource<TimetableSource> {
  async load(query: PlatformQuery, context: ResolutionContext): Promise<Resolved<TimetableSource>> {
    const direction = validateQuery(query);
    const data = await fetchTimetableSource(query.stationId, query.routeId, direction, context.signal);
    return {
      data,
      generatedAt: context.nowSeconds,
      freshness: "static",
      sources: [{ providerId, sourceId: "mta-static-gtfs" }],
      warnings: [],
    };
  }
}

class MtaPredictionSource implements PredictionSource<MtaFeedSnapshot> {
  constructor(private readonly getFeed = fetchMtaFeed) {}

  async load(query: PlatformQuery, context: ResolutionContext): Promise<Resolved<MtaFeedSnapshot>> {
    validateQuery(query);
    const feed = await this.getFeed(query.routeId, context.signal);
    const feedTimestamp = feed.header.timestamp == null ? 0 : Number(feed.header.timestamp.toString());
    const fetchedAt = Math.floor(Date.now() / 1_000);
    return {
      data: { feed, feedTimestamp, fetchedAt },
      generatedAt: fetchedAt,
      validUntil: feedTimestamp + 90,
      freshness: context.nowSeconds - feedTimestamp > 90 ? "stale" : "live",
      sources: [{ providerId, sourceId: "mta-gtfs-realtime", observedAt: feedTimestamp }],
      warnings: [],
    };
  }
}

const mtaFusionPolicy: FusionPolicy<MtaTopology, TimetableSource, MtaFeedSnapshot, never, MtaDepartures> = {
  resolve({ query, topology, schedule, prediction, context, warnings }) {
    if (!prediction) throw new Error(warnings.find((warning) => warning.source === "prediction")?.message ?? "MTA realtime feed unavailable");
    const direction = validateQuery(query);
    const snapshot = normalizeArrivals(
      prediction.data.feed,
      query.stationId,
      query.routeId,
      direction,
      schedule?.data,
      topology.data.stationNames,
    );

    return {
      data: {
        arrivals: snapshot.arrivals.map((arrival) => {
          const { eventTime, scheduledTime, ...other } = arrival;
          return {
            ...other,
            predictionTime: mtaPredictedTime(eventTime),
            scheduleTime: scheduledTime == null ? null : mtaScheduledTime(scheduledTime),
          };
        }),
        feedTimestamp: snapshot.feedTimestamp,
        fetchedAt: snapshot.fetchedAt,
      },
      generatedAt: context.nowSeconds,
      validUntil: prediction.validUntil,
      freshness: prediction.freshness,
      sources: [...topology.sources, ...(schedule?.sources ?? []), ...prediction.sources],
      warnings: [...warnings, ...topology.warnings, ...(schedule?.warnings ?? []), ...prediction.warnings],
    };
  },
};

export const mtaResolver = new CompositeMetroDataResolver(
  new MtaTopologySource(),
  new MtaScheduleSource(),
  new MtaPredictionSource(),
  null,
  mtaFusionPolicy,
);

/** Compatibility projection while the existing board is migrated to StrictTime. */
export function toLegacyArrivalSnapshot(resolved: Resolved<MtaDepartures>): ArrivalSnapshot {
  return {
    arrivals: resolved.data.arrivals.map((arrival): Arrival => {
      const { predictionTime, scheduleTime, ...other } = arrival;
      if (predictionTime.kind !== "estimate") throw new Error("MTA prediction must be an estimate.");
      return {
        ...other,
        eventTime: predictionTime.epochSeconds,
        scheduledTime: scheduleTime?.kind === "exact" ? scheduleTime.epochSeconds : null,
      };
    }),
    feedTimestamp: resolved.data.feedTimestamp,
    fetchedAt: resolved.data.fetchedAt,
  };
}

export async function fetchComposedMtaArrivals(
  stationId: string,
  routeId: string,
  direction: Direction,
  signal?: AbortSignal,
) {
  const result = await mtaResolver.resolveDepartures(
    { providerId, stationId, routeId, directionId: direction },
    { signal, nowSeconds: Math.floor(Date.now() / 1_000) },
  );
  return toLegacyArrivalSnapshot(result);
}

export async function fetchComposedMtaArrivalsForRoutes(
  stationId: string,
  routeIds: readonly string[],
  direction: Direction,
  signal?: AbortSignal,
): Promise<ArrivalSnapshot> {
  if (routeIds.length === 0) throw new Error("Select at least one line.");
  if (routeIds.length === 1) return fetchComposedMtaArrivals(stationId, routeIds[0]!, direction, signal);

  // Multiple MTA routes frequently share a GTFS-Realtime endpoint. Resolve
  // each route through the same composed pipeline, but download that feed once.
  const feedPromises = new Map<string, Promise<transit_realtime.FeedMessage>>();
  const predictionSource = new MtaPredictionSource((routeId, requestSignal) => {
    const feedName = feedNameForRoute(routeId);
    let pending = feedPromises.get(feedName);
    if (!pending) {
      pending = fetchMtaFeed(routeId, requestSignal);
      feedPromises.set(feedName, pending);
    }
    return pending;
  });
  const resolver = new CompositeMetroDataResolver(
    new MtaTopologySource(),
    new MtaScheduleSource(),
    predictionSource,
    null,
    mtaFusionPolicy,
  );
  const results = await Promise.allSettled(routeIds.map((routeId) => resolver.resolveDepartures(
    { providerId, stationId, routeId, directionId: direction },
    { signal, nowSeconds: Math.floor(Date.now() / 1_000) },
  )));
  if (signal?.aborted) throw signal.reason ?? new Error("Request aborted.");

  const successful = results.flatMap((result) => result.status === "fulfilled" ? [toLegacyArrivalSnapshot(result.value)] : []);
  if (successful.length === 0) {
    const failure = results.find((result) => result.status === "rejected");
    throw failure?.status === "rejected" ? failure.reason : new Error("No MTA realtime feeds are available.");
  }
  const unavailableRoutes = routeIds.filter((_, index) => results[index]?.status === "rejected");
  return {
    arrivals: successful.flatMap((snapshot) => snapshot.arrivals).sort((left, right) => left.eventTime - right.eventTime),
    feedTimestamp: Math.min(...successful.map((snapshot) => snapshot.feedTimestamp)),
    fetchedAt: Math.max(...successful.map((snapshot) => snapshot.fetchedAt)),
    ...(unavailableRoutes.length > 0 ? { unavailableRoutes } : {}),
  };
}
