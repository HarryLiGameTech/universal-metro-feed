import { afterEach, describe, expect, it, vi } from "vitest";
import catalogFixture from "../../../public/providers/mbta-subway/catalog.json";
import { fetchMbtaArrivals, fetchMbtaTimetable, fetchMbtaTripPath } from "./v3-resolver";

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
