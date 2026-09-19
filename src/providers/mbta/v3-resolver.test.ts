import { afterEach, describe, expect, it, vi } from "vitest";
import catalogFixture from "../../../public/providers/mbta-subway/catalog.json";
import manifestFixture from "../../../public/providers/mbta-subway.json";
import { parseProviderManifest } from "../registry";
import { createMbtaRuntime } from "./v3-resolver";
import { runtimeForProvider } from "../runtime";

const runtime = createMbtaRuntime(parseProviderManifest(manifestFixture, "mbta-subway"));
const fetchMbtaArrivals = runtime.loadArrivals;
const fetchMbtaTimetable = runtime.loadTimetable!;
const fetchMbtaTripPath = runtime.loadTripPath!;

function resource(id: string, route: string, stop: string, trip: string, direction: number, arrival: string | null, departure: string | null, extra: Record<string, unknown> = {}) {
  return {
    id,
    type: "prediction",
    attributes: { direction_id: direction, arrival_time: arrival, departure_time: departure, stop_sequence: 10, ...extra },
    relationships: {
      route: { data: { id: route } },
      stop: { data: { id: stop } },
      trip: { data: { id: trip } },
    },
  };
}

function jsonResponse(value: unknown) {
  return { ok: true, json: async () => value } as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("MBTA V3 adapter", () => {
  it("dispatches through the HTTP registry, uses manifest endpoints, and keeps trip/timetable capabilities", async () => {
    const configured = parseProviderManifest({
      ...manifestFixture,
      schedule: { ...manifestFixture.schedule, urlTemplate: "https://mbta-test.example/planned" },
      predictions: { ...manifestFixture.predictions, urlTemplate: "https://mbta-test.example/estimated" },
    }, "mbta-subway");
    const httpRuntime = await runtimeForProvider(configured);
    expect(httpRuntime.arrivalSource).toBe("prediction");
    expect(httpRuntime.loadTripPath).toBeTypeOf("function");
    expect(httpRuntime.loadTimetable).toBeTypeOf("function");
    const requests: URL[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      if (String(input).endsWith("/providers/mbta-subway/catalog.json")) return jsonResponse(catalogFixture);
      requests.push(new URL(String(input)));
      return jsonResponse({ data: [] });
    }));
    await httpRuntime.loadArrivals("place-sstat", ["Red"], "0");
    await httpRuntime.loadTimetable!("place-sstat", ["Red"], "0", "weekday");
    expect(requests.map((url) => `${url.origin}${url.pathname}`)).toEqual([
      "https://mbta-test.example/estimated", "https://mbta-test.example/planned",
    ]);
    expect(requests[0]?.searchParams.get("filter[stop]")).toBe("place-sstat");
    expect(requests[1]?.searchParams.get("filter[date]")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("shares paginated predictions between selected routes and refreshes the snapshot on the next call", async () => {
    const park = catalogFixture.stations.find((station) => station.id === "place-pktrm")!;
    const stop = (routeId: string) => park.routes.find((route) => route.routeId === routeId)!.stopIds["0"][0]!;
    const later = new Date(Date.now() + 120_000).toISOString();
    const requests: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      const value = String(input);
      if (value.endsWith("/providers/mbta-subway/catalog.json")) return jsonResponse(catalogFixture);
      requests.push(value);
      const nextPage = new URL(value).searchParams.has("page[offset]");
      return jsonResponse(nextPage ? {
        data: [resource("e", "Green-E", stop("Green-E"), "trip-e", 0, later, later)],
        included: [
          { id: "trip-b", type: "trip", attributes: { headsign: "Boston College" } },
          { id: "trip-e", type: "trip", attributes: { headsign: "Heath Street" } },
        ],
      } : {
        data: [resource("b", "Green-B", stop("Green-B"), "trip-b", 0, later, later)],
        links: { next: "?page[offset]=1000" },
      });
    }));
    const first = await fetchMbtaArrivals("place-pktrm", ["Green-B", "Green-E"], "0");
    expect(first.arrivals.map((arrival) => arrival.destinationName)).toEqual(["Boston College", "Heath Street"]);
    expect(requests).toHaveLength(2);
    await fetchMbtaArrivals("place-pktrm", ["Green-B", "Green-E"], "0");
    expect(requests).toHaveLength(4);
  });

  it.each(["schedules", "predictions"])("preserves trip fallback when the HTTP %s source fails", async (failed) => {
    const now = Math.floor(Date.now() / 1_000);
    const time = new Date((now + 120) * 1_000).toISOString();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/providers/mbta-subway/catalog.json")) return jsonResponse(catalogFixture);
      if (new URL(url).pathname === `/${failed}`) return new Response("Unavailable", { status: 503 });
      return jsonResponse({
        data: [resource("event", "Red", "70079", "trip-1", 0, time, time)],
        included: [{ id: "70079", type: "stop", attributes: { name: "South Station" } }],
      });
    }));
    const result = await fetchMbtaTripPath({
      providerId: "mbta-subway", stationId: "place-sstat", routeId: "Red", directionId: "0",
      tripId: "trip-1", entityId: "event", anchorEventTime: now + 120, anchorEventKind: "arrival",
    });
    expect(result.freshness).toBe(failed === "predictions" ? "static" : "live");
    expect(result.data.topology).toBe(failed === "predictions" ? "full" : "partial");
    expect(result.data.stops[0]?.arrival?.time.kind).toBe(failed === "predictions" ? "published-minute" : "estimate");
    expect(result.warnings).toMatchObject([{ source: failed === "predictions" ? "prediction" : "schedule" }]);
  });

  it("only selects the GTFS platform stops for the selected direction and preserves prediction uncertainty", async () => {
    const now = Math.floor(Date.now() / 1_000);
    const later = new Date((now + 120) * 1_000).toISOString();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/providers/mbta-subway/catalog.json")) return jsonResponse(catalogFixture);
      if (url.includes("/predictions")) return jsonResponse({
        data: [
          resource("south", "Red", "70079", "trip-south", 0, later, later, { arrival_uncertainty: 60 }),
          resource("north", "Red", "70080", "trip-north", 1, later, later),
        ],
        included: [{ id: "trip-south", type: "trip", attributes: { headsign: "Ashmont" } }],
        links: { next: null },
      });
      throw new Error(`Unexpected request: ${url}`);
    }));

    const snapshot = await fetchMbtaArrivals("place-sstat", ["Red"], "0");
    expect(snapshot.arrivals).toHaveLength(1);
    expect(snapshot.arrivals[0]).toMatchObject({ tripId: "trip-south", stopId: "70079", destinationName: "Ashmont" });
    expect(snapshot.arrivals[0]?.displayTime).toMatchObject({ kind: "estimate", resolution: "second", toleranceSeconds: 60 });
    expect(snapshot.arrivals[0]?.delayStatus).toBe("undetermined");
  });

  it("uses minute-only static times and future live times in an expanded trip", async () => {
    const now = Math.floor(Date.now() / 1_000);
    const staticTime = new Date((now + 120) * 1_000).toISOString();
    const liveTime = new Date((now + 150) * 1_000).toISOString();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/providers/mbta-subway/catalog.json")) return jsonResponse(catalogFixture);
      if (url.includes("/schedules")) return jsonResponse({
        data: [
          resource("schedule-1", "Red", "70079", "trip-1", 0, staticTime, staticTime, { stop_sequence: 10 }),
          resource("schedule-2", "Red", "70081", "trip-1", 0, staticTime, staticTime, { stop_sequence: 20 }),
        ],
        included: [
          { id: "70079", type: "stop", attributes: { name: "South Station" } },
          { id: "70081", type: "stop", attributes: { name: "Broadway" } },
        ],
        links: { next: null },
      });
      if (url.includes("/predictions")) return jsonResponse({
        data: [resource("prediction-2", "Red", "70081", "trip-1", 0, liveTime, liveTime, {
          stop_sequence: 20, arrival_uncertainty: 45, departure_uncertainty: 45,
        })],
        links: { next: null },
      });
      throw new Error(`Unexpected request: ${url}`);
    }));

    const result = await fetchMbtaTripPath({
      providerId: "mbta-subway", stationId: "place-sstat", routeId: "Red", directionId: "0",
      tripId: "trip-1", entityId: "prediction-1", anchorEventTime: now + 120, anchorEventKind: "arrival",
    });
    expect(result.data.topology).toBe("full");
    expect(result.data.stops[0]).toMatchObject({ name: "South Station", position: "current" });
    expect(result.data.stops[0]?.arrival?.time.kind).toBe("published-minute");
    expect(result.data.stops[1]?.arrival?.time).toMatchObject({ kind: "estimate", toleranceSeconds: 45 });
  });

  it("renders provider schedules without claiming second precision", async () => {
    const now = Math.floor(Date.now() / 1_000);
    const planned = new Date((now + 180) * 1_000).toISOString();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
      const url = String(input);
      if (url.endsWith("/providers/mbta-subway/catalog.json")) return jsonResponse(catalogFixture);
      if (url.includes("/schedules")) return jsonResponse({
        data: [resource("schedule-1", "Red", "70079", "trip-1", 0, planned, planned)],
        links: { next: null },
      });
      throw new Error(`Unexpected request: ${url}`);
    }));

    const result = await fetchMbtaTimetable("place-sstat", ["Red"], "0", "weekday");
    expect(result.scheduledTrainCount).toBe(1);
    expect(result.hours[0]?.events[0]?.exactTime).toMatch(/^\d{2}:\d{2}$/);
    expect(result.hours[0]?.events[0]?.hasHalfMinute).toBe(false);
  });
});
