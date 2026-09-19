import type { ProviderManifest } from "../registry";
import type { ProviderRuntime } from "../runtime";

const adapters: Record<string, (manifest: ProviderManifest) => Promise<ProviderRuntime>> = {
  "nbrt-schedule-time": async (manifest) => {
    const { nbrtScheduleAdapter } = await import("../nbrt/schedule-adapter");
    const { PartialScheduleResolver } = await import("./partial-schedule-resolver");
    const resolver = new PartialScheduleResolver(manifest, nbrtScheduleAdapter);
    return {
      loadArrivals: resolver.loadArrivals,
      loadTripPath: null,
      loadTimetable: null,
      arrivalSource: "schedule",
      feedLabel: "Partial timetable",
      refreshIntervalMs: manifest.refreshIntervalMs ?? 30_000,
    };
  },
  "mbta-v3": async (manifest) => {
    const { createMbtaRuntime } = await import("../mbta/v3-resolver");
    return createMbtaRuntime(manifest);
  },
};

export function proprietaryHttpRuntime(manifest: ProviderManifest): Promise<ProviderRuntime> {
  const sources = [manifest.schedule, manifest.predictions].filter((source) => source.kind === "proprietary-http");
  const ids = [...new Set(sources.map((source) => source.adapter))];
  if (ids.length !== 1) throw new Error("This HTTP runtime requires matching protocol adapters for its sources.");
  const adapter = adapters[ids[0]!];
  if (!adapter) throw new Error(`Unsupported HTTP protocol: ${ids[0]}`);
  return adapter(manifest);
}
