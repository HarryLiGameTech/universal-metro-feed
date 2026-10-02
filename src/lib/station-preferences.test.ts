// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FAVORITES_COOKIE, LAST_STATION_COOKIE, initialStationId, readFavorites, readLastStation, saveFavorites, saveLastStation } from "./station-preferences";
import type { Station } from "../types";

beforeEach(() => {
  for (const name of [FAVORITES_COOKIE, LAST_STATION_COOKIE]) document.cookie = `${name}=; Path=/; Max-Age=0`;
});
afterEach(() => vi.restoreAllMocks());

describe("station cookies", () => {
  it("keeps exactly one provider/station pair and replaces the previous visit", () => {
    expect(readLastStation()).toBeNull();
    expect(saveLastStation({ providerId: "mta-subway", stationId: "127" })).toBe("saved");
    expect(saveLastStation({ providerId: "toei-subway", stationId: "新宿" })).toBe("saved");
    expect(readLastStation()).toEqual({ providerId: "toei-subway", stationId: "新宿" });
    expect(document.cookie.split(";")).toHaveLength(1);
  });

  it("persists favorites across providers without modifying the last visit", () => {
    const last = { providerId: "cta", stationId: "1" };
    saveLastStation(last);
    const favorites = [{ providerId: "mta-subway", stationId: "1" }, { providerId: "cta", stationId: "1" }];
    expect(saveFavorites(favorites)).toBe("saved");
    expect(readFavorites()).toEqual(favorites);
    saveFavorites(favorites.slice(1));
    expect(readFavorites()).toEqual([last]);
    expect(readLastStation()).toEqual(last);
    saveFavorites([]);
    expect(readFavorites()).toEqual([]);
  });

  it.each(["%E0%A4%A", "not-json", "null", "[]", '{"providerId":123,"stationId":"1"}', '{"providerId":"cta","stationId":""}'])("ignores malformed last visits: %s", (value) => {
    document.cookie = `${LAST_STATION_COOKIE}=${value}; Path=/`;
    expect(readLastStation()).toBeNull();
  });

  it("removes duplicates and invalid favorites while preserving valid entries", () => {
    document.cookie = `${FAVORITES_COOKIE}=${encodeURIComponent(JSON.stringify([
      ["cta", "1"], ["cta", "1"], ["mta-subway", "1"], null, [123, "2"], ["cta", ""], {}, ["cta", "3", "extra"],
    ]))}; Path=/`;
    expect(readFavorites()).toEqual([{ providerId: "cta", stationId: "1" }, { providerId: "mta-subway", stationId: "1" }]);
  });

  it("does not overwrite saved favorites when a cookie would exceed its size budget", () => {
    const saved = [{ providerId: "cta", stationId: "1" }];
    saveFavorites(saved);
    expect(saveFavorites(Array.from({ length: 300 }, (_, index) => ({ providerId: "cta", stationId: String(index) })))).toBe("full");
    expect(readFavorites()).toEqual(saved);
  });

  it("keeps the page usable when cookies are blocked", () => {
    vi.spyOn(document, "cookie", "get").mockImplementation(() => { throw new Error("Cookies disabled"); });
    vi.spyOn(document, "cookie", "set").mockImplementation(() => { throw new Error("Cookies disabled"); });
    expect(readLastStation()).toBeNull();
    expect(readFavorites()).toEqual([]);
    expect(saveLastStation({ providerId: "cta", stationId: "1" })).toBe("unavailable");
    expect(saveFavorites([])).toBe("unavailable");
  });

  it("uses a persistent, same-site cookie scoped to the app", () => {
    const setter = vi.spyOn(document, "cookie", "set");
    saveLastStation({ providerId: "cta", stationId: "1" });
    expect(setter).toHaveBeenCalledWith(expect.stringContaining("Path=/; Max-Age=31536000; SameSite=Lax"));
  });
});

it("restores only existing stations, otherwise uses the configured default or first station", () => {
  const stations = [{ id: "first" }, { id: "default" }, { id: "saved" }] as Station[];
  expect(initialStationId(stations, "default", "saved")).toBe("saved");
  expect(initialStationId(stations, "default", "removed")).toBe("default");
  expect(initialStationId(stations, "removed", "removed")).toBe("first");
});
