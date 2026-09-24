import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { afterEach, describe, expect, it, vi } from "vitest";
import manifestFixture from "../../../public/providers/toei-subway.json";
import { parseProviderManifest } from "../registry";
import { runtimeForProvider } from "../runtime";
import { toeiArrivals } from "./realtime-adapter";

const realtime = GtfsRealtimeBindings.transit_realtime;
const timezone = "Asia/Tokyo";
const manifest = parseProviderManifest(manifestFixture, "toei-subway");
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

afterEach(() => vi.unstubAllGlobals());

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

  it("selects the adapter through the registry and fetches protobuf without requesting static data", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(new Uint8Array(bytes([trip()]))));
    vi.stubGlobal("fetch", fetch);
    const runtime = await runtimeForProvider(manifest);
    const signal = new AbortController().signal;
    const snapshot = await runtime.loadArrivals("", [], "", signal);
    expect(snapshot.arrivals[0]).toMatchObject({ tripId: "100829H0", routeId: null });
    expect(runtime).toMatchObject({ arrivalScope: "feed", loadTimetable: null, loadTripPath: null });
    expect(fetch).toHaveBeenCalledExactlyOnceWith(new URL(manifestFixture.predictions.urlTemplate), expect.objectContaining({ signal }));
    fetch.mockResolvedValue(new Response("Unavailable", { status: 503 }));
    await expect(runtime.loadArrivals("", [], "")).rejects.toThrow("503");
  });
});
