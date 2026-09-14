import { describe, expect, it } from "vitest";
import { activeServiceIds, availableTimetableDays, findTimetableDate, renderTimetable, shiftDateKey } from "./timetable";

const calendar = {
  calendar: [
    { serviceId: "Weekday", startDate: "20260901", endDate: "20260930", days: [false, true, true, true, true, true, false] },
    { serviceId: "Saturday", startDate: "20260901", endDate: "20260930", days: [false, false, false, false, false, false, true] },
    { serviceId: "Sunday", startDate: "20260901", endDate: "20260930", days: [true, false, false, false, false, false, false] },
  ],
  exceptions: [{ serviceId: "Weekday", date: "20260914", exceptionType: 2 }],
};

describe("static timetable", () => {
  it("applies calendar exceptions", () => {
    expect([...activeServiceIds(calendar, "20260914")]).toEqual([]);
  });

  it("shifts date keys without depending on the browser timezone", () => {
    expect(shiftDateKey("20260301", -1)).toBe("20260228");
  });

  it("combines after-midnight service from yesterday with today's service", () => {
    const noExceptions = { ...calendar, exceptions: [] };
    const shard = {
      services: {
        Sunday: [{ arrival: "25:09:30", departure: "25:10:30" }],
        Weekday: [{ arrival: null, departure: "05:00:00" }],
      },
    };
    const result = renderTimetable(shard, noExceptions, "20260914");
    expect(result.hours.map((row) => [row.hour, row.events.map((event) => event.minute)])).toEqual([
      [1, ["10"]],
      [5, ["00"]],
    ]);
    expect(result.hours[1]?.events[0]?.eventKind).toBe("departure");
    expect(result.hours[0]?.events[0]?.hasHalfMinute).toBe(true);
    expect(result.hours[1]?.events[0]?.hasHalfMinute).toBe(false);
  });

  it("derives available day choices from services in the selected platform file", () => {
    const shard = { services: { Weekday: [], Sunday: [] } };
    expect(availableTimetableDays(shard, calendar)).toEqual(["weekday", "sunday"]);
  });

  it("finds a concrete service date for the chosen day type", () => {
    const shard = { services: { Saturday: [] } };
    expect(findTimetableDate(shard, calendar, "saturday", "20260914")).toBe("20260919");
  });
});
