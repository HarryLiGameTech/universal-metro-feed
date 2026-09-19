import { describe, expect, it } from "vitest";
import { nbrtScheduleAdapter } from "./schedule-adapter";

const context = { nowSeconds: Date.parse("2026-09-19T10:30:00Z") / 1_000, timezone: "Asia/Shanghai" };
const run = (extra: Record<string, unknown> = {}) => ({
  StationId: 164, LineId: 8, Flag: 1, Sequence: 1, Name: "Y164", Key: "8_1",
  IntimeStr: "18:34:10", OutTimeStr: "18:34:50", ...extra,
});
const payload = (rows: unknown[] = [run()], extra: Record<string, unknown> = {}) => ({
  Code: 200, Data: [{ StationId: 164, LineId: 8, Flag: 1, IsShow: 0, StationRunTimes: rows, ...extra }],
});

const decode = (value: unknown) => nbrtScheduleAdapter.decode(value, context).data;

describe("NBRT wire format", () => {
  it("keeps second-precision planned arrival and departure separately, even with IsShow=0", () => {
    expect(decode(payload())).toEqual([{
      stationId: "164", routeId: "8", directionId: "1",
      arrival: { kind: "exact", resolution: "second", epochSeconds: context.nowSeconds + 250, timezone: "Asia/Shanghai" },
      departure: { kind: "exact", resolution: "second", epochSeconds: context.nowSeconds + 290, timezone: "Asia/Shanghai" },
    }]);
  });

  it("excludes no-service placeholders instead of turning their clocks into trains", () => {
    expect(decode(payload([run()], { StationStatus: 2 }))).toEqual([]);
    expect(decode(payload([run({ IntimeDura: -60, OutTimeDura: -60 })]))).toEqual([]);
  });

  it("does not expose Sequence, Key, or Name as a trip identity", () => {
    const decoded = decode(payload([run(), run({ Sequence: 2, IntimeStr: "18:42:06" })]));
    expect(decoded).toHaveLength(2);
    expect(decoded[0]).not.toHaveProperty("tripId");
  });

  it.each([
    { Code: 500, Data: [] },
    { Code: 200, Data: null },
    payload([run({ IntimeStr: "18:60:00" })]),
    payload([run({ OutTimeStr: "48:00:00" })]),
    payload([run({ StationId: 7 })]),
  ])("rejects malformed responses rather than reporting an empty timetable", (value) => {
    expect(() => decode(value)).toThrow();
  });

  it("preserves missing events and a valid empty response", () => {
    expect(decode(payload([run({ IntimeStr: null })]))[0]?.arrival).toBeNull();
    expect(decode({ Code: 200, Data: [] })).toEqual([]);
  });
});
