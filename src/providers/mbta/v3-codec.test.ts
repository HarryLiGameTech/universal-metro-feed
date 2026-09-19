import { describe, expect, it } from "vitest";
import { mbtaV3Codec, relatedId } from "./v3-codec";

const context = { nowSeconds: 1_000, timezone: "America/New_York" };

describe("MBTA V3 codec", () => {
  it("keeps source clocks and uncertainty raw until a source policy interprets them", () => {
    const row = {
      id: "p", type: "prediction", attributes: { arrival_time: "2026-09-19T11:00:00-04:00", arrival_uncertainty: 60 },
      relationships: { trip: { data: { id: "t" } }, stops: { data: [{ id: "a" }] } },
    };
    const result = mbtaV3Codec.decode({ data: [row] }, context);
    expect(result.data.data).toEqual([row]);
    expect(relatedId(result.data.data[0]!, "trip")).toBe("t");
    expect(relatedId(result.data.data[0]!, "stops")).toBeNull();
  });

  it.each([
    [null, "Invalid MBTA"],
    [{ errors: [{ detail: "Invalid filter" }] }, "Invalid filter"],
    [{ data: [{}] }, "resources"],
    [{ data: [], included: {} }, "resources"],
    [{ data: [], links: { next: 123 } }, "pagination"],
  ])("rejects malformed API data instead of yielding an empty schedule", (value, message) => {
    expect(() => mbtaV3Codec.decode(value, context)).toThrow(String(message));
  });
});
