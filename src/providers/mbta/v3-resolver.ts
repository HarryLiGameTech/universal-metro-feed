import { estimatedTime, publishedMinute } from "../../domain/strict-time";
import type { TripPath, TripPathQuery, TripStopTime } from "../../domain/trip-path";
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
import { shiftDateKey, timetableDayTypeForDate } from "../../lib/service-date";
import { loadProviderCatalog } from "../registry";
import type { Arrival, ArrivalSnapshot, Direction, TimetableDayType, TimetableEvent, TimetableResult } from "../../types";
import type { ProviderCatalog } from "../registry";

const PROVIDER_ID = "mbta-subway";
const CATALOG_URL = "/providers/mbta-subway/catalog.json";
const API_ORIGIN = "https://api-v3.mbta.com";
const TIMEZONE = "America/New_York";

interface ApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string } | null }>;
}

interface ApiPage {
  data: ApiResource[];
  included?: ApiResource[];
  links?: { next?: string | null };
  errors?: Array<{ detail?: string }>;
}

function relatedId(resource: ApiResource, key: string) {
  return resource.relationships?.[key]?.data?.id ?? null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function epoch(value: unknown) {
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? Math.floor(parsed / 1_000) : null;
}

function localDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}`;
}

function isoDate(dateKey: string) {
  return `${dateKey.slice(0, 4)}-${dateKey.slice(4, 6)}-${dateKey.slice(6, 8)}`;
}

function dateForDayType(dayType: TimetableDayType) {
  const today = localDateKey(new Date());
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = shiftDateKey(today, offset);
    if (timetableDayTypeForDate(candidate) === dayType) return candidate;
  }
  return today;
}

async function apiPages(path: string, params: Record<string, string>, signal?: AbortSignal, maxPages = 5) {
  const initial = new URL(path, API_ORIGIN);
  for (const [key, value] of Object.entries(params)) initial.searchParams.set(key, value);
  initial.searchParams.set("page[limit]", "1000");
  const data: ApiResource[] = [];
  const included = new Map<string, ApiResource>();
  let next: string | null = initial.toString();
  for (let pageNumber = 0; next && pageNumber < maxPages; pageNumber += 1) {
    const url = new URL(next);
    if (url.origin !== API_ORIGIN) throw new Error("Unexpected MBTA API page origin.");
    const response = await fetch(url, { cache: "no-store", signal });
    if (!response.ok) throw new Error(`MBTA API returned ${response.status} ${response.statusText}`);
    const page = await response.json() as ApiPage;
    if (!Array.isArray(page.data)) throw new Error(page.errors?.[0]?.detail ?? "Invalid MBTA API response.");
    data.push(...page.data);
    for (const resource of page.included ?? []) included.set(`${resource.type}:${resource.id}`, resource);
    next = page.links?.next ?? null;
  }
  if (next) throw new Error("MBTA API returned more pages than this query can safely load.");
  return { data, included };
}

async function catalog() {
  return loadProviderCatalog(CATALOG_URL, PROVIDER_ID);
}

function validate(query: PlatformQuery) {
  if (query.providerId !== PROVIDER_ID) throw new Error(`Unsupported provider: ${query.providerId}`);
}

type ApiBatch = Awaited<ReturnType<typeof apiPages>>;

class MbtaTopologySource implements TopologySource<ProviderCatalog> {
  async load(query: PlatformQuery, context: ResolutionContext): Promise<Resolved<ProviderCatalog>> {
    validate(query);
    return {
      data: await catalog(), generatedAt: context.nowSeconds, freshness: "static",
      sources: [{ providerId: PROVIDER_ID, sourceId: "mbta-static-gtfs" }], warnings: [],
    };
  }
}

class MbtaPredictionSource implements PredictionSource<ApiBatch> {
  constructor(private readonly fetchBatch: (query: PlatformQuery, signal?: AbortSignal) => Promise<ApiBatch>) {}

  async load(query: PlatformQuery, context: ResolutionContext): Promise<Resolved<ApiBatch>> {
    validate(query);
    const data = await this.fetchBatch(query, context.signal);
    const observedAt = Math.floor(Date.now() / 1_000);
    return {
      data, generatedAt: observedAt, validUntil: observedAt + 45, freshness: "live",
      sources: [{ providerId: PROVIDER_ID, sourceId: "mbta-v3-predictions", observedAt }], warnings: [],
    };
  }
}

function stopIdsFor(stationId: string, routeId: string, direction: Direction, stations: Awaited<ReturnType<typeof catalog>>["stations"]) {
  const station = stations.find((item) => item.id === stationId);
  const route = station?.routes.find((item) => item.routeId === routeId);
  return new Set(route?.stopIds?.[direction] ?? []);
}

function predictionTime(value: number, uncertainty: unknown) {
  const tolerance = typeof uncertainty === "number" && Number.isFinite(uncertainty) && uncertainty >= 0
    ? uncertainty : null;
  return estimatedTime(value, TIMEZONE, "second", tolerance);
}

function normalizeMbtaArrivals(query: PlatformQuery, providerCatalog: ProviderCatalog, batch: ApiBatch): ArrivalSnapshot {
  const { data, included } = batch;
  const allowedStops = stopIdsFor(query.stationId, query.routeId, query.directionId, providerCatalog.stations);
  const arrivals: Arrival[] = [];
  const observedAt = Math.floor(Date.now() / 1_000);
  for (const resource of data) {
    const routeId = relatedId(resource, "route");
    const stopId = relatedId(resource, "stop");
    const tripId = relatedId(resource, "trip");
    if (routeId !== query.routeId || !stopId || !tripId || !allowedStops.has(stopId)) continue;
    if (String(resource.attributes.direction_id) !== query.directionId || resource.attributes.schedule_relationship === "CANCELLED") continue;
    const arrivalTime = epoch(resource.attributes.arrival_time);
    const departureTime = epoch(resource.attributes.departure_time);
    const eventTime = arrivalTime ?? departureTime;
    if (eventTime == null || eventTime < observedAt - 5) continue;
    const trip = included.get(`trip:${tripId}`);
    const headsign = stringValue(resource.attributes.trip_headsign) ?? stringValue(trip?.attributes.headsign);
    arrivals.push({
      id: resource.id,
      tripId,
      routeId,
      stopId,
      direction: query.directionId,
      destinationId: null,
      destinationName: headsign ?? "Destination not supplied",
      eventTime,
      eventKind: arrivalTime == null ? "departure" : "arrival",
      scheduledTime: null,
      delaySeconds: null,
      delayStatus: "undetermined",
      delayLabel: "Schedule comparison unavailable",
      displayTime: predictionTime(eventTime, arrivalTime == null
        ? resource.attributes.departure_uncertainty : resource.attributes.arrival_uncertainty),
    });
  }
  const unique = new Map<string, Arrival>();
  for (const arrival of arrivals.sort((left, right) => left.eventTime - right.eventTime)) {
    const key = `${arrival.routeId}:${arrival.tripId}:${arrival.direction}`;
    if (!unique.has(key)) unique.set(key, arrival);
  }
  return { arrivals: [...unique.values()], feedTimestamp: observedAt, fetchedAt: observedAt };
}

const mbtaArrivalFusion: FusionPolicy<ProviderCatalog, never, ApiBatch, never, ArrivalSnapshot> = {
  resolve({ query, topology, prediction, context, warnings }) {
    if (!prediction) throw new Error(warnings.find((warning) => warning.source === "prediction")?.message ?? "MBTA predictions unavailable.");
    return {
      data: normalizeMbtaArrivals(query, topology.data, prediction.data),
      generatedAt: context.nowSeconds,
      validUntil: prediction.validUntil,
      freshness: prediction.freshness,
      sources: [...topology.sources, ...prediction.sources],
      warnings: [...topology.warnings, ...prediction.warnings, ...warnings],
    };
  },
};

export async function fetchMbtaArrivals(
  stationId: string,
  routeIds: readonly string[],
  direction: Direction,
  signal?: AbortSignal,
): Promise<ArrivalSnapshot> {
  if (routeIds.length === 0) throw new Error("Select at least one line.");
  // A shared directed segment can contain several MBTA routes. Query them in
  // one browser request, then resolve each route through the same contract.
  let pending: Promise<ApiBatch> | null = null;
  const source = new MbtaPredictionSource((_query, requestSignal) => {
    if (!pending) pending = apiPages("/predictions", {
      "filter[stop]": stationId,
      "filter[route]": routeIds.join(","),
      include: "trip",
    }, requestSignal);
    return pending;
  });
  const resolver = new CompositeMetroDataResolver(
    new MbtaTopologySource(), null, source, null, mbtaArrivalFusion,
  );
  const results = await Promise.allSettled(routeIds.map((routeId) => resolver.resolveDepartures(
    { providerId: PROVIDER_ID, stationId, routeId, directionId: direction },
    { signal, nowSeconds: Math.floor(Date.now() / 1_000) },
  )));
  if (signal?.aborted) throw signal.reason ?? new Error("Request aborted.");
  const successful = results.flatMap((result) => result.status === "fulfilled" ? [result.value.data] : []);
  if (successful.length === 0) {
    const failure = results.find((result) => result.status === "rejected");
    throw failure?.status === "rejected" ? failure.reason : new Error("No MBTA predictions are available.");
  }
  const unavailableRoutes = routeIds.filter((_, index) => results[index]?.status === "rejected");
  return {
    arrivals: successful.flatMap((snapshot) => snapshot.arrivals).sort((left, right) => left.eventTime - right.eventTime),
    feedTimestamp: Math.min(...successful.map((snapshot) => snapshot.feedTimestamp)),
    fetchedAt: Math.max(...successful.map((snapshot) => snapshot.fetchedAt)),
    ...(unavailableRoutes.length > 0 ? { unavailableRoutes } : {}),
  };
}

export async function fetchMbtaTimetable(
  stationId: string,
  routeIds: readonly string[],
  direction: Direction,
  dayType: TimetableDayType,
  signal?: AbortSignal,
): Promise<TimetableResult> {
  if (routeIds.length === 0) throw new Error("Select at least one line.");
  const providerCatalog = await catalog();
  const dateKey = dateForDayType(dayType);
  const { data } = await apiPages("/schedules", {
    "filter[stop]": stationId,
    "filter[route]": routeIds.join(","),
    "filter[date]": isoDate(dateKey),
  }, signal);
  const allowedStops = new Map(routeIds.map((routeId) => [routeId, stopIdsFor(stationId, routeId, direction, providerCatalog.stations)]));
  const byHour = new Map<number, TimetableEvent[]>();
  const seen = new Set<string>();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  for (const resource of data) {
    const routeId = relatedId(resource, "route");
    const stopId = relatedId(resource, "stop");
    const tripId = relatedId(resource, "trip");
    if (!routeId || !stopId || !allowedStops.get(routeId)?.has(stopId)) continue;
    if (String(resource.attributes.direction_id) !== direction) continue;
    const departure = epoch(resource.attributes.departure_time);
    const arrival = epoch(resource.attributes.arrival_time);
    const time = departure ?? arrival;
    if (time == null) continue;
    const clock = formatter.format(time * 1_000);
    const [hour = NaN, minute = NaN] = clock.split(":").map(Number);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) continue;
    const key = `${routeId}:${tripId}:${clock}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = byHour.get(hour) ?? [];
    row.push({
      seconds: hour * 3_600 + minute * 60,
      minute: String(minute).padStart(2, "0"),
      hasHalfMinute: false,
      exactTime: clock,
      eventKind: departure == null ? "arrival" : "departure",
      ...(routeIds.length > 1 ? { routeId } : {}),
    });
    byHour.set(hour, row);
  }
  const hours = [...byHour.entries()].sort(([left], [right]) => left - right)
    .map(([hour, events]) => ({ hour, events: events.sort((left, right) => left.seconds - right.seconds) }));
  return {
    dateKey,
    dayType,
    availableDays: ["weekday", "saturday", "sunday"],
    hours,
    scheduledTrainCount: hours.reduce((count, hour) => count + hour.events.length, 0),
  };
}

