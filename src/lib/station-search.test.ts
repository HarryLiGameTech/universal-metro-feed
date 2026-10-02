import { describe, expect, it } from "vitest";
import type { Route, Station } from "../types";
import { searchStations } from "./station-search";

const stations: Station[] = [
  { id: "1", name: "Times Sq–42 St", latitude: null, longitude: null, routes: [{ routeId: "N", directions: ["N"] }] },
  { id: "2", name: "Châtelet", latitude: null, longitude: null, routes: [{ routeId: "R", directions: ["S"] }] },
  { id: "3", name: "新宿", latitude: null, longitude: null, routes: [{ routeId: "E", directions: ["1"] }] },
];
const routes: Record<string, Route> = {
  N: { id: "N", name: "Broadway Express", color: "", textColor: "" },
};

describe("station search", () => {
  it("filters immediately for partial names, ignoring case, spaces, accents and punctuation", () => {
    expect(searchStations(stations, routes, "  tIMes   42 ")).toEqual([stations[0]]);
    expect(searchStations(stations, routes, "sq-42")).toEqual([stations[0]]);
    expect(searchStations(stations, routes, "chate")).toEqual([stations[1]]);
  });
  it("matches route names, station IDs and non-Latin names", () => {
    expect(searchStations(stations, routes, "broadway")).toEqual([stations[0]]);
    expect(searchStations(stations, routes, "3")).toEqual([stations[2]]);
    expect(searchStations(stations, routes, "新")).toEqual([stations[2]]);
  });
  it("shows all stations after clearing search and no results for unmatched text", () => {
    expect(searchStations(stations, routes, "  ")).toEqual(stations);
    expect(searchStations(stations, routes, "missing")).toEqual([]);
  });
});
