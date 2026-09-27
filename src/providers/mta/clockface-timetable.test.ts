import { afterEach, describe, expect, it, vi } from "vitest";
import { clockfaceTimetableLoader } from "./clockface-timetable";

const loader = clockfaceTimetableLoader({
  kind: "clockface",
  baseUrl: "https://clockface.example.test/",
  runId: "bf09d449-1b87-4133-b879-3ecceb634543",
});
const calendar = {
  calendar: [
    { serviceId: "Weekday", startDate: "20260901", endDate: "20260930", days: [false, true, true, true, true, true, false] },
    { serviceId: "Sunday", startDate: "20260901", endDate: "20260930", days: [true, false, false, false, false, false, false] },
  ],
  exceptions: [],
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Clockface MTA timetable", () => {
  it("requests the selected station, route and platform, then renders Clockface train runs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/timetables/calendar.json") return Response.json(calendar);
      if (url.includes("platformId=127N")) return Response.json([{ stop_id: "127", trainRuns: [
        { routeId: "1", platformId: "127N", filterTags: ["Weekday"], arrivalTime: { type: "TimeSpecSecond", hour: 8, minute: 1, second: 0 }, departureTime: { type: "TimeSpecSecond", hour: 8, minute: 2, second: 30 } },
        { routeId: "1", platformId: "127S", filterTags: ["Weekday"], departureTime: { type: "TimeSpecSecond", hour: 8, minute: 3, second: 0 } },
        { routeId: "1", platformId: "127N", filterTags: ["Sunday"], departureTime: { type: "TimeSpecSecond", hour: 25, minute: 10, second: 0 } },
        { routeId: "2", platformId: "127N", filterTags: ["Weekday"], departureTime: { type: "TimeSpecSecond", hour: 8, minute: 4, second: 0 } },
      ] }]);
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await loader("127", ["1", "2"], "N", "weekday");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      "https://clockface.example.test/v1/runs/bf09d449-1b87-4133-b879-3ecceb634543/stations/127/timetable?platformId=127N",
      "/timetables/calendar.json",
    ]);
    expect(result).toMatchObject({
      dayType: "weekday", dateKey: "20260915", availableDays: ["weekday", "sunday"], scheduledTrainCount: 2,
      hours: [{ hour: 8, events: [
        { minute: "02", hasHalfMinute: true, routeId: "1", eventKind: "departure" },
        { minute: "04", routeId: "2" },
      ] }],
    });
  });

  it("uses the prior service day's extended-hour train after midnight", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T12:00:00Z"));
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) =>
      String(input) === "/timetables/calendar.json" ? Response.json(calendar) :
        Response.json([{ stop_id: "127", trainRuns: [{
          routeId: "1", platformId: "127N", filterTags: ["Sunday"],
          departureTime: { type: "TimeSpecSecond", hour: 25, minute: 10, second: 30 },
        }, {
          routeId: "1", platformId: "127N", filterTags: ["Weekday"],
          departureTime: { type: "TimeSpecSecond", hour: 8, minute: 0, second: 0 },
        }] }])));
    const result = await loader("127", ["1"], "N", "weekday");
    expect(result.hours[0]).toMatchObject({ hour: 1, events: [{ minute: "10", hasHalfMinute: true }] });
  });

  it("reports unconfigured or unavailable Clockface instead of falling back to bundled times", async () => {
    await expect(clockfaceTimetableLoader({ kind: "clockface", baseUrl: "", runId: "" })("127", ["1"], "N", "weekday"))
      .rejects.toThrow("not been configured");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) =>
      String(input) === "/timetables/calendar.json" ? Response.json(calendar) : new Response(null, { status: 503 })));
    await expect(loader("127", ["1"], "N", "weekday")).rejects.toThrow("(503)");
  });

  it("rejects service tags absent from the local calendar", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) =>
      String(input) === "/timetables/calendar.json" ? Response.json(calendar) :
        Response.json([{ stop_id: "127", trainRuns: [{
          routeId: "1", platformId: "127N", filterTags: ["Weekday", "FutureService"],
          departureTime: { type: "TimeSpecSecond", hour: 8, minute: 0, second: 0 },
        }] }])));
    await expect(loader("127", ["1"], "N", "weekday"))
      .rejects.toThrow("service tags do not match");
  });
});
