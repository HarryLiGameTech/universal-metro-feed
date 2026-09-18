import type { TripPathLoader } from "../domain/trip-path";
import type { ArrivalLoader, Direction, TimetableDayType, TimetableResult } from "../types";
import type { ProviderManifest } from "./registry";

export type TimetableLoader = (
  stationId: string,
  routeIds: readonly string[],
  direction: Direction,
  dayType: TimetableDayType,
  signal?: AbortSignal,
) => Promise<TimetableResult>;

export interface ProviderRuntime {
  loadArrivals: ArrivalLoader;
  loadTripPath: TripPathLoader;
  loadTimetable: TimetableLoader;
  feedLabel: string;
  refreshIntervalMs: number;
}

/** The registry selects one adapter; the UI only consumes the shared contracts. */
export async function runtimeForProvider(manifest: ProviderManifest): Promise<ProviderRuntime> {
  if (manifest.predictions.adapter === "mta" && manifest.schedule.kind === "gtfs-static") {
    const { mtaLoaders } = await import("./mta/runtime");
    return {
      ...mtaLoaders,
      feedLabel: "MTA feed",
      refreshIntervalMs: manifest.refreshIntervalMs ?? 5_000,
    };
  }
  if (manifest.predictions.adapter === "mbta-v3" && manifest.schedule.kind === "mbta-v3") {
    const { fetchMbtaArrivals, fetchMbtaTimetable, fetchMbtaTripPath } = await import("./mbta/v3-resolver");
    return {
      loadArrivals: fetchMbtaArrivals,
      loadTripPath: fetchMbtaTripPath,
      loadTimetable: fetchMbtaTimetable,
      feedLabel: "MBTA predictions",
      refreshIntervalMs: manifest.refreshIntervalMs ?? 20_000,
    };
  }
  throw new Error(`No frontend adapter is available for ${manifest.id}.`);
}
