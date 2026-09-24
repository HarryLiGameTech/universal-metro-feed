import { describe, expect, it } from "vitest";
import registryFixture from "../../public/providers/index.json";
import manifestFixture from "../../public/providers/mta-subway.json";
import mbtaManifestFixture from "../../public/providers/mbta-subway.json";
import nbrtManifestFixture from "../../public/providers/nbrt-subway.json";
import toeiManifestFixture from "../../public/providers/toei-subway.json";
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

  it("validates HTTP predictions independently and rejects the old provider-specific kind", () => {
    for (const predictions of [
      { kind: "proprietary-http", adapter: "mbta-v3" },
      { kind: "proprietary-http", adapter: "mbta-v3", urlTemplate: "http://api.example/predictions" },
      { kind: "mbta-v3", adapter: "mbta-v3" },
    ]) {
      expect(() => parseProviderManifest({ ...mbtaManifestFixture, predictions }, "mbta-subway")).toThrow("Invalid provider manifest");
    }
    expect(() => parseProviderManifest({ ...mbtaManifestFixture, schedule: { kind: "mbta-v3" } }, "mbta-subway"))
      .toThrow("Invalid provider manifest");
  });
  it("loads the MTA provider and keeps city as searchable metadata", () => {
    const registry = parseProviderRegistry(registryFixture);
    expect(registry.providers[0]).toMatchObject({
      id: "mta-subway",
      cities: [{ id: "us-ny-new-york" }],
    });
    const topology = parseProviderManifest(manifestFixture, "mta-subway").topology;
    expect(topology.kind === "none" ? null : topology.catalogUrl)
      .toBe("/providers/mta-subway/catalog.json");
  });

  it("registers Boston independently and preserves its GTFS topology with an API fallback", () => {
    const registry = parseProviderRegistry(registryFixture);
    expect(registry.providers.find((provider) => provider.id === "mbta-subway")?.cities)
      .toMatchObject([{ id: "us-ma-boston" }]);
    const manifest = parseProviderManifest(mbtaManifestFixture, "mbta-subway");
    expect(manifest.topology.kind).toBe("gtfs-static");
    expect(manifest.schedule).toMatchObject({ kind: "proprietary-http", adapter: "mbta-v3", coverage: "full-day" });
    expect(manifest.predictions.kind).toBe("proprietary-http");
    expect(manifest.predictions.kind === "proprietary-http" ? manifest.predictions.adapter : null).toBe("mbta-v3");
  });

  it("stages Toei's standard dynamic feeds without inventing unavailable static data", () => {
    expect(parseProviderRegistry(registryFixture).providers.find((provider) => provider.id === "toei-subway"))
      .toMatchObject({
        names: { en: "Toei Subway · 都営地下鉄" },
        cities: [{ id: "jp-13-tokyo" }],
        manifest: "/providers/toei-subway.json",
      });
    const manifest = parseProviderManifest(toeiManifestFixture, "toei-subway");
    expect(manifest).toMatchObject({
      topology: { kind: "none" },
      schedule: { kind: "none" },
      predictions: {
        kind: "gtfs-realtime",
        adapter: "toei",
        urlTemplate: "https://api-public.odpt.org/api/v4/gtfs/realtime/toei_odpt_train_trip_update",
      },
      observations: {
        kind: "gtfs-realtime",
        urlTemplate: "https://api-public.odpt.org/api/v4/gtfs/realtime/toei_odpt_train_vehicle",
      },
      alerts: {
        kind: "gtfs-realtime",
        urlTemplate: "https://api-public.odpt.org/api/v4/gtfs/realtime/toei_odpt_train_alert",
      },
    });
  });

  it("rejects insecure generic GTFS-Realtime endpoints", () => {
    expect(() => parseProviderManifest({
      ...toeiManifestFixture,
      predictions: { kind: "gtfs-realtime", urlTemplate: "http://example.test/trip-updates" },
    }, "toei-subway")).toThrow("Invalid provider manifest");
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
