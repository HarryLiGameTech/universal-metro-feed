import { afterEach, describe, expect, it, vi } from "vitest";
import manifestFixture from "../../../public/providers/nbrt-subway.json";
import catalogFixture from "../../../public/providers/nbrt-subway/catalog.json";
import { exactTime } from "../../domain/strict-time";
import { parseProviderManifest, type ProviderCatalog } from "../registry";
import { runtimeForProvider } from "../runtime";
import { nbrtScheduleAdapter } from "../nbrt/schedule-adapter";
import { PartialScheduleResolver } from "./partial-schedule-resolver";
import { localClockEpoch } from "./local-clock";

const manifest = parseProviderManifest(manifestFixture, "nbrt-subway");
const now = Date.parse("2026-09-19T10:30:00Z") / 1_000;
const context = { nowSeconds: now };
const catalog = catalogFixture as ProviderCatalog;
function group(station: number, line: number, flag: number, arrival = "18:34:10", departure: string | null = "18:34:50") {
  return { StationId: station, LineId: line, Flag: flag, StationRunTimes: [
    { StationId: station, LineId: line, Flag: flag, IntimeStr: arrival, OutTimeStr: departure },
  ] };
}
function setup(groups: unknown[]) {
  const request = vi.fn(async () => new Response(JSON.stringify({ Code: 200, Data: groups })));
  return { request, resolver: new PartialScheduleResolver(manifest, nbrtScheduleAdapter, async () => catalog, request) };
}

afterEach(() => vi.useRealTimers());

describe("PartialScheduleResolver", () => {
  it("loads one station once, filters all groups, deduplicates rows, and returns schedules without delays or trips", async () => {
    const one = group(16, 1, 1);
    const { request, resolver } = setup([one, one, group(16, 2, 1, "18:35:01"), group(16, 1, 2), group(17, 1, 1)]);
    const signal = new AbortController().signal;
    const result = await resolver.resolveArrivals("16", ["1", "2"], "1", { ...context, signal });
    expect(request).toHaveBeenCalledExactlyOnceWith(
      "https://metroinfo.ditiego.net/Api/Stations/ScheduleTime/16?DeviceType=6",
      { signal, headers: { Accept: "application/json" }, cache: "no-store" },
    );
    expect(result.freshness).toBe("static");
    expect(result.sources).toHaveLength(2);
    expect(result.sources.every((source) => source.observedAt == null)).toBe(true);
    expect(result.data.feedTimestamp).toBeNull();
    expect(result.data.arrivals).toHaveLength(2);
    expect(result.data.arrivals[0]).toMatchObject({
      routeId: "1", stopId: "16", eventKind: "arrival", eventTime: now + 250, scheduledTime: now + 250,
      tripId: null, identityStability: "snapshot-only", timeSource: "schedule",
      destinationKind: "direction", destinationId: null, destinationName: "霞浦",
      delaySeconds: null, delayStatus: "undetermined", delayLabel: "",
      displayTime: { kind: "exact", resolution: "second" },
    });
  });

  it("uses departure at an explicitly configured origin and arrival in the opposite direction", async () => {
    const { resolver } = setup([group(7, 1, 1), group(7, 1, 2)]);
    const origin = await resolver.resolveArrivals("7", ["1"], "1", context);
    const terminus = await resolver.resolveArrivals("7", ["1"], "2", context);
    expect(origin.data.arrivals[0]).toMatchObject({ eventKind: "departure", eventTime: now + 290 });
    expect(terminus.data.arrivals[0]).toMatchObject({ eventKind: "arrival", eventTime: now + 250 });
  });

  it("does not fill a missing departure with an arrival", async () => {
    const { resolver } = setup([group(7, 1, 1, "18:34:10", null)]);
    expect((await resolver.resolveArrivals("7", ["1"], "1", context)).data.arrivals).toEqual([]);
  });

  it("filters past events without declaring the end of service", async () => {
    const { resolver } = setup([group(164, 8, 1, "18:29:00")]);
    expect((await resolver.resolveArrivals("164", ["8"], "1", context)).data.arrivals).toEqual([]);
  });

  it("rejects invalid selections before requesting the endpoint", async () => {
    const { resolver, request } = setup([]);
    await expect(resolver.resolveArrivals("missing", ["8"], "1", context)).rejects.toThrow("directory");
    await expect(resolver.resolveArrivals("164", ["8"], "N", context)).rejects.toThrow("directory");
    await expect(resolver.resolveArrivals("164", [], "1", context)).rejects.toThrow("Select");
    expect(request).not.toHaveBeenCalled();
  });

  it("propagates HTTP failure and cancellation instead of returning empty success", async () => {
    const request = vi.fn(async () => new Response("Unavailable", { status: 503 }));
    const resolver = new PartialScheduleResolver(manifest, nbrtScheduleAdapter, async () => catalog, request);
    await expect(resolver.resolveArrivals("164", ["8"], "1", context)).rejects.toThrow("503");
    const controller = new AbortController();
    controller.abort();
    await expect(resolver.resolveArrivals("164", ["8"], "1", { ...context, signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("accepts another HTTP protocol without adding provider logic to the resolver", async () => {
    const other = { ...manifest, id: "other-system" };
    const resolver = new PartialScheduleResolver(other, {
      decode: () => ({ data: [{ stationId: "a", routeId: "r", directionId: "east", arrival: exactTime(now + 100, "UTC"), departure: null }] }),
      combine: (pages) => pages.flat(),
    }, async () => ({
      providerId: "other-system", timezone: "UTC", routes: {},
      stations: [{ id: "a", name: "A", latitude: null, longitude: null, routes: [{ routeId: "r", directions: ["east"] }] }],
    }), async () => new Response("{}"));
    expect((await resolver.resolveArrivals("a", ["r"], "east", context)).data.arrivals[0])
      .toMatchObject({ stopId: "a", direction: "east", eventTime: now + 100 });
  });

  it("disables full-day schedules and trip expansion at the runtime boundary", async () => {
    const runtime = await runtimeForProvider(manifest);
    expect(runtime).toMatchObject({ loadTripPath: null, loadTimetable: null, arrivalSource: "schedule", refreshIntervalMs: 30_000 });
  });
});

describe("rolling local clocks", () => {
  it.each([
    ["2026-09-19T15:59:50Z", "00:00:30", "2026-09-19T16:00:30Z"],
    ["2026-09-19T16:00:20Z", "23:59:50", "2026-09-19T15:59:50Z"],
    ["2026-09-19T15:59:50Z", "24:00:30", "2026-09-19T16:00:30Z"],
  ])("resolves %s + %s across midnight without promoting old rows to tomorrow", (reference, clock, expected) => {
    expect(localClockEpoch(clock, Date.parse(reference) / 1_000, 8 * 3_600)).toBe(Date.parse(expected) / 1_000);
  });
});
