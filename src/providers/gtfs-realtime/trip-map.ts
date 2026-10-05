import { assetUrl } from "../../lib/asset-url";

export interface GtfsTripMap {
  schemaVersion: 1;
  providerId: string;
  source: {
    url: string;
    feedVersion: string | null;
    feedStartDate: string | null;
    feedEndDate: string | null;
  };
  patterns: Array<{
    routeId: string;
    direction: string | null;
    headsign: string | null;
    /** Actual GTFS stop_sequence keys, not array offsets. */
    stops: Record<string, string>;
  }>;
  /** Pattern index; null identifies a trip intentionally outside the subway catalog. */
  trips: Record<string, number | null>;
}

export async function loadGtfsTripMap(url: string, providerId: string): Promise<GtfsTripMap> {
  const response = await fetch(assetUrl(url));
  if (!response.ok) throw new Error(`Could not load station mappings (${response.status}).`);
  const value = await response.json() as GtfsTripMap | null;
  if (!value || value.schemaVersion !== 1 || value.providerId !== providerId || !value.source ||
      !Array.isArray(value.patterns) || !value.trips || typeof value.trips !== "object") {
    throw new Error("Invalid GTFS station mappings.");
  }
  return value;
}
