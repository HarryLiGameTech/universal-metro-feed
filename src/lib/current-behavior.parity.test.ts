import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { afterEach, describe, expect, it, vi } from "vitest";
import { stations } from "../data/stations.generated";
import calendar from "../../tests/fixtures/mta-parity/static/calendar.json";
import shard from "../../tests/fixtures/mta-parity/static/127-1-N.json";
import topology from "../../tests/fixtures/mta-parity/static/topology.json";
import weekdayFeed from "../../tests/fixtures/mta-parity/realtime/weekday.feed.json";
import overnightFeed from "../../tests/fixtures/mta-parity/realtime/overnight.feed.json";
import expectedWeekdayArrivals from "../../tests/fixtures/mta-parity/expected/weekday-arrivals.json";
import expectedOvernightArrivals from "../../tests/fixtures/mta-parity/expected/overnight-arrivals.json";
import expectedNoStaticArrivals from "../../tests/fixtures/mta-parity/expected/no-static-arrivals.json";
import expectedWeekdayTimetable from "../../tests/fixtures/mta-parity/expected/weekday-timetable.json";
import expectedExceptionTimetable from "../../tests/fixtures/mta-parity/expected/exception-overnight-timetable.json";
import { fetchArrivals } from "./mta";
import { fetchTimetable, fetchTimetableForRoutes, renderTimetable } from "./timetable";
import { fetchComposedMtaArrivals, fetchComposedMtaArrivalsForRoutes, mtaResolver } from "../providers/mta/composed-resolver";

const realtimeUrl = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs";
const platformUrl = "/timetables/127/1-N.json";
const secondPlatformUrl = "/timetables/127/2-N.json";
const calendarUrl = "/timetables/calendar.json";

