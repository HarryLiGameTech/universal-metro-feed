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
  loadTripPath: TripPathLoader | null;
  loadTimetable: TimetableLoader | null;
  arrivalSource: "prediction" | "schedule";
  feedLabel: string;
  refreshIntervalMs: number;
}

/** The registry selects one adapter; the UI only consumes the shared contracts. */
export async function runtimeForProvider(manifest: ProviderManifest): Promise<ProviderRuntime> {
  if (manifest.predictions.adapter === "mta" && manifest.schedule.kind === "gtfs-static") {
    const { mtaLoaders } = await import("./mta/runtime");
    return {
      ...mtaLoaders,
      arrivalSource: "prediction",
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
      arrivalSource: "prediction",
      feedLabel: "MBTA predictions",
      refreshIntervalMs: manifest.refreshIntervalMs ?? 20_000,
    };
  }
  if (manifest.schedule.kind === "proprietary-http" && manifest.predictions.kind === "none") {
    const { ProprietaryHttpResolver } = await import("./http/proprietary-http-resolver");
    const { scheduleAdapter } = await import("./http/adapters");
    const resolver = new ProprietaryHttpResolver(manifest, scheduleAdapter(manifest.schedule.adapter));
    return {
      loadArrivals: resolver.loadArrivals,
      loadTripPath: null,
      loadTimetable: null,
      arrivalSource: "schedule",
      feedLabel: "Partial timetable",
      refreshIntervalMs: manifest.refreshIntervalMs ?? 30_000,
    };
  }
  throw new Error(`No frontend adapter is available for ${manifest.id}.`);
}
