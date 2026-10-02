// @vitest-environment jsdom
import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { FAVORITES_COOKIE, LAST_STATION_COOKIE, readFavorites, readLastStation, saveLastStation } from "./lib/station-preferences";
import type { ProviderCatalog, ProviderDescriptor, ProviderManifest } from "./providers/registry";
import type { ProviderRuntime } from "./providers/runtime";

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;
const providers: ProviderDescriptor[] = ["mta-subway", "cta"].map((id) => ({ id, names: { en: id }, cities: [], manifest: `/${id}.json` }));

function cacheProvider(id: string, showRealtime = true) {
  const catalog: ProviderCatalog = {
    providerId: id, timezone: "America/New_York", routes: { A: { id: "A", name: "Alpha line", color: "#000", textColor: "#fff" } },
    stations: ["first", "default", "saved"].map((stationId) => ({
      id: stationId, name: `${id} ${stationId}`, latitude: null, longitude: null,
      routes: [{ routeId: "A", directions: ["N"] }],
    })),
  };
  const manifest: ProviderManifest = {
    schemaVersion: 1, id, timezone: catalog.timezone, defaultStationId: "default",
    topology: { kind: "gtfs-static", catalogUrl: "/catalog.json" }, schedule: { kind: "none" }, predictions: { kind: "none" },
  };
  const runtime: ProviderRuntime = {
    showRealtime, arrivalSource: "prediction", feedLabel: "Test feed", refreshIntervalMs: 60_000,
    loadArrivals: vi.fn().mockResolvedValue({ arrivals: [], fetchedAt: Date.now() / 1000, feedTimestamp: null }),
    loadTripPath: null,
    loadTimetable: vi.fn().mockResolvedValue({ dateKey: "20261002", dayType: "weekday", availableDays: ["weekday"], hours: [], scheduledTrainCount: 0 }),
  };
  client.setQueryData(["provider", id], { catalog, manifest, runtime });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  for (const name of [FAVORITES_COOKIE, LAST_STATION_COOKIE]) document.cookie = `${name}=; Path=/; Max-Age=0`;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(["provider-registry"], { schemaVersion: 1, providers });
  cacheProvider("mta-subway");
  cacheProvider("cta");
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  vi.unstubAllGlobals();
});

async function renderApp() {
  await act(async () => root.render(<StrictMode><QueryClientProvider client={client}><App /></QueryClientProvider></StrictMode>));
}
async function reloadApp() {
  await act(async () => root.unmount());
  root = createRoot(container);
  await renderApp();
}
async function click(selector: string) {
  const button = container.querySelector<HTMLButtonElement>(selector);
  expect(button, selector).not.toBeNull();
  await act(async () => button!.click());
}
async function search(query: string, prefix = "realtime") {
  const input = container.querySelector<HTMLInputElement>(`#${prefix}-station-search`)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, query);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function changeProvider(id: string) {
  await act(async () => {
    const select = container.querySelector<HTMLSelectElement>("#provider-choice")!;
    select.value = id;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
const currentStations = () => [...container.querySelectorAll(".station-current strong")].map((element) => element.textContent);

describe("station selection and persistence", () => {
  it("starts at the default without cookies and restores the saved provider/station on reload", async () => {
    await renderApp();
    expect(currentStations()).toEqual(["mta-subway default", "mta-subway default"]);
    await changeProvider("cta");
    await search("saved");
    await click("#realtime-station-results .station-result-choice");
    expect(readLastStation()).toEqual({ providerId: "cta", stationId: "saved" });
    await reloadApp();
    expect(container.querySelector<HTMLSelectElement>("#provider-choice")!.value).toBe("cta");
    expect(currentStations()).toEqual(["cta saved", "cta saved"]);
  });

  it("falls back safely for a removed provider or station", async () => {
    saveLastStation({ providerId: "removed", stationId: "saved" });
    await renderApp();
    expect(currentStations()).toEqual(["mta-subway default", "mta-subway default"]);
    saveLastStation({ providerId: "cta", stationId: "removed" });
    await reloadApp();
    expect(currentStations()).toEqual(["cta default", "cta default"]);
  });

  it("remembers timetable selections, including providers without a live board", async () => {
    cacheProvider("cta", false);
    await renderApp();
    await search("saved", "timetable");
    await click("#timetable-station-results .station-result-choice");
    expect(readLastStation()).toEqual({ providerId: "mta-subway", stationId: "saved" });
    await reloadApp();
    expect(currentStations()).toEqual(["mta-subway saved", "mta-subway saved"]);
    await changeProvider("cta");
    await search("first", "timetable");
    await click("#timetable-station-results .station-result-choice");
    await reloadApp();
    expect(currentStations()).toEqual(["cta first"]);
  });

  it("filters on each keystroke without changing the viewed station and supports keyboard selection", async () => {
    await renderApp();
    await search("sav");
    expect(container.querySelectorAll("#realtime-station-results li")).toHaveLength(1);
    expect(currentStations()[0]).toBe("mta-subway default");
    const input = container.querySelector<HTMLInputElement>("#realtime-station-search")!;
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
    expect(document.activeElement).toBe(container.querySelector("#realtime-station-results .station-result-choice"));
    await search("no match");
    expect(container.querySelectorAll("#realtime-station-results li")).toHaveLength(0);
    expect(container.textContent).toContain("No stations match your search.");
    await click('[aria-label="Clear station search"]');
    expect(container.querySelectorAll("#realtime-station-results li")).toHaveLength(3);
    await search("saved");
    await changeProvider("cta");
    expect(container.querySelector<HTMLInputElement>("#realtime-station-search")!.value).toBe("");
  });

  it("shares favorites between selectors, scopes them to providers, and persists addition/removal", async () => {
    await renderApp();
    await click('.station-current [aria-label="Add mta-subway default to favorites"]');
    expect(container.querySelectorAll('.station-current [aria-pressed="true"]')).toHaveLength(2);
    await changeProvider("cta");
    expect(container.querySelectorAll('.station-current [aria-pressed="true"]')).toHaveLength(0);
    await click('.station-current [aria-label="Add cta default to favorites"]');
    await reloadApp();
    expect(readFavorites()).toHaveLength(2);
    await click('.station-filters button:nth-child(2)');
    expect(container.querySelectorAll("#realtime-station-results li")).toHaveLength(1);
    await click('.station-current [aria-label="Remove cta default from favorites"]');
    expect(container.textContent).toContain("No favorites yet. Use a star to save a station.");
    await reloadApp();
    expect(readFavorites()).toEqual([{ providerId: "mta-subway", stationId: "default" }]);
  });
});
