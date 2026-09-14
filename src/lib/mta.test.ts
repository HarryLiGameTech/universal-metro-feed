import { describe, expect, it } from "vitest";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { normalizeArrivals } from "./mta";

function makeFeed() {
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject({
    header: { gtfsRealtimeVersion: "1.0", timestamp: 2_000 },
    entity: [
      {
        id: "later",
        tripUpdate: {
          trip: { tripId: "trip-2", routeId: "1" },
          stopTimeUpdate: [
            { stopId: "127N", arrival: { time: 2_200 } },
            { stopId: "101N", arrival: { time: 2_500 } },
          ],
        },
      },
      {
        id: "other-line",
        tripUpdate: {
          trip: { tripId: "trip-x", routeId: "2" },
          stopTimeUpdate: [{ stopId: "127N", arrival: { time: 2_050 } }],
        },
      },
      {
        id: "departure",
        tripUpdate: {
          trip: { tripId: "trip-1", routeId: "1" },
          stopTimeUpdate: [
            { stopId: "127N", departure: { time: 2_100 } },
            { stopId: "101N", arrival: { time: 2_400 } },
          ],
        },
      },
    ],
  });
}

describe("normalizeArrivals", () => {
  it("filters by station, route and direction and sorts chronologically", () => {
    const result = normalizeArrivals(makeFeed(), "127", "1", "N");
    expect(result.arrivals.map((arrival) => arrival.tripId)).toEqual(["trip-1", "trip-2"]);
  });

  it("uses departure time when an origin has no arrival time", () => {
    const result = normalizeArrivals(makeFeed(), "127", "1", "N");
    expect(result.arrivals[0]).toMatchObject({ eventKind: "departure", eventTime: 2_100 });
  });

  it("uses the final stop update as the destination", () => {
    const result = normalizeArrivals(makeFeed(), "127", "1", "N");
    expect(result.arrivals[0]?.destinationId).toBe("101");
    expect(result.arrivals[0]?.destinationName).toBe("Van Cortlandt Park-242 St");
  });
});
