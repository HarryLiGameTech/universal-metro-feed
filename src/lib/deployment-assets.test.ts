import { afterEach, expect, it, vi } from "vitest";
import registryFixture from "../../public/providers/index.json";
import manifestFixture from "../../public/providers/mta-subway.json";
import { catalogUrlForProvider, loadProviderCatalog, loadProviderManifest, loadProviderRegistry } from "../providers/registry";
import { fetchTimetableSource } from "./timetable";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(["/", "/universal-metro-feed/"])("loads provider and timetable data when hosted at %s", async (base) => {
  vi.stubEnv("BASE_URL", base);
  const catalog = { providerId: "mta-subway", timezone: "America/New_York", routes: {}, stations: [] };
  const files: Record<string, unknown> = {
    [`${base}providers/index.json`]: registryFixture,
    [`${base}providers/mta-subway.json`]: manifestFixture,
    [`${base}providers/mta-subway/catalog.json`]: catalog,
    [`${base}timetables/127/1-N.json`]: { services: {} },
    [`${base}timetables/calendar.json`]: { calendar: [], exceptions: [] },
  };
  const fetchMock = vi.fn(async (url: string) => new Response(JSON.stringify(files[url] ?? {}), {
    status: url in files ? 200 : 404,
  }));
  vi.stubGlobal("fetch", fetchMock);

  const registry = await loadProviderRegistry();
  const manifest = await loadProviderManifest(registry.providers[0]!);
  // Reload the registry module to avoid sharing its catalog cache between deployments.
  const { loadProviderCatalog: loadCatalog } = await import("../providers/registry");
  expect(await loadCatalog(catalogUrlForProvider(manifest), manifest.id)).toEqual(catalog);
  expect(await fetchTimetableSource("127", "1", "N")).toEqual({
    shard: { services: {} },
    calendar: { calendar: [], exceptions: [] },
  });
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(Object.keys(files));
});

it("preserves external catalog URLs", async () => {
  vi.stubEnv("BASE_URL", "/universal-metro-feed/");
  const url = "https://example.com/catalog.json";
  const fetchMock = vi.fn(async () => new Response(JSON.stringify({
    providerId: "external", timezone: "UTC", routes: {}, stations: [],
  })));
  vi.stubGlobal("fetch", fetchMock);
  await loadProviderCatalog(url, "external");
  expect(fetchMock).toHaveBeenCalledWith(url);
});