function installMockResponses(feed: object, options: { scheduleAvailable?: boolean } = {}) {
  const message = GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject(feed);
  const encodedFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.encode(message).finish();

  const mockFetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === realtimeUrl) {
      return new Response(new Uint8Array(encodedFeed), {
        headers: { "Content-Type": "application/x-protobuf" },
      });
    }
    if (url === platformUrl) {
      return options.scheduleAvailable === false
        ? new Response("Not found", { status: 404 })
        : Response.json(shard);
    }
    if (url === secondPlatformUrl) {
      return Response.json({ services: {
        Weekday: [{ tripId: "second-route", arrival: "08:02:00", departure: "08:02:00" }],
      } });
    }
    if (url === calendarUrl) return Response.json(calendar);
    if (url === "/providers/mta-subway/catalog.json") {
      return Response.json({
        providerId: topology.providerId,
        timezone: topology.timezone,
        routes: {},
        stations: [
          { id: topology.selectedPlatform.stationId, name: topology.selectedPlatform.stationName },
          { id: topology.knownTerminal.stationId, name: topology.knownTerminal.stationName },
        ],
      });
    }
    throw new Error(`Unexpected request in parity fixture: ${url}`);
  });

  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("current MTA behavior: frozen parity fixtures", () => {
  it("pins the generated station names used by the legacy destination resolver", () => {
    const selected = stations.find((station) => station.id === topology.selectedPlatform.stationId);
    const terminal = stations.find((station) => station.id === topology.knownTerminal.stationId);
    expect(selected?.name).toBe(topology.selectedPlatform.stationName);
    expect(terminal?.name).toBe(topology.knownTerminal.stationName);
    expect(selected?.routes.find((route) => route.routeId === topology.routeId)?.directions)
      .toContain(topology.selectedPlatform.direction);
  });

  it("resolves a weekday protobuf feed and static schedule into the current arrival snapshot", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    const mockFetch = installMockResponses(weekdayFeed);

    expect(await fetchArrivals("127", "1", "N")).toEqual(expectedWeekdayArrivals);
    expect(mockFetch.mock.calls.map(([input]) => String(input)).sort()).toEqual([
      calendarUrl,
      platformUrl,
      realtimeUrl,
    ].sort());
  });

  it("projects the composed MTA resolver to the exact weekday legacy snapshot", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    installMockResponses(weekdayFeed);

    expect(await fetchComposedMtaArrivals("127", "1", "N")).toEqual(expectedWeekdayArrivals);
  });

  it("merges shared-line arrivals chronologically while fetching their common feed only once", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    const mockFetch = installMockResponses(weekdayFeed);

    const result = await fetchComposedMtaArrivalsForRoutes("127", ["1", "2"], "N");
    expect(result.arrivals.map((arrival) => [arrival.routeId, arrival.tripId])).toEqual([
      ["2", "other-route-trip"],
      ["1", "048000_1..N03R"],
      ["1", "048600_1..N03R"],
      ["1", "unmatched-trip"],
    ]);
    expect(mockFetch.mock.calls.filter(([input]) => String(input) === realtimeUrl)).toHaveLength(1);
  });

  it("retains source and temporal semantics before the legacy projection", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    installMockResponses(weekdayFeed);

    const result = await mtaResolver.resolveDepartures(
      { providerId: "mta-subway", stationId: "127", routeId: "1", directionId: "N" },
      { nowSeconds: 1789473600 },
    );
    expect(result.sources.map((source) => source.sourceId)).toEqual([
      "mta-static-gtfs",
      "mta-static-gtfs",
      "mta-gtfs-realtime",
    ]);
    expect(result.data.arrivals[0]?.predictionTime).toMatchObject({ kind: "estimate", resolution: "second" });
    // MTA-subway policy was explicitly confirmed: GTFS stop_time seconds are real.
    expect(result.data.arrivals[0]?.scheduleTime).toMatchObject({ kind: "exact", resolution: "second" });
  });

  it("uses the previous service day for a post-midnight realtime trip", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T04:02:30.000Z"));
    installMockResponses(overnightFeed);

    expect(await fetchArrivals("127", "1", "N")).toEqual(expectedOvernightArrivals);
  });

  it("keeps the composed overnight result identical to the legacy result", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T04:02:30.000Z"));
    installMockResponses(overnightFeed);

    expect(await fetchComposedMtaArrivals("127", "1", "N")).toEqual(expectedOvernightArrivals);
  });

  it("returns live arrivals without delay values when the static response is unavailable", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    installMockResponses(weekdayFeed, { scheduleAvailable: false });

    expect(await fetchArrivals("127", "1", "N")).toEqual(expectedNoStaticArrivals);
  });

  it("keeps the composed realtime-only fallback identical to the legacy result", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    installMockResponses(weekdayFeed, { scheduleAvailable: false });

    expect(await fetchComposedMtaArrivals("127", "1", "N")).toEqual(expectedNoStaticArrivals);
  });

  it("renders the current weekday timetable from mocked Clockface-shaped static responses", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    const mockFetch = installMockResponses(weekdayFeed);

    expect(await fetchTimetable("127", "1", "N", "weekday")).toEqual(expectedWeekdayTimetable);
    expect(mockFetch.mock.calls.map(([input]) => String(input)).sort()).toEqual([
      calendarUrl,
      platformUrl,
    ].sort());
  });

  it("combines a shared-line timetable on one service date and retains each event's route", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00.000Z"));
    installMockResponses(weekdayFeed);

    const result = await fetchTimetableForRoutes("127", ["1", "2"], "N", "weekday");
    expect(result.dateKey).toBe("20260915");
    expect(result.scheduledTrainCount).toBe(expectedWeekdayTimetable.scheduledTrainCount + 1);
    expect(result.hours.flatMap((hour) => hour.events).map((event) => event.routeId))
      .toEqual(["1", "2", "1", "1"]);
  });

  it("applies a calendar exception but retains the prior Sunday's 24-hour trip", () => {
    expect(renderTimetable(shard, calendar, "20260914")).toEqual(expectedExceptionTimetable);
  });
});
