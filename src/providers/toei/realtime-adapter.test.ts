import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { afterEach, describe, expect, it, vi } from "vitest";
import manifestFixture from "../../../public/providers/toei-subway.json";
import catalogFixture from "../../../public/providers/toei-subway/catalog.json";
import tripMapFixture from "../../../public/providers/toei-subway/trip-map.json";
import { parseProviderManifest } from "../registry";
import { runtimeForProvider } from "../runtime";
import { toeiArrivals } from "./realtime-adapter";
import type { ToeiTripMap } from "./trip-map";

const realtime = GtfsRealtimeBindings.transit_realtime;
const timezone = "Asia/Tokyo";
const manifest = parseProviderManifest(manifestFixture, "toei-subway");
const tripMap: ToeiTripMap = tripMapFixture as ToeiTripMap;
const stop = { stopSequence: 6, arrival: { time: 1_790_211_960, uncertainty: 60 } };
function bytes(entity: object[], header: object = {}) {
  return realtime.FeedMessage.encode(realtime.FeedMessage.fromObject({
    header: { gtfsRealtimeVersion: "2.0", ...header }, entity,
  })).finish();
}
function predictions(entity: object[], header?: object) {
  return toeiArrivals(realtime.FeedMessage.decode(bytes(entity, header)), timezone);
}
function trip(stopTimeUpdate: object[] = [stop], descriptor: object = {}) {
  return { id: "trip-1", tripUpdate: { trip: { tripId: "100829H0", ...descriptor }, stopTimeUpdate } };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Toei realtime adapter", () => {
  it("preserves absent identifiers and protobuf values as null, including an unknown timestamp", () => {
    const snapshot = predictions([trip()]);
    expect(snapshot.feedTimestamp).toBeNull();
    expect(snapshot.arrivals).toHaveLength(1);
    expect(snapshot.arrivals[0]).toMatchObject({
      tripId: "100829H0", routeId: null, direction: null, stopId: null, stopSequence: 6,
      destinationId: null, destinationName: null, scheduledTime: null, delaySeconds: null,
      eventKind: "arrival", eventTime: stop.arrival.time,
      displayTime: { kind: "estimate", timezone, toleranceSeconds: 60 },
    });
    expect(predictions([trip([{ departure: { time: stop.arrival.time } }])]).arrivals[0])
      .toMatchObject({ stopSequence: null, displayTime: { toleranceSeconds: null } });
  });

  it("keeps explicit zeroes, sorts events, and distinguishes stops of the same trip", () => {
    const snapshot = predictions([trip([
      { ...stop, arrival: { time: stop.arrival.time + 60, uncertainty: 0, delay: 0 } },
      { stopId: "A01", stopSequence: 5, departure: { time: stop.arrival.time } },
    ], { routeId: "A", directionId: 0 })], { timestamp: stop.arrival.time - 10 });
    expect(snapshot.feedTimestamp).toBe(stop.arrival.time - 10);
    expect(snapshot.arrivals.map((arrival) => arrival.eventKind)).toEqual(["departure", "arrival"]);
    expect(new Set(snapshot.arrivals.map((arrival) => arrival.id)).size).toBe(2);
    expect(snapshot.arrivals[0]).toMatchObject({ routeId: "A", direction: "0", stopId: "A01" });
    expect(snapshot.arrivals[1]).toMatchObject({ delaySeconds: 0, displayTime: { toleranceSeconds: 0 } });
  });

  it("uses an explicit departure when arrival has only delay, without inventing absolute times", () => {
    const snapshot = predictions([trip([
      { stopSequence: 1, arrival: { delay: 90 } },
      { stopSequence: 2, arrival: { delay: 90 }, departure: { time: stop.arrival.time } },
      { stopSequence: 3 },
    ])]);
    expect(snapshot.arrivals).toHaveLength(1);
    expect(snapshot.arrivals[0]).toMatchObject({ stopSequence: 2, eventKind: "departure", eventTime: stop.arrival.time });
  });

  it("excludes deleted/cancelled trips and stops with no service or no prediction", () => {
    expect(predictions([
      { ...trip(), isDeleted: true },
      trip([stop], { scheduleRelationship: "CANCELED" }),
      trip([stop], { scheduleRelationship: "DELETED" }),
      trip([{ ...stop, scheduleRelationship: "SKIPPED" }, { ...stop, scheduleRelationship: "NO_DATA" }]),
      { id: "vehicle", vehicle: { trip: { tripId: "100829H0" }, currentStopSequence: 5 } },
      { id: "alert", alert: { headerText: { translation: [{ text: "Delay" }] } } },
    ]).arrivals).toEqual([]);
    expect(() => predictions([trip()], { incrementality: "DIFFERENTIAL" })).toThrow("full feed snapshot");
  });

  it("maps the screenshot's trip and stop sequence without substituting scheduled times", () => {
    const snapshot = toeiArrivals(realtime.FeedMessage.decode(bytes([
      trip([{ ...stop, stopSequence: 13 }], { tripId: "100939N0", startDate: "20260924" }),
    ])), timezone, tripMap);
    expect(snapshot.arrivals[0]).toMatchObject({
      tripId: "100939N0", routeId: "1", direction: "0", stopId: "119",
      destinationName: "印西牧の原", destinationId: null,
      eventTime: stop.arrival.time, scheduledTime: null, delaySeconds: null,
    });
    expect(catalogFixture.stations.find((station) => station.id === snapshot.arrivals[0]?.stopId)?.name)
      .toBe("本所吾妻橋");
    expect(snapshot.warnings).toBeUndefined();
  });

  it("does not guess mappings for unknown trips, sparse sequences, expired or mismatched references", () => {
    const map: ToeiTripMap = {
      ...tripMap, trips: { known: 0, tram: null },
      patterns: [{ routeId: "1", direction: "0", headsign: "印西牧の原", stops: { "13": "119", "20": "120" } }],
    };
    const decode = (tripId: string, sequence: number, startDate = "20260924", header: object = {}) =>
      toeiArrivals(realtime.FeedMessage.decode(bytes([
        trip([{ ...stop, stopSequence: sequence }], { tripId, startDate }),
      ], header)), timezone, map);
    expect(decode("known", 20).arrivals[0]?.stopId).toBe("120");
    expect(decode("known", 14).arrivals[0]?.stopId).toBeNull();
    for (const result of [decode("missing", 13), decode("known", 13, "20300101"),
      decode("known", 13, "20260924", { feedVersion: "different" })]) {
      expect(result.arrivals[0]).toMatchObject({ routeId: null, stopId: null, direction: null, destinationName: null });
      expect(result.warnings?.[0]).toContain("incomplete");
    }
    expect(decode("tram", 13)).toMatchObject({ arrivals: [] });
    expect(decode("tram", 13).warnings).toBeUndefined();
  });

  it.each(["/", "/universal-metro-feed/"])("loads local mappings once and filters station/line/direction at %s", async (base) => {
    vi.stubEnv("BASE_URL", base);
    const opposite = tripMap.patterns.findIndex((pattern) => pattern.routeId === "1" && pattern.direction === "1" &&
      Object.values(pattern.stops).includes("119"));
    const otherLine = tripMap.patterns.findIndex((pattern) => pattern.routeId === "2");
    const mapped = { ...tripMap, trips: { ...tripMap.trips, opposite, otherLine } };
    const feedBytes = bytes([
      trip([{ ...stop, stopSequence: 13 }, { ...stop, stopSequence: 14 }], { tripId: "100939N0" }),
      trip([{ stopId: "119", ...stop }], { tripId: "opposite" }),
      trip([{ stopId: "119", ...stop }], { tripId: "otherLine" }),
      trip([stop], { tripId: "unknown" }),
    ]);
    const fetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url) === `${base}providers/toei-subway/catalog.json`) return Response.json(catalogFixture);
      if (String(url) === `${base}providers/toei-subway/trip-map.json`) return Response.json(mapped);
      if (String(url) === manifestFixture.predictions.urlTemplate) return new Response(new Uint8Array(feedBytes));
      throw new Error(`Unexpected browser request: ${url}`);
    });
    vi.stubGlobal("fetch", fetch);
    const runtime = await runtimeForProvider(manifest);
    const signal = new AbortController().signal;
    const snapshot = await runtime.loadArrivals("119", ["1"], "0", signal);
    expect(snapshot.arrivals).toHaveLength(1);
    expect(snapshot.arrivals[0]).toMatchObject({ tripId: "100939N0", routeId: "1", stopId: "119", direction: "0" });
    expect(snapshot.warnings?.[0]).toContain("incomplete");
    expect(runtime).toMatchObject({ arrivalScope: "platform", loadTimetable: null, loadTripPath: null });
    expect(fetch).toHaveBeenCalledWith(new URL(manifestFixture.predictions.urlTemplate), expect.objectContaining({ signal }));
    expect((await runtime.loadArrivals("120", ["1"], "0")).arrivals[0]?.stopId).toBe("120");
    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls.filter((url) => url.endsWith("catalog.json"))).toHaveLength(1);
    expect(urls.filter((url) => url.endsWith("trip-map.json"))).toHaveLength(1);
    expect(urls.some((url) => url.endsWith(".zip"))).toBe(false);
    fetch.mockResolvedValue(new Response("Unavailable", { status: 503 }));
    await expect(runtime.loadArrivals("119", ["1"], "0")).rejects.toThrow("503");
  });
});
