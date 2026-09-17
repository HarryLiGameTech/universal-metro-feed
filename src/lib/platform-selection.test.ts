import { describe, expect, it } from "vitest";
import type { Station } from "../types";
import { directionDisplay, isSharedLineGroup, sharedLineGroups } from "./platform-selection";

// Small GTFS-derived fixture: 1/2/3 share the directed 34 St–Times Sq edge.
const timesSquare: Station = {
  id: "127", name: "Times Sq-42 St", latitude: 40.75529, longitude: -73.987495,
  routes: [
    { routeId: "1", directions: ["N", "S"], headsigns: {
      N: ["Van Cortlandt Park-242 St"], S: ["South Ferry"],
    }, adjacentSegments: { N: ["128N>127N"], S: ["127S>128S"] } },
    { routeId: "2", directions: ["N", "S"], headsigns: {
      N: ["Wakefield-241 St"], S: ["Flatbush Av-Brooklyn College"],
    }, adjacentSegments: { N: ["128N>127N"], S: ["127S>128S"] } },
    { routeId: "3", directions: ["N", "S"], headsigns: {
      N: ["Harlem-148 St"], S: ["New Lots Av"],
    }, adjacentSegments: { N: ["128N>127N"], S: ["127S>128S"] } },
  ],
};

describe("GTFS platform presentation", () => {
  it("uses published trip headsigns instead of fixed compass/city labels", () => {
    expect(directionDisplay(timesSquare, ["1"], "N").short).toContain("Van Cortlandt Park-242 St");
    expect(directionDisplay(timesSquare, ["1"], "S").short).toContain("South Ferry");
  });

  it("offers the 1/2/3 shared segment at Times Sq in both directions", () => {
    expect(sharedLineGroups(timesSquare, "N")).toContainEqual(["1", "2", "3"]);
    expect(sharedLineGroups(timesSquare, "S")).toContainEqual(["1", "2", "3"]);
  });

  it("does not group routes that merely share a station name or stop", () => {
    const station: Station = {
      id: "x", name: "Junction", latitude: 0, longitude: 0,
      routes: [
        { routeId: "A", directions: ["N"], adjacentSegments: { N: ["x>y"] } },
        { routeId: "B", directions: ["N"], adjacentSegments: { N: ["z>x"] } },
      ],
    };
    expect(sharedLineGroups(station, "N")).toEqual([]);
    expect(isSharedLineGroup(station, "N", ["A", "B"])).toBe(false);
  });

  it("does not infer a shared group when a catalog lacks GTFS segment evidence", () => {
    const station: Station = {
      id: "x", name: "Junction", latitude: 0, longitude: 0,
      routes: [{ routeId: "A", directions: ["N"] }, { routeId: "B", directions: ["N"] }],
    };
    expect(sharedLineGroups(station, "N")).toEqual([]);
  });
});