function stopTime(value: unknown, uncertainty?: unknown, source: "prediction" | "schedule" = "schedule"): TripStopTime | null {
  const time = epoch(value);
  if (time == null) return null;
  if (source === "prediction") return { time: predictionTime(time, uncertainty), source };
  const minute = Math.floor(time / 60) * 60;
  return { time: publishedMinute(minute, TIMEZONE, "unknown"), source };
}

function resolveMbtaTripPath(
  query: TripPathQuery,
  providerCatalog: ProviderCatalog,
  schedule: ApiBatch | null,
  prediction: ApiBatch | null,
  now: number,
): TripPath {
  if (!schedule && !prediction) throw new Error("MBTA trip schedule and predictions are unavailable.");
  const allowedStopIds = stopIdsFor(query.stationId, query.routeId, query.directionId, providerCatalog.stations);
  const scheduledRows = (schedule?.data ?? []).filter((row) => relatedId(row, "route") === query.routeId &&
    String(row.attributes.direction_id) === query.directionId);
  const liveRows = (prediction?.data ?? []).filter((row) => relatedId(row, "route") === query.routeId &&
    String(row.attributes.direction_id) === query.directionId);
  const rows = scheduledRows.length > 0 ? scheduledRows : liveRows;
  const liveByStop = new Map(liveRows.map((row) => [relatedId(row, "stop"), row]));
  const names = new Map<string, string>();
  for (const resource of [...(schedule?.included.values() ?? []), ...(prediction?.included.values() ?? [])]) {
    if (resource.type === "stop") names.set(resource.id, stringValue(resource.attributes.name) ?? resource.id);
  }
  const ordered = [...rows].sort((left, right) => Number(left.attributes.stop_sequence) - Number(right.attributes.stop_sequence));
  const currentIndex = ordered.findIndex((row) => allowedStopIds.has(relatedId(row, "stop") ?? ""));
  const stops = ordered.map((row, index) => {
    const stopId = relatedId(row, "stop") ?? "";
    const live = liveByStop.get(stopId);
    const isPast = currentIndex >= 0 && index < currentIndex;
    const scheduleArrival = scheduledRows.length > 0 ? stopTime(row.attributes.arrival_time) : null;
    const scheduleDeparture = scheduledRows.length > 0 ? stopTime(row.attributes.departure_time) : null;
    const liveArrival = !isPast && live ? stopTime(live.attributes.arrival_time, live.attributes.arrival_uncertainty, "prediction") : null;
    const liveDeparture = !isPast && live ? stopTime(live.attributes.departure_time, live.attributes.departure_uncertainty, "prediction") : null;
    const usableLiveArrival = liveArrival?.time.kind === "estimate" && liveArrival.time.epochSeconds >= now - 5 ? liveArrival : null;
    const usableLiveDeparture = liveDeparture?.time.kind === "estimate" && liveDeparture.time.epochSeconds >= now - 5 ? liveDeparture : null;
    return {
      stopId,
      name: names.get(stopId) ?? stopId,
      sequence: Number(row.attributes.stop_sequence) || index + 1,
      position: (isPast ? "past" : index === currentIndex ? "current" : "ahead") as "past" | "current" | "ahead",
      arrival: usableLiveArrival ?? scheduleArrival,
      departure: usableLiveDeparture ?? scheduleDeparture,
      scheduledArrival: scheduleArrival,
      scheduledDeparture: scheduleDeparture,
      departureDelayStatus: null,
    };
  });
  return { tripId: query.tripId, topology: scheduledRows.length > 0 ? "full" : "partial", stops };
}

