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

export interface ProviderManifest {
  schemaVersion: 1;
  id: string;
  timezone: string;
  sourceUrl?: string;
  refreshIntervalMs?: number;
  defaultStationId?: string;
  topology: { kind: "clockface-compat-static" | "gtfs-static"; catalogUrl: string };
  schedule: { kind: "gtfs-static" | "mbta-v3" | "none" };
  predictions: { kind: "gtfs-realtime" | "mbta-v3" | "none"; adapter?: string };
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
      !["clockface-compat-static", "gtfs-static"].includes(String(value.topology.kind)) ||
      typeof value.topology.catalogUrl !== "string" ||
      !isRecord(value.schedule) || !["gtfs-static", "mbta-v3", "none"].includes(String(value.schedule.kind)) ||
      !isRecord(value.predictions) || !["gtfs-realtime", "mbta-v3", "none"].includes(String(value.predictions.kind)) ||
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
