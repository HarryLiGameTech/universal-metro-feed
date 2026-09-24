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
  /** Feed scope uses the same loader without a station/route/direction selection. */
  arrivalScope?: "platform" | "feed";
  loadArrivals: ArrivalLoader;
  loadTripPath: TripPathLoader | null;
  loadTimetable: TimetableLoader | null;
  arrivalSource: "prediction" | "schedule";
  feedLabel: string;
  refreshIntervalMs: number;
}

/** The registry selects one adapter; the UI only consumes the shared contracts. */
export async function runtimeForProvider(manifest: ProviderManifest): Promise<ProviderRuntime> {
  if (manifest.predictions.kind === "gtfs-realtime" && manifest.predictions.adapter === "toei") {
    const { createToeiRuntime } = await import("./toei/realtime-adapter");
    return createToeiRuntime(manifest);
  }
  if (manifest.predictions.kind === "gtfs-realtime" && manifest.predictions.adapter === "mta" &&
      manifest.schedule.kind === "gtfs-static") {
    const { mtaLoaders } = await import("./mta/runtime");
    return {
      ...mtaLoaders,
      arrivalSource: "prediction",
      feedLabel: "MTA feed",
      refreshIntervalMs: manifest.refreshIntervalMs ?? 5_000,
    };
  }
  if (manifest.schedule.kind === "proprietary-http" || manifest.predictions.kind === "proprietary-http") {
    const { proprietaryHttpRuntime } = await import("./http/adapters");
    return proprietaryHttpRuntime(manifest);
  }
  throw new Error(`No frontend adapter is available for ${manifest.id}.`);
}
