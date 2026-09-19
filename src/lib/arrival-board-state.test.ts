import { describe, expect, it } from "vitest";
import type { Arrival } from "../types";
import { arrivalIdentity, visibleArrivals } from "./arrival-board-state";

function arrival(tripId: string, id: string, eventTime: number): Arrival {
  return {
    id, tripId, routeId: "1", stopId: "127N", direction: "N",
    destinationId: "101", destinationName: "Terminal", eventTime,
    eventKind: "arrival", scheduledTime: null, delaySeconds: null,
    delayStatus: "undetermined", delayLabel: "Untimed",
  };
}

describe("expanded arrival continuity", () => {
  it("keeps separate record identities when the provider has no trip IDs", () => {
    const first = { ...arrival("unused", "row-a", 1_200), tripId: null };
    const second = { ...first, id: "row-b" };
    expect(arrivalIdentity(first)).not.toBe(arrivalIdentity(second));
  });
  it("matches a train across feed refreshes when its entity ID and ETA change", () => {
    const selected = arrival("trip-1", "entity-a", 1_200);
    const refreshed = arrival("trip-1", "entity-b", 1_230);
    expect(arrivalIdentity(selected)).toBe(arrivalIdentity(refreshed));
    expect(visibleArrivals([refreshed], 1_000, selected)).toEqual([
      { arrival: refreshed, retained: false, fromFeed: true },
    ]);
  });

  it("keeps an expanded train visible when it falls outside the first four", () => {
    const selected = arrival("trip-5", "entity-a", 1_500);
    const feed = [1, 2, 3, 4].map((number) => arrival(`trip-${number}`, `entity-${number}`, 1_000 + number * 20));
    const visible = visibleArrivals([...feed, arrival("trip-5", "entity-b", 1_510)], 1_000, selected);
    expect(visible).toHaveLength(5);
    expect(visible.at(-1)).toMatchObject({ arrival: { id: "entity-b" }, retained: true, fromFeed: true });
  });

  it("retains the selected path without implying a vanished train is still live", () => {
    const selected = arrival("trip-1", "entity-a", 1_200);
    expect(visibleArrivals([], 1_300, selected)).toEqual([
      { arrival: selected, retained: true, fromFeed: false },
    ]);
  });
});
