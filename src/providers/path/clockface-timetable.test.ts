import { afterEach, describe, expect, it, vi } from "vitest";
import calendar from "../../../public/providers/path-rail/calendar.json";
import { pathClockfaceTimetableLoader } from "./clockface-timetable";

const baseUrl = "https://clockface.example.test";
const runId = calendar.sourceParseRunId;
const service = "26B-AllLines-Weekday-02";
const time = (hour: number, minute: number, second: number) =>
  ({ type: "TimeSpecSecond", hour, minute, second });
const run = (routeId: string, directionId: string, minute: number, second: number) => ({
  routeId, directionId, filterTags: [service], departureTime: time(8, minute, second),
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Clockface PATH timetable", () => {
  it("combines numeric stops, selects the outward direction, and marks seconds at or after 30 with +", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/providers/path-rail/calendar.json") return Response.json(calendar);
      if (url.endsWith("/stations/781722/timetable")) return Response.json([{ stop_id: "781722", trainRuns: [
        run("RED", "0", 1, 30), run("RED", "1", 5, 40),
      ] }]);
      if (url.endsWith("/stations/781723/timetable")) return Response.json([{ stop_id: "781723", trainRuns: [
        run("YEL", "0", 2, 31), run("ATW", "0", 3, 29),
      ] }]);
      throw new Error(`Unexpected request: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await pathClockfaceTimetableLoader({ baseUrl, runId })("JSQ", ["PATH"], "ToNY", "weekday");
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      `${baseUrl}/v1/runs/${runId}/stations/781722/timetable`,
      `${baseUrl}/v1/runs/${runId}/stations/781723/timetable`,
      "/providers/path-rail/calendar.json",
    ]);
    expect(result).toMatchObject({
      dateKey: "20260915", dayType: "weekday", availableDays: ["weekday"], scheduledTrainCount: 3,
      hours: [{ hour: 8, events: [
        { exactTime: "08:01:30", hasHalfMinute: true, routeId: "RED" },
        { exactTime: "08:02:31", hasHalfMinute: true, routeId: "YEL" },
        { exactTime: "08:03:29", hasHalfMinute: false, routeId: "ATW" },
      ] }],
    });
  });

  it("omits trains terminating at Hoboken from its ToNJ departure timetable", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-15T12:00:00Z"));
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) =>
      String(input) === "/providers/path-rail/calendar.json" ? Response.json(calendar) :
        Response.json([{ stop_id: "781744", trainRuns: [
          run("ATW", "1", 10, 42), run("GRE", "1", 11, 42), run("GRE", "0", 12, 42),
        ] }])));

    const result = await pathClockfaceTimetableLoader({ baseUrl, runId })("HOB", ["PATH"], "ToNJ", "weekday");
    expect(result.scheduledTrainCount).toBe(1);
    expect(result.hours[0]?.events[0]).toMatchObject({ exactTime: "08:10:42", routeId: "ATW", hasHalfMinute: true });
  });

  it("requires matching run and calendar data", async () => {
    await expect(pathClockfaceTimetableLoader({ baseUrl: "", runId: "" })("JSQ", ["PATH"], "ToNY", "weekday"))
      .rejects.toThrow("has not been configured");
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) =>
      String(input) === "/providers/path-rail/calendar.json" ? Response.json(calendar) :
        Response.json([{ stop_id: "781718", trainRuns: [] }])));
    await expect(pathClockfaceTimetableLoader({ baseUrl, runId: "other-run" })("NWK", ["PATH"], "ToNY", "weekday"))
      .rejects.toThrow("does not match");
  });
});
