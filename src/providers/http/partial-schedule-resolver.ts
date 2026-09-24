import { CompositeMetroDataResolver, type PlatformQuery, type Resolved, type ResolutionContext, type ResolutionWarning } from "../../domain/resolver";
import type { StrictTime } from "../../domain/strict-time";
import type { Arrival, ArrivalLoader, ArrivalSnapshot } from "../../types";
import { catalogUrlForProvider, loadProviderCatalog, type ProviderCatalog, type ProviderManifest } from "../registry";
import { ProprietaryHttpResolver, type HttpCodec } from "./proprietary-http-resolver";

/** Protocol adapters describe published events, never inferred trips or predictions. */
export interface HttpScheduleRecord {
  stationId: string;
  routeId: string;
  directionId: string;
  arrival: StrictTime | null;
  departure: StrictTime | null;
}

export type HttpScheduleAdapter = HttpCodec<HttpScheduleRecord[], HttpScheduleRecord[]>;

interface HttpScheduleSnapshot {
  records: HttpScheduleRecord[];
  fetchedAt: number;
}

function scheduleEpoch(time: StrictTime): number {
  if (time.kind === "exact") return time.epochSeconds;
  if (time.kind === "published-minute") return time.minuteStartEpochSeconds;
  throw new Error("A published schedule event must have an established time policy.");
}

/** Partial station schedule policy, separate from reusable HTTP source resolution. */
export class PartialScheduleResolver {
  private readonly http: ProprietaryHttpResolver<HttpScheduleRecord[], HttpScheduleRecord[]>;
  constructor(
    private readonly manifest: ProviderManifest,
    adapter: HttpScheduleAdapter,
    private readonly getCatalog = () => loadProviderCatalog(catalogUrlForProvider(manifest), manifest.id),
    request: typeof fetch = (...args) => fetch(...args),
  ) {
    if (manifest.schedule.kind !== "proprietary-http" || manifest.schedule.coverage !== "partial" ||
        !manifest.schedule.urlTemplate.includes("{stationId}") || manifest.predictions.kind !== "none") {
      throw new Error("The partial schedule policy requires a proprietary schedule and no predictions.");
    }
    this.http = new ProprietaryHttpResolver({
      providerId: manifest.id, timezone: manifest.timezone, role: "schedule",
      validForSeconds: (manifest.refreshIntervalMs ?? 30_000) / 1_000,
    }, adapter, request);
  }

  private async loadSchedule(stationId: string, context: ResolutionContext): Promise<Resolved<HttpScheduleSnapshot>> {
    const schedule = this.manifest.schedule;
    if (schedule.kind !== "proprietary-http") throw new Error("HTTP schedule is not configured.");
    const url = schedule.urlTemplate.replaceAll("{stationId}", encodeURIComponent(stationId));
    const result = await this.http.load({ url }, context);
    return {
      ...result, data: { records: result.data, fetchedAt: result.generatedAt },
    };
  }

  private normalize(query: PlatformQuery, catalog: ProviderCatalog, snapshot: HttpScheduleSnapshot): ArrivalSnapshot {
    const station = catalog.stations.find((item) => item.id === query.stationId)!;
    const route = station.routes.find((item) => item.routeId === query.routeId)!;
    const eventKind = route.originDirections?.includes(query.directionId) ? "departure" : "arrival";
    const directionName = route.headsigns?.[query.directionId]?.join(" / ") ??
      route.directionNames?.[query.directionId] ?? `Direction ${query.directionId}`;
    const arrivals = new Map<string, Arrival>();
    for (const row of snapshot.records) {
      if (row.stationId !== query.stationId || row.routeId !== query.routeId || row.directionId !== query.directionId) continue;
      const time = row[eventKind];
      // A missing arrival cannot be replaced with a departure (or vice versa).
      if (!time) continue;
      const eventTime = scheduleEpoch(time);
      const recordKey = `${query.providerId}:${row.stationId}:${row.routeId}:${row.directionId}:${eventKind}:${eventTime}`;
      arrivals.set(recordKey, {
        id: `${recordKey}:${snapshot.fetchedAt}`,
        tripId: null,
        identityStability: "snapshot-only",
        timeSource: "schedule",
        routeId: row.routeId,
        stopId: row.stationId,
        direction: row.directionId,
        destinationId: null,
        destinationName: directionName,
        destinationKind: "direction",
        eventTime,
        eventKind,
        scheduledTime: eventTime,
        displayTime: time,
        delaySeconds: null,
        delayStatus: "undetermined",
        delayLabel: "",
      });
    }
    return {
      arrivals: [...arrivals.values()].sort((left, right) => left.eventTime - right.eventTime),
      feedTimestamp: null,
      fetchedAt: snapshot.fetchedAt,
    };
  }

  async resolveArrivals(
    stationId: string,
    routeIds: readonly string[],
    directionId: string,
    context: ResolutionContext,
  ): Promise<Resolved<ArrivalSnapshot>> {
    context.signal?.throwIfAborted();
    if (routeIds.length === 0) throw new Error("Select at least one line.");
    const catalog = await this.getCatalog();
    const station = catalog.stations.find((item) => item.id === stationId);
    const selectedRoutes = [...new Set(routeIds)];
    if (catalog.providerId !== this.manifest.id || !station || selectedRoutes.some((routeId) =>
      !station.routes.some((route) => route.routeId === routeId && route.directions.includes(directionId)))) {
      throw new Error("The selected station, line, or direction is not in the provider directory.");
    }
    const topology: Resolved<ProviderCatalog> = {
      data: catalog, generatedAt: context.nowSeconds, freshness: "static",
      sources: [{ providerId: this.manifest.id, sourceId: catalogUrlForProvider(this.manifest) }], warnings: [],
    };
    // One station response commonly contains several routes and directions.
    const resolver = new CompositeMetroDataResolver<ProviderCatalog, HttpScheduleSnapshot, never, never, ArrivalSnapshot>(
      { load: async () => topology },
      { load: async () => this.loadSchedule(stationId, context) },
      null,
      null,
      { resolve: ({ query, schedule, warnings }) => {
        if (!schedule) throw new Error(warnings.find((warning) => warning.source === "schedule")?.message ?? "Schedule unavailable.");
        return {
          ...schedule,
          data: this.normalize(query, catalog, schedule.data),
          sources: [...topology.sources, ...schedule.sources],
          warnings,
        };
      } },
    );
    const results = await Promise.all(selectedRoutes.map((routeId) => resolver.resolveDepartures(
      { providerId: this.manifest.id, stationId, routeId, directionId }, context,
    )));
    context.signal?.throwIfAborted();
    const first = results[0]!;
    const warnings: ResolutionWarning[] = results.flatMap((result) => result.warnings);
    return {
      ...first,
      data: {
        arrivals: results.flatMap((result) => result.data.arrivals)
          .filter((arrival) => arrival.eventTime >= context.nowSeconds - 5)
          .sort((left, right) => left.eventTime - right.eventTime),
        feedTimestamp: null,
        fetchedAt: first.data.fetchedAt,
      },
      warnings,
    };
  }

  readonly loadArrivals: ArrivalLoader = async (stationId, routeIds, directionId, signal) =>
    (await this.resolveArrivals(stationId, routeIds, directionId, {
      signal, nowSeconds: Math.floor(Date.now() / 1_000),
    })).data;
}
