import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { afterEach, describe, expect, it, vi } from "vitest";
import bartManifest from "../../../public/providers/bart.json";
import bartCatalog from "../../../public/providers/bart/catalog.json";
import bartCalendar from "../../../public/providers/bart/calendar.json";
import bartTripMap from "../../../public/providers/bart/trip-map.json";
import ctaManifest from "../../../public/providers/cta.json";
import ctaCatalog from "../../../public/providers/cta/catalog.json";
import { parseProviderCatalog, parseProviderManifest } from "../registry";
import { runtimeForProvider } from "../runtime";

const bartRun = "ecc0f34d-0e09-46df-8374-ffc8b802b971";
const bartVersion = "793cf681-f365-4849-a58c-4b07cb59c4ad";
const serviceId = "2026_08_10-DX-MVS-Weekday-015";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("BART and CTA rail providers", () => {
  it("publishes distinct provider IDs and official rail station directories", () => {
    expect(parseProviderManifest(bartManifest, "bart").timezone).toBe("America/Los_Angeles");
    expect(parseProviderManifest(ctaManifest, "cta").timezone).toBe("America/Chicago");
    expect(parseProviderCatalog(bartCatalog, "bart").stations.some((station) => station.id === "MONT")).toBe(true);
    expect(parseProviderCatalog(ctaCatalog, "cta").stations.some((station) => station.id === "40380")).toBe(true);
  });

  it("filters the official GTFS-Realtime TripUpdate by route, direction, and child stop", async () => {
    vi.stubEnv("VITE_BART_GTFSRT_ACCESS_URL", "/bart-gtfsrt");
    const trip = Object.entries(bartTripMap.trips).find(([, patternId]) => {
      const pattern = bartTripMap.patterns[patternId as number];
      return pattern?.routeId === "1" && pattern.direction === "1" && Object.values(pattern.stops).includes("M20-1");
    });
    expect(trip).toBeDefined();
    const bytes = GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(
      GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject({
        header: { gtfsRealtimeVersion: "2.0", timestamp: 1_780_000_000 },
        entity: [{ id: "train-1", tripUpdate: {
          trip: { tripId: trip![0], startDate: "20260930" },
          stopTimeUpdate: [{ stopId: "M20-1", arrival: { time: 1_780_000_300 } }],
        } }],
      }),
    ).finish();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/providers/bart/catalog.json") return Response.json(bartCatalog);
      if (String(input) === "/providers/bart/trip-map.json") return Response.json(bartTripMap);
      if (String(input) === "/bart-gtfsrt") return new Response(new Uint8Array(bytes));
      throw new Error(`Unexpected request ${String(input)}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const runtime = await runtimeForProvider(parseProviderManifest(bartManifest, "bart"));
    expect(runtime.showRealtime).toBe(true);
    const snapshot = await runtime.loadArrivals("MONT", ["1"], "1");
    expect(snapshot.arrivals).toMatchObject([{
      tripId: trip![0], routeId: "1", direction: "1", stopId: "M20-1",
      eventTime: 1_780_000_300, timeSource: "prediction",
    }]);
    expect((await runtime.loadArrivals("MONT", ["2"], "0")).arrivals).toEqual([]);
  });

  it("requests the parent station timetable and binds its run to bart and the exact GTFS snapshot", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-30T18:00:00Z"));
    vi.stubEnv("VITE_CLOCKFACE_BASE_URL", "/clockface");
    vi.stubEnv("VITE_BART_CLOCKFACE_RUN_ID", bartRun);
    const prefix = "/clockface/v1";
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/providers/bart/catalog.json") return Response.json(bartCatalog);
      if (url === "/providers/bart/calendar.json") return Response.json(bartCalendar);
      if (url === `${prefix}/providers/bart`) return Response.json({ providerId: "bart", sources: [{ sourceId: "bart-static-gtfs" }] });
      if (url === `${prefix}/runs/${bartRun}`) return Response.json({ sourceParseRunId: bartRun, sourceContentVersionId: bartVersion, status: "succeeded" });
      if (url === `${prefix}/sources/bart-static-gtfs/versions?limit=500`) return Response.json([{
        sourceContentVersionId: bartVersion, contentHash: bartCalendar.sourceContentHash,
      }]);
      if (url === `${prefix}/runs/${bartRun}/stations/MONT/timetable`) return Response.json([{
        stop_id: "MONT",
        trainRuns: [
          { routeId: "1", directionId: "1", platformId: "M20-1", filterTags: [serviceId],
            departureTime: { type: "TimeSpecSecond", hour: 8, minute: 4, second: "Unknown" } },
          { routeId: "1", directionId: "1", platformId: "M20-1", filterTags: [serviceId],
            departureTime: { type: "TimeSpecSecond", hour: 8, minute: 10, second: 30 } },
          { routeId: "2", directionId: "0", platformId: "M20-2", filterTags: [serviceId],
            departureTime: { type: "TimeSpecSecond", hour: 8, minute: 20, second: 0 } },
        ],
      }]);
      throw new Error(`Unexpected request ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    const runtime = await runtimeForProvider(parseProviderManifest(bartManifest, "bart"));
    const timetable = await runtime.loadTimetable!("MONT", ["1"], "1", "weekday");
    expect(timetable.dateKey).toBe("20260930");
    expect(timetable.scheduledTrainCount).toBe(2);
    expect(timetable.hours[0]?.events.map((event) => [event.exactTime, event.hasHalfMinute]))
      .toEqual([["08:04", false], ["08:10:30", true]]);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/stations/M20-1/"))).toBe(false);
  });

  it("keeps CTA static-only until a Clockface run is configured and never requests a keyless realtime feed", async () => {
    vi.stubEnv("VITE_CLOCKFACE_BASE_URL", "/clockface");
    vi.stubEnv("VITE_CTA_CLOCKFACE_RUN_ID", "");
    vi.stubEnv("VITE_CTA_GTFSRT_ACCESS_URL", "");
    const runtime = await runtimeForProvider(parseProviderManifest(ctaManifest, "cta"));
    expect(runtime.showRealtime).toBe(false);
    await expect(runtime.loadTimetable!("40380", ["Blue"], "0", "weekday"))
      .rejects.toThrow("no completed parse run");
  });
});
