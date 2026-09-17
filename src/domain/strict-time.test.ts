import { describe, expect, it } from "vitest";
import { boundedTime, estimatedTime, exactTime, presentStrictTime, publishedMinute, uninterpretedTime } from "./strict-time";

const minuteStart = Date.parse("2026-09-15T14:00:00Z") / 1_000;

describe("StrictTime", () => {
  it("keeps exact zero seconds distinct from a minute publication", () => {
    expect(presentStrictTime(exactTime(minuteStart, "UTC"))).toEqual({ primary: "14:00:00", qualifier: "none" });
    expect(presentStrictTime(publishedMinute(minuteStart, "UTC", "truncated"))).toEqual({
      primary: "14:00",
      qualifier: "none",
    });
    expect(publishedMinute(minuteStart, "UTC", "underspecified")).toMatchObject({
      kind: "published-minute",
      semantics: "underspecified",
    });
  });

  it("preserves a precise lower bound without claiming an exact arrival", () => {
    expect(presentStrictTime(boundedTime({ earliestEpochSeconds: minuteStart + 37 }, "UTC", "second")))
      .toEqual({ primary: "14:00:37", qualifier: "earliest" });
  });

  it("does not manufacture seconds for a minute-resolution estimate", () => {
    expect(presentStrictTime(estimatedTime(minuteStart + 37, "UTC", "minute")))
      .toEqual({ primary: "14:00", qualifier: "about" });
  });

  it("refuses to present a parsed source value before its precision is interpreted", () => {
    expect(() => presentStrictTime(uninterpretedTime(minuteStart, "UTC", "second", "Seconds may be padding")))
      .toThrow("cannot be presented");
  });

  it("rejects invalid or inverted bounds and unaligned minute buckets", () => {
    expect(() => publishedMinute(minuteStart + 1, "UTC", "truncated")).toThrow();
    expect(() => boundedTime({}, "UTC", "second")).toThrow();
    expect(() => boundedTime({ earliestEpochSeconds: 2, latestEpochSeconds: 1 }, "UTC", "second"))
      .toThrow();
  });
});
