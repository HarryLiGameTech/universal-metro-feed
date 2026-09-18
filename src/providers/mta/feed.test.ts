import { describe, expect, it } from "vitest";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { stations } from "../../data/stations.generated";
import { classifyDelay, normalizeArrivals } from "./feed";
import { newYorkServiceTimeToEpoch } from "../../lib/timetable";

const stationNames = new Map(stations.map((station) => [station.id, station.name]));

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
    const result = normalizeArrivals(makeFeed(), "127", "1", "N", undefined, stationNames);
    expect(result.arrivals.map((arrival) => arrival.tripId)).toEqual(["trip-1", "trip-2"]);
  });

  it("uses departure time when an origin has no arrival time", () => {
    const result = normalizeArrivals(makeFeed(), "127", "1", "N", undefined, stationNames);
    expect(result.arrivals[0]).toMatchObject({ eventKind: "departure", eventTime: 2_100 });
  });

  it("uses the final stop update as the destination", () => {
    const result = normalizeArrivals(makeFeed(), "127", "1", "N", undefined, stationNames);
    expect(result.arrivals[0]?.destinationId).toBe("101");
    expect(result.arrivals[0]?.destinationName).toBe("Van Cortlandt Park-242 St");
  });

  it("classifies the requested delay boundaries", () => {
    expect(classifyDelay(null).delayStatus).toBe("undetermined");
    expect(classifyDelay(-19).delayStatus).toBe("on-time");
    expect(classifyDelay(-20)).toMatchObject({ delayStatus: "early", delayLabel: "Early" });
    expect(classifyDelay(-120).delayStatus).toBe("early");
    expect(classifyDelay(-121)).toMatchObject({ delayStatus: "undetermined", delayLabel: "Untimed" });
    expect(classifyDelay(30).delayStatus).toBe("on-time");
    expect(classifyDelay(31).delayStatus).toBe("mild");
    expect(classifyDelay(60).delayStatus).toBe("mild");
    expect(classifyDelay(61).delayStatus).toBe("noticeable");
    expect(classifyDelay(299).delayStatus).toBe("noticeable");
    expect(classifyDelay(300).delayStatus).toBe("official");
    expect(classifyDelay(600).delayStatus).toBe("official");
    expect(classifyDelay(601).delayStatus).toBe("undetermined");
  });

  it("matches a realtime trip suffix to the active static service", () => {
    const scheduledTime = newYorkServiceTimeToEpoch("20260914", "08:00:00");
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject({
      header: { gtfsRealtimeVersion: "1.0", timestamp: scheduledTime },
      entity: [{
        id: "matched",
        tripUpdate: {
          trip: { tripId: "048000_1..N03R", routeId: "1", startDate: "20260914" },
          stopTimeUpdate: [{ stopId: "127N", arrival: { time: scheduledTime + 45 } }],
        },
      }],
    });
    const timetableSource = {
      shard: {
        services: {
          Weekday: [{
            tripId: "ASP26GEN-Weekday-00_048000_1..N09X001",
            arrival: "08:00:00",
            departure: "08:00:00",
          }],
        },
      },
      calendar: {
        calendar: [{
          serviceId: "Weekday",
          startDate: "20260901",
          endDate: "20260930",
          days: [false, true, true, true, true, true, false],
        }],
        exceptions: [],
      },
    };

    expect(normalizeArrivals(feed, "127", "1", "N", timetableSource, stationNames).arrivals[0]).toMatchObject({
      scheduledTime,
      delaySeconds: 45,
      delayStatus: "mild",
      delayLabel: "Mildly delayed",
    });
  });

  it("matches a 24-hour static trip to the following calendar date", () => {
    const scheduledTime = newYorkServiceTimeToEpoch("20260913", "24:02:00");
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject({
      header: { gtfsRealtimeVersion: "1.0", timestamp: scheduledTime },
      entity: [{
        id: "after-midnight",
        tripUpdate: {
          trip: { tripId: "144000_6..N04X001", routeId: "6", startDate: "20260914" },
          stopTimeUpdate: [{ stopId: "638N", arrival: { time: scheduledTime + 20 } }],
        },
      }],
    });
    const timetableSource = {
      shard: {
        services: {
          Sunday: [{
            tripId: "ASP26GEN-Sunday-00_144000_6..N01R",
            arrival: "24:02:00",
            departure: "24:02:00",
          }],
        },
      },
      calendar: {
        calendar: [{
          serviceId: "Sunday",
          startDate: "20260901",
          endDate: "20260930",
          days: [true, false, false, false, false, false, false],
        }],
        exceptions: [],
      },
    };

    expect(normalizeArrivals(feed, "638", "6", "N", timetableSource, stationNames).arrivals[0]).toMatchObject({
      scheduledTime,
      delaySeconds: 20,
      delayStatus: "on-time",
    });
  });
});