class MbtaTripTopologySource implements TopologySource<ProviderCatalog, TripPathQuery> {
  async load(query: TripPathQuery, context: ResolutionContext): Promise<Resolved<ProviderCatalog>> {
    validate(query);
    return {
      data: await catalog(), generatedAt: context.nowSeconds, freshness: "static",
      sources: [{ providerId: PROVIDER_ID, sourceId: "mbta-static-gtfs" }], warnings: [],
    };
  }
}

class MbtaTripScheduleSource implements ScheduleSource<ApiBatch, TripPathQuery> {
  async load(query: TripPathQuery, context: ResolutionContext): Promise<Resolved<ApiBatch>> {
    validate(query);
    return {
      data: await apiPages("/schedules", { "filter[trip]": query.tripId, include: "stop" }, context.signal, 2),
      generatedAt: context.nowSeconds, freshness: "static",
      sources: [{ providerId: PROVIDER_ID, sourceId: "mbta-v3-schedules" }], warnings: [],
    };
  }
}

class MbtaTripPredictionSource implements PredictionSource<ApiBatch, TripPathQuery> {
  async load(query: TripPathQuery, context: ResolutionContext): Promise<Resolved<ApiBatch>> {
    validate(query);
    const data = await apiPages("/predictions", { "filter[trip]": query.tripId, include: "stop" }, context.signal, 2);
    const observedAt = Math.floor(Date.now() / 1_000);
    return {
      data, generatedAt: observedAt, validUntil: observedAt + 45, freshness: "live",
      sources: [{ providerId: PROVIDER_ID, sourceId: "mbta-v3-predictions", observedAt }], warnings: [],
    };
  }
}

