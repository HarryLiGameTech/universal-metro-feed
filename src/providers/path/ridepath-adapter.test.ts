import { afterEach, describe, expect, it, vi } from "vitest";
import manifestFixture from "../../../public/providers/path-rail.json";
import catalogFixture from "../../../public/providers/path-rail/catalog.json";
import { parseProviderManifest } from "../registry";
import { runtimeForProvider } from "../runtime";
import { decodeRidePath } from "./ridepath-adapter";

const manifest = parseProviderManifest(manifestFixture, "path-rail");
const observed = "2026-09-26T22:33:48.717258-04:00";
const payload = {
  results: [
    { consideredStation: "JSQ", destinations: [
      { label: "ToNJ", messages: [
        { target: "NWK", secondsToArrival: "955", arrivalTimeMessage: "16 min", lineColor: "D93A30", headSign: "Newark", lastUpdated: observed },
        { target: "NWK", secondsToArrival: "2123", arrivalTimeMessage: "Delayed", lineColor: "D93A30", headSign: "Newark", lastUpdated: observed },
      ] },
      { label: "ToNY", messages: [
        { target: "WTC", secondsToArrival: "120", arrivalTimeMessage: "2 min", lineColor: "D93A30", headSign: "World Trade Center", lastUpdated: observed },
      ] },
    ] },
    { consideredStation: "HAR", destinations: [
      { label: "ToNJ", messages: [
        { target: "NWK", secondsToArrival: "60", arrivalTimeMessage: "1 min", lineColor: "D93A30", headSign: "Newark", lastUpdated: observed },
      ] },
    ] },
  ],
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("official PATH RidePATH adapter", () => {
  it("adds source seconds to its own lastUpdated timestamp, including the timezone offset", () => {
    const decoded = decodeRidePath(payload);
    expect(new Date(decoded[0]!.eventTime * 1_000).toISOString()).toBe("2026-09-27T02:49:43.717Z");
    expect(new Date(decoded[1]!.eventTime * 1_000).toISOString()).toBe("2026-09-27T03:09:11.717Z");
  });

  it("loads one official snapshot and filters station and direction without inventing trip or platform IDs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T02:35:00Z"));
    vi.stubEnv("VITE_PATH_ACCESS_URL", "/path-feed");
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/providers/path-rail/catalog.json") return Response.json(catalogFixture);
      if (String(input) === "/path-feed") return Response.json(payload);
      throw new Error(`Unexpected request: ${String(input)}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const runtime = await runtimeForProvider(manifest);
    const snapshot = await runtime.loadArrivals("JSQ", ["PATH"], "ToNJ");

    expect(fetchMock.mock.calls.filter(([url]) => String(url) === "/path-feed")).toHaveLength(1);
    expect(snapshot.arrivals).toHaveLength(2);
    expect(snapshot.arrivals[0]).toMatchObject({
      routeId: "PATH", stopId: "JSQ", direction: "ToNJ", destinationId: "NWK", destinationName: "Newark",
      eventKind: "arrival", tripId: null, identityStability: "snapshot-only", timeSource: "prediction",
      scheduledTime: null, delaySeconds: null, delayStatus: "undetermined",
      displayTime: { kind: "estimate", resolution: "second" },
    });
    expect(snapshot.arrivals[1]).toMatchObject({ delayStatus: "official", delayLabel: "Delayed (PATH)" });
    expect(snapshot.arrivals.map((arrival) => new Date(arrival.eventTime * 1_000).toISOString()))
      .toEqual(["2026-09-27T02:49:43.717Z", "2026-09-27T03:09:11.717Z"]);
    expect(snapshot.feedTimestamp).toBe(Date.parse(observed) / 1_000);
    expect(runtime).toMatchObject({ loadTripPath: null, arrivalSource: "prediction", refreshIntervalMs: 15_000, suppressApproximationMark: true });
    expect(runtime.loadTimetable).toBeTypeOf("function");
  });

  it("rejects malformed times and an absent production proxy instead of showing an empty board", async () => {
    expect(() => decodeRidePath({ results: [{ consideredStation: "JSQ", destinations: [
      { label: "ToNJ", messages: [{ ...payload.results[0]!.destinations[0]!.messages[0], secondsToArrival: "soon" }] },
    ] }] })).toThrow("seconds to arrival");
    expect(() => decodeRidePath({ results: [{ consideredStation: "JSQ", destinations: [
      { label: "ToNJ", messages: [{ ...payload.results[0]!.destinations[0]!.messages[0], lastUpdated: "2026-09-26T22:33:48" }] },
    ] }] })).toThrow("no timezone");
    const runtime = await runtimeForProvider(manifest);
    await expect(runtime.loadArrivals("JSQ", ["PATH"], "ToNJ"))
      .rejects.toThrow("proxy has not been configured");
  });
});
