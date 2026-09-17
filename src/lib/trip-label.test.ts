import { describe, expect, it } from "vitest";
import { compactTripId } from "./trip-label";

describe("trip identifier label", () => {
  it("keeps short IDs and abbreviates long source IDs without changing the underlying ID", () => {
    expect(compactTripId("A123")).toBe("A123");
    expect(compactTripId("048000_1..N03R")).toBe("048000…N03R");
    expect(compactTripId("opaque-long-trip-id")).toBe("…p-id");
  });
});