const mbtaTripFusion: FusionPolicy<ProviderCatalog, ApiBatch, ApiBatch, never, TripPath, TripPathQuery> = {
  resolve({ query, topology, schedule, prediction, context, warnings }) {
    return {
      data: resolveMbtaTripPath(query, topology.data, schedule?.data ?? null, prediction?.data ?? null, context.nowSeconds),
      generatedAt: context.nowSeconds,
      ...(prediction?.validUntil ? { validUntil: prediction.validUntil } : {}),
      freshness: prediction?.freshness ?? "static",
      sources: [...topology.sources, ...(schedule?.sources ?? []), ...(prediction?.sources ?? [])],
      warnings: [...topology.warnings, ...(schedule?.warnings ?? []), ...(prediction?.warnings ?? []), ...warnings],
    };
  },
};

export const mbtaTripResolver = new CompositeMetroDataResolver(
  new MbtaTripTopologySource(), new MbtaTripScheduleSource(), new MbtaTripPredictionSource(), null, mbtaTripFusion,
);

export function fetchMbtaTripPath(query: TripPathQuery, signal?: AbortSignal): Promise<Resolved<TripPath>> {
  return mbtaTripResolver.resolveDepartures(query, { signal, nowSeconds: Math.floor(Date.now() / 1_000) });
}
