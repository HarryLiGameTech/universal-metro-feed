import { describe, expect, it } from "vitest";
import catalog from "../../../public/providers/toei-subway/catalog.json";
import fixture from "../../../public/providers/toei-subway/trip-map.json";
import type { ToeiTripMap } from "./trip-map";

const map = fixture as ToeiTripMap;

describe("Toei's generated lightweight references", () => {
  it("keeps only subway lines and shares stopping patterns across trips", () => {
    expect(Object.values(catalog.routes).map((route) => route.name)).toEqual(["浅草線", "三田線", "新宿線", "大江戸線"]);
    const mappedTrips = Object.values(map.trips).filter((index) => index !== null);
    expect(map.patterns.length).toBeLessThan(mappedTrips.length / 10);
    expect(map.source).toEqual(catalog.source);
    expect(map.source.feedVersion).toBeTruthy();
    expect(map.source.feedStartDate).toMatch(/^\d{8}$/);
    expect(map.source.feedEndDate).toMatch(/^\d{8}$/);
  });

  it("preserves usable stop references for every trip without shipping scheduled times", () => {
    for (const index of Object.values(map.trips)) {
      if (index === null) continue;
      expect(map.patterns[index]).toBeDefined();
    }
    for (const pattern of map.patterns) {
      for (const [sequence, stopId] of Object.entries(pattern.stops)) {
        expect(Number.isInteger(Number(sequence))).toBe(true);
        expect(catalog.stations.some((station) => station.routes.some((route) =>
          route.routeId === pattern.routeId && route.directions.includes(pattern.direction!) &&
          (route.stopIds as Record<string, string[]>)[pattern.direction!]?.includes(stopId)))).toBe(true);
      }
    }
    const serialized = JSON.stringify({ catalog, map });
    expect(serialized).not.toMatch(/arrival_time|departure_time|scheduledTime|fare_rules|shape_dist_traveled/);
    expect(new TextEncoder().encode(serialized).length).toBeLessThan(200_000);
  });
});
