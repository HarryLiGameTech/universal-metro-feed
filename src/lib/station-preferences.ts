import type { Station } from "../types";

/** Station IDs are only unique within a provider (which also identifies its city/system). */
export interface StationReference {
  providerId: string;
  stationId: string;
}

export const LAST_STATION_COOKIE = "metro_last_station_v1";
export const FAVORITES_COOKIE = "metro_favorites_v1";
const MAX_COOKIE_LENGTH = 3800;
const MAX_AGE = 365 * 24 * 60 * 60;

function isId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 256;
}

function readCookie(name: string): string | undefined {
  try {
    return document.cookie.split(";").map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);
  } catch {
    return undefined;
  }
}

function readJsonCookie(name: string): unknown {
  try {
    const value = readCookie(name);
    return value ? JSON.parse(decodeURIComponent(value)) : null;
  } catch {
    return null;
  }
}

export function readLastStation(): StationReference | null {
  const value = readJsonCookie(LAST_STATION_COOKIE);
  if (!value || typeof value !== "object") return null;
  const { providerId, stationId } = value as Partial<StationReference>;
  return isId(providerId) && isId(stationId) ? { providerId, stationId } : null;
}

export function readFavorites(): StationReference[] {
  const value = readJsonCookie(FAVORITES_COOKIE);
  if (!Array.isArray(value)) return [];
  const favorites: StationReference[] = [];
  for (const entry of value) {
    if (!Array.isArray(entry) || entry.length !== 2 || !isId(entry[0]) || !isId(entry[1])) continue;
    const reference = { providerId: entry[0], stationId: entry[1] };
    if (!favorites.some((item) => sameStation(item, reference))) favorites.push(reference);
  }
  return favorites;
}

export function sameStation(a: StationReference, b: StationReference): boolean {
  return a.providerId === b.providerId && a.stationId === b.stationId;
}

export type SaveResult = "saved" | "unavailable" | "full";

function writeJsonCookie(name: string, value: unknown): SaveResult {
  const encoded = encodeURIComponent(JSON.stringify(value));
  // Leave room for cookie attributes below the browser's per-cookie size limit.
  if (name.length + encoded.length > MAX_COOKIE_LENGTH) return "full";
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encoded}; Path=${import.meta.env.BASE_URL}; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
    return readCookie(name) === encoded ? "saved" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export function saveLastStation(station: StationReference): SaveResult {
  return writeJsonCookie(LAST_STATION_COOKIE, station);
}

export function saveFavorites(favorites: readonly StationReference[]): SaveResult {
  return writeJsonCookie(FAVORITES_COOKIE, favorites.map(({ providerId, stationId }) => [providerId, stationId]));
}

export function initialStationId(stations: readonly Station[], defaultId?: string, savedId?: string): string {
  const station = stations.find((item) => item.id === savedId)
    ?? stations.find((item) => item.id === defaultId)
    ?? stations[0];
  if (!station) throw new Error("The provider station catalog is empty.");
  return station.id;
}
