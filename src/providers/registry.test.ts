import { describe, expect, it } from "vitest";
import registryFixture from "../../public/providers/index.json";
import manifestFixture from "../../public/providers/mta-subway.json";
import { parseProviderCatalog, parseProviderManifest, parseProviderRegistry } from "./registry";

describe("provider configuration", () => {
  it("loads the MTA provider and keeps city as searchable metadata", () => {
    const registry = parseProviderRegistry(registryFixture);
    expect(registry.providers[0]).toMatchObject({
      id: "mta-subway",
      cities: [{ id: "us-ny-new-york" }],
    });
    expect(parseProviderManifest(manifestFixture, "mta-subway").topology.catalogUrl)
      .toBe("/providers/mta-subway/catalog.json");
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
