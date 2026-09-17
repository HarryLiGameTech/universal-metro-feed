import { describe, expect, it } from "vitest";
import type { transit_realtime } from "gtfs-realtime-bindings";
import type { TripPathQuery } from "../../domain/trip-path";
import { presentStrictTime } from "../../domain/strict-time";
import { newYorkServiceTimeToEpoch } from "../../lib/timetable";
import { resolveMtaTripPath, tripPathBucket, type StaticTripPath } from "./trip-path-resolver";

const day = "20260917";
const epoch = (time: string) => newYorkServiceTimeToEpoch(day, time);
const query: TripPathQuery = {
  providerId: "mta-subway",
  stationId: "S2",
  routeId: "1",
  directionId: "N",
  tripId: "140000_1..N",
  entityId: "train-1",
  anchorEventTime: epoch("14:02:34"),
  anchorEventKind: "arrival",
};

const staticPath: StaticTripPath = {
  routeId: "1",
  serviceId: "WKD",
  stops: [
    { stopId: "S1N", sequence: 1, arrival: "14:00:00", departure: "14:00:30" },
    { stopId: "S2N", sequence: 2, arrival: "14:02:00", departure: "14:02:40" },
    { stopId: "S3N", sequence: 3, arrival: "14:06:00", departure: "14:06:40" },
    { stopId: "S4N", sequence: 4, arrival: "14:10:15", departure: null },
  ],
};

const schedule = {
  timetable: {
    shard: { services: { WKD: [{ tripId: "WKD_140000_1..N", arrival: "14:02:00", departure: "14:02:40" }] } },
    calendar: { calendar: [{ serviceId: "WKD", startDate: day, endDate: day, days: [true, true, true, true, true, true, true] }], exceptions: [] },
  },
  paths: { "WKD_140000_1..N": staticPath },
};

const feed = {
  header: { timestamp: epoch("14:02:20") },
  entity: [{
    id: "train-1",
    tripUpdate: {
      trip: { routeId: "1", tripId: "140000_1..N", startDate: day },
      stopTimeUpdate: [
        { stopId: "S1N", stopSequence: 1, arrival: { time: epoch("14:00:05") }, departure: { time: epoch("14:00:35") } },
        { stopId: "S2N", stopSequence: 2, arrival: { time: epoch("14:02:34") }, departure: { time: epoch("14:03:04") } },
        { stopId: "S3N", stopSequence: 3, arrival: { time: epoch("14:06:27") } },
      ],
    },
  }],
} as unknown as transit_realtime.FeedMessage;

const names = new Map([
  ["S1", "First"], ["S2", "Second"], ["S3", "Third"], ["S4", "Fourth"],
]);

