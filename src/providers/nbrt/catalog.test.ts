import { describe, expect, it } from "vitest";
import catalogFixture from "../../../public/providers/nbrt-subway/catalog.json";
import type { ProviderCatalog } from "../registry";
import { sharedLineGroups } from "../../lib/platform-selection";
import type { Station } from "../../types";

const catalog: ProviderCatalog = catalogFixture;

describe("NBRT station directory", () => {
  it("contains the supplied station directory without inventing coordinates or line adjacency", () => {
    expect(catalog.stations).toHaveLength(179);
    expect(Object.keys(catalog.routes)).toHaveLength(9);
    for (const station of catalog.stations) {
      expect(station.latitude).toBeNull();
      expect(station.longitude).toBeNull();
      expect(sharedLineGroups(station as Station, "1")).toEqual([]);
      expect(station.routes.every((route) => !("adjacentSegments" in route))).toBe(true);
    }
  });

  it("configures opposite origin directions at the two line ends", () => {
    const route = (stationId: string) => catalog.stations.find((station) => station.id === stationId)?.routes.find((route) => route.routeId === "8");
    expect(route("163")?.originDirections).toEqual(["1"]);
    expect(route("175")?.originDirections).toEqual(["2"]);
    expect(route("164")?.originDirections).toBeUndefined();
  });
});
