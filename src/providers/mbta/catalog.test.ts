import { describe, expect, it } from "vitest";
import catalog from "../../../public/providers/mbta-subway/catalog.json";
import { sharedLineGroups } from "../../lib/platform-selection";
import type { Station } from "../../types";

describe("MBTA GTFS catalog", () => {
  it("keeps station, platform stop, route, and direction identities separate", () => {
    const south = catalog.stations.find((station) => station.id === "place-sstat");
    const red = south?.routes.find((route) => route.routeId === "Red");
    expect(red?.stopIds["0"]).toEqual(["70079"]);
    expect(red?.stopIds["1"]).toEqual(["70080"]);
    expect(red?.directionNames["0"]).toContain("Ashmont/Braintree");
  });

  it("offers a Green Line group only where GTFS confirms a directed shared segment", () => {
    const park = catalog.stations.find((station) => station.id === "place-pktrm") as Station;
    const groups = sharedLineGroups(park, "0");
    expect(groups).toContainEqual(["Green-B", "Green-C", "Green-D", "Green-E"]);
    expect(groups.some((group) => group.includes("Red") && group.includes("Green-B"))).toBe(false);
  });
});
