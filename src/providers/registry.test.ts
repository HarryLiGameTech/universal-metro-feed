import { describe, expect, it } from "vitest";
import registryFixture from "../../public/providers/index.json";
import manifestFixture from "../../public/providers/mta-subway.json";
import mbtaManifestFixture from "../../public/providers/mbta-subway.json";
import nbrtManifestFixture from "../../public/providers/nbrt-subway.json";
import { parseProviderCatalog, parseProviderManifest, parseProviderRegistry } from "./registry";

describe("provider configuration", () => {
  it("registers Ningbo as a partial HTTP schedule with no predictions or line topology", () => {
    expect(parseProviderRegistry(registryFixture).providers.find((provider) => provider.id === "nbrt-subway")?.cities)
      .toMatchObject([{ id: "cn-zj-ningbo" }]);
    expect(parseProviderManifest(nbrtManifestFixture, "nbrt-subway")).toMatchObject({
      topology: { kind: "station-directory" },
      schedule: { kind: "proprietary-http", coverage: "partial" },
      predictions: { kind: "none" },
    });
  });

  it("rejects incomplete proprietary HTTP schedule configuration", () => {
    expect(() => parseProviderManifest({ ...nbrtManifestFixture, schedule: { kind: "proprietary-http" } }, "nbrt-subway"))
      .toThrow("Invalid provider manifest");
  });
  it("loads the MTA provider and keeps city as searchable metadata", () => {
    const registry = parseProviderRegistry(registryFixture);
    expect(registry.providers[0]).toMatchObject({
      id: "mta-subway",
      cities: [{ id: "us-ny-new-york" }],
    });
    expect(parseProviderManifest(manifestFixture, "mta-subway").topology.catalogUrl)
      .toBe("/providers/mta-subway/catalog.json");
  });

  it("registers Boston independently and preserves its GTFS topology with an API fallback", () => {
    const registry = parseProviderRegistry(registryFixture);
    expect(registry.providers.find((provider) => provider.id === "mbta-subway")?.cities)
      .toMatchObject([{ id: "us-ma-boston" }]);
    const manifest = parseProviderManifest(mbtaManifestFixture, "mbta-subway");
    expect(manifest.topology.kind).toBe("gtfs-static");
    expect(manifest.predictions.adapter).toBe("mbta-v3");
  });

  it("accepts one provider associated with multiple cities", () => {
    const registry = parseProviderRegistry({
      schemaVersion: 1,
      providers: [{
        id: "cross-city-line",
        names: { en: "Cross-city line" },
        manifest: "/providers/cross-city-line.json",
        cities: [
          { id: "city-a", names: { en: "City A" } },
          { id: "city-b", names: { en: "City B" } },
        ],
      }],
    });
    expect(registry.providers).toHaveLength(1);
    expect(registry.providers[0]?.cities).toHaveLength(2);
  });

  it("rejects duplicate provider IDs and mismatched manifests", () => {
    expect(() => parseProviderRegistry({
      schemaVersion: 1,
      providers: [registryFixture.providers[0], registryFixture.providers[0]],
    })).toThrow("Duplicate provider ID");
    expect(() => parseProviderManifest(manifestFixture, "mta-lirr")).toThrow("Invalid provider manifest");
  });

  it("rejects catalogs that do not match the selected provider", () => {
    expect(() => parseProviderCatalog({
      providerId: "mta-lirr",
      timezone: "America/New_York",
      routes: {},
      stations: [],
    }, "mta-subway")).toThrow("Invalid provider catalog");
  });
});