describe("MTA trip path fusion", () => {
  it("keeps past stops scheduled, future feed times live, and absent fields absent", () => {
    const path = resolveMtaTripPath(query, names, schedule, feed, true, epoch("14:02:20"));
    expect(path.topology).toBe("full");
    expect(path.stops.map((stop) => stop.name)).toEqual(["First", "Second", "Third", "Fourth"]);
    expect(path.stops[0]).toMatchObject({
      position: "past",
      arrival: { source: "schedule", time: { kind: "exact", epochSeconds: epoch("14:00:00") } },
      departure: { source: "schedule", time: { kind: "exact", epochSeconds: epoch("14:00:30") } },
    });
    expect(path.stops[1]).toMatchObject({
      position: "current",
      departureDelayStatus: "on-time",
      arrival: { source: "prediction", time: { kind: "estimate", epochSeconds: epoch("14:02:34"), resolution: "second" } },
      departure: { source: "prediction", time: { kind: "estimate", epochSeconds: epoch("14:03:04") } },
      scheduledArrival: { source: "schedule", time: { kind: "exact", epochSeconds: epoch("14:02:00") } },
      scheduledDeparture: { source: "schedule", time: { kind: "exact", epochSeconds: epoch("14:02:40") } },
    });
    expect(path.stops[2]).toMatchObject({
      departureDelayStatus: null,
      arrival: { source: "prediction", time: { kind: "estimate", epochSeconds: epoch("14:06:27") } },
      departure: { source: "schedule", time: { kind: "exact", epochSeconds: epoch("14:06:40") } },
    });
    expect(path.stops[3]).toMatchObject({
      arrival: { source: "schedule", time: { kind: "exact", epochSeconds: epoch("14:10:15") } },
      departure: null,
    });
    expect(presentStrictTime(path.stops[3]!.arrival!.time)).toEqual({ primary: "14:10:15", qualifier: "none" });
    expect(presentStrictTime(path.stops[2]!.arrival!.time)).toEqual({ primary: "14:06:27", qualifier: "about" });
  });

  it("falls back to static times when a feed is stale", () => {
    const path = resolveMtaTripPath(query, names, schedule, feed, false, epoch("14:02:20"));
    expect(path.stops[1]?.arrival?.source).toBe("schedule");
    expect(path.stops[2]?.arrival?.source).toBe("schedule");
    expect(path.stops[1]?.departureDelayStatus).toBeNull();
  });

  it("uses departure delay to color both live arrival and departure at a stop", () => {
    const delayedFeed = structuredClone(feed);
    delayedFeed.entity[0]!.tripUpdate!.stopTimeUpdate![2]!.departure = { time: epoch("14:07:25") };
    const path = resolveMtaTripPath(query, names, schedule, delayedFeed, true, epoch("14:02:20"));
    expect(path.stops[2]).toMatchObject({
      arrival: { source: "prediction" },
      departure: { source: "prediction" },
      departureDelayStatus: "mild",
    });
  });

  it("keeps topology when neither static nor realtime supplies any stop times", () => {
    const noTimesSchedule = {
      timetable: {
        shard: { services: { WKD: [{ tripId: "WKD_140000_1..N", arrival: null, departure: null }] } },
        calendar: { calendar: [{ serviceId: "WKD", startDate: "20260916", endDate: day,
          days: [true, true, true, true, true, true, true] }], exceptions: [] },
      },
      paths: { "WKD_140000_1..N": {
        ...staticPath,
        stops: staticPath.stops.map((stop) => ({ ...stop, arrival: null, departure: null })),
      } },
    };
    const noTimesFeed = {
      entity: [{ id: "train-1", tripUpdate: {
        trip: { routeId: "1", tripId: "140000_1..N", startDate: day },
        stopTimeUpdate: [{ stopId: "S2N", stopSequence: 2 }],
      } }],
    } as unknown as transit_realtime.FeedMessage;
    const path = resolveMtaTripPath(query, names, noTimesSchedule, noTimesFeed, true, epoch("14:02:20"));
    expect(path.topology).toBe("full");
    expect(path.stops.map((stop) => stop.name)).toEqual(["First", "Second", "Third", "Fourth"]);
    expect(path.stops.every((stop) => stop.arrival === null && stop.departure === null)).toBe(true);
    const inactiveCalendar = {
      ...noTimesSchedule,
      timetable: { ...noTimesSchedule.timetable, calendar: { calendar: [], exceptions: [] } },
    };
    const withoutActiveService = resolveMtaTripPath(query, names, inactiveCalendar, noTimesFeed, true, epoch("14:02:20"));
    expect(withoutActiveService.topology).toBe("full");
    expect(withoutActiveService.stops[0]).toMatchObject({ name: "First", arrival: null });
  });

  it("does not invent earlier stops or a full line from a live-only update", () => {
    const path = resolveMtaTripPath(query, names, null, feed, true, epoch("14:02:20"));
    expect(path.topology).toBe("partial");
    expect(path.stops[0]?.arrival).toBeNull();
    expect(path.stops[2]?.departure).toBeNull();
  });

  it("can show a partial path when only a feed entity ID identifies the train", () => {
    const entityOnly = {
      entity: [{ id: "feed-entity-1", tripUpdate: {
        trip: { routeId: "1", startDate: day },
        stopTimeUpdate: [{ stopId: "S2N", stopSequence: 2, arrival: { time: epoch("14:02:34") } }],
      } }],
    } as unknown as transit_realtime.FeedMessage;
    const path = resolveMtaTripPath(
      { ...query, tripId: "feed-entity-1", entityId: "feed-entity-1" }, names, null, entityOnly, true, epoch("14:02:20"),
    );
    expect(path.topology).toBe("partial");
    expect(path.stops[0]).toMatchObject({ position: "current", arrival: { source: "prediction" } });
  });

  it("uses a deterministic small shard name for on-demand static loading", () => {
    expect(tripPathBucket("WKD_140000_1..N")).toMatch(/^[0-7][0-9a-f]$/);
  });
});
