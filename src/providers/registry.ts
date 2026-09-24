import type { Route, Station } from "../types";
import { assetUrl } from "../lib/asset-url";

export interface ProviderDescriptor {
  id: string;
  names: Record<string, string>;
  cities: Array<{ id: string; names: Record<string, string> }>;
  manifest: string;
  introduction?: { kicker: string; description: string; locality: string; attribution: string };
}

export interface ProviderRegistry {
  schemaVersion: 1;
  providers: ProviderDescriptor[];
}

export interface ProprietaryHttpConfig {
  kind: "proprietary-http";
  adapter: string;
  urlTemplate: string;
}

export interface GtfsRealtimeConfig {
  kind: "gtfs-realtime";
  /** Omitted only for legacy adapters that resolve their own endpoint, such as MTA. */
  urlTemplate?: string;
  adapter?: string;
}

export type OptionalGtfsRealtimeConfig = GtfsRealtimeConfig | { kind: "none" };

export type TopologyConfig =
  | { kind: "clockface-compat-static" | "gtfs-static" | "station-directory"; catalogUrl: string }
  | { kind: "none" };

export interface ProviderManifest {
  schemaVersion: 1;
  id: string;
  timezone: string;
  sourceUrl?: string;
  refreshIntervalMs?: number;
  defaultStationId?: string;
  topology: TopologyConfig;
  schedule: { kind: "gtfs-static" | "none" } | (ProprietaryHttpConfig & { coverage: "partial" | "full-day" });
  predictions: OptionalGtfsRealtimeConfig | ProprietaryHttpConfig;
  observations?: OptionalGtfsRealtimeConfig;
  alerts?: OptionalGtfsRealtimeConfig;
}

export interface ProviderCatalog {
  providerId: string;
  timezone: string;
  routes: Record<string, Route>;
  stations: readonly Station[];
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(assetUrl(url));
  if (!response.ok) throw new Error(`Could not load provider data from ${url} (${response.status}).`);
  return response.json() as Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function isHttpConfig(value: Record<string, unknown>): boolean {
  if (typeof value.adapter !== "string" || !value.adapter || typeof value.urlTemplate !== "string") return false;
  try {
    return new URL(value.urlTemplate).protocol === "https:";
  } catch {
    return false;
  }
}

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isGtfsRealtimeConfig(value: unknown, allowAdapterEndpoint = false): value is GtfsRealtimeConfig {
  if (!isRecord(value) || value.kind !== "gtfs-realtime" ||
      (value.adapter !== undefined && (typeof value.adapter !== "string" || !value.adapter))) return false;
  if (value.urlTemplate !== undefined && !isHttpsUrl(value.urlTemplate)) return false;
  return isHttpsUrl(value.urlTemplate) || (allowAdapterEndpoint && typeof value.adapter === "string");
}

function isOptionalGtfsRealtimeConfig(value: unknown) {
  return isRecord(value) && (value.kind === "none" || isGtfsRealtimeConfig(value));
}

export function parseProviderRegistry(value: unknown): ProviderRegistry {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.providers)) {
    throw new Error("Unsupported provider registry schema.");
  }
  const providers = value.providers;
  const ids = new Set<string>();
  for (const provider of providers) {
    if (!isRecord(provider) || typeof provider.id !== "string" || !provider.id ||
        !isRecord(provider.names) || typeof provider.manifest !== "string" ||
        (provider.introduction !== undefined && (!isRecord(provider.introduction) ||
          ["kicker", "description", "locality", "attribution"].some((key) => typeof (provider.introduction as Record<string, unknown>)[key] !== "string"))) ||
        !Array.isArray(provider.cities) || provider.cities.some((city: unknown) =>
          !isRecord(city) || typeof city.id !== "string" || !isRecord(city.names))) {
      throw new Error("Invalid provider registry entry.");
    }
    if (ids.has(provider.id)) throw new Error(`Duplicate provider ID: ${provider.id}`);
    ids.add(provider.id);
  }
  return value as unknown as ProviderRegistry;
}

export function parseProviderManifest(value: unknown, expectedId: string): ProviderManifest {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.id !== expectedId ||
      typeof value.timezone !== "string" || !isRecord(value.topology) ||
      !["clockface-compat-static", "gtfs-static", "station-directory", "none"].includes(String(value.topology.kind)) ||
      (value.topology.kind !== "none" && typeof value.topology.catalogUrl !== "string") ||
      !isRecord(value.schedule) || !["gtfs-static", "proprietary-http", "none"].includes(String(value.schedule.kind)) ||
      (value.schedule.kind === "proprietary-http" && (!isHttpConfig(value.schedule) ||
        !["partial", "full-day"].includes(String(value.schedule.coverage)))) ||
      !isRecord(value.predictions) || !["gtfs-realtime", "proprietary-http", "none"].includes(String(value.predictions.kind)) ||
      (value.predictions.kind === "gtfs-realtime" && !isGtfsRealtimeConfig(value.predictions, true)) ||
      (value.predictions.kind === "proprietary-http" && !isHttpConfig(value.predictions)) ||
      (value.observations !== undefined && !isOptionalGtfsRealtimeConfig(value.observations)) ||
      (value.alerts !== undefined && !isOptionalGtfsRealtimeConfig(value.alerts)) ||
      (value.sourceUrl !== undefined && typeof value.sourceUrl !== "string") ||
      (value.defaultStationId !== undefined && typeof value.defaultStationId !== "string") ||
      (value.refreshIntervalMs !== undefined && (typeof value.refreshIntervalMs !== "number" || value.refreshIntervalMs < 5_000))) {
    throw new Error(`Invalid provider manifest: ${expectedId}`);
  }
  return value as unknown as ProviderManifest;
}

export function parseProviderCatalog(value: unknown, expectedId: string): ProviderCatalog {
  if (!isRecord(value) || value.providerId !== expectedId || typeof value.timezone !== "string" ||
      !isRecord(value.routes) || !Array.isArray(value.stations)) {
    throw new Error(`Invalid provider catalog: ${expectedId}`);
  }
  return value as unknown as ProviderCatalog;
}

export async function loadProviderRegistry() {
  return parseProviderRegistry(await fetchJson("/providers/index.json"));
}

export async function loadProviderManifest(descriptor: ProviderDescriptor) {
  return parseProviderManifest(await fetchJson(descriptor.manifest), descriptor.id);
}

export function catalogUrlForProvider(manifest: ProviderManifest) {
  if (manifest.topology.kind === "none") throw new Error(`Provider ${manifest.id} has no topology source.`);
  return manifest.topology.catalogUrl;
}

const catalogCache = new Map<string, Promise<ProviderCatalog>>();

export function loadProviderCatalog(url: string, providerId: string): Promise<ProviderCatalog> {
  const cacheKey = `${providerId}:${url}`;
  const cached = catalogCache.get(cacheKey);
  if (cached) return cached;
  const loading = fetchJson(url)
    .then((value) => parseProviderCatalog(value, providerId))
    .catch((error: unknown) => {
      catalogCache.delete(cacheKey);
      throw error;
    });
  catalogCache.set(cacheKey, loading);
  return loading;
}
