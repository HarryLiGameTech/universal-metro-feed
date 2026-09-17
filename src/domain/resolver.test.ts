import { describe, expect, it } from "vitest";
import {
  CompositeMetroDataResolver,
  type FusionPolicy,
  type PlatformQuery,
  type Resolved,
  type ResolutionContext,
} from "./resolver";

const query: PlatformQuery = {
  providerId: "test-provider",
  stationId: "station",
  routeId: "route",
  directionId: "outbound",
};
const context: ResolutionContext = { nowSeconds: 1_000 };

function result<T>(data: T): Resolved<T> {
  return { data, generatedAt: 1_000, freshness: "live", sources: [], warnings: [] };
}

const fusion: FusionPolicy<number, number, number, number, number> = {
  resolve({ topology, schedule, prediction, observation, warnings }) {
    return {
      ...result(topology.data + (schedule?.data ?? 0) + (prediction?.data ?? 0) + (observation?.data ?? 0)),
      warnings,
    };
  },
};

describe("CompositeMetroDataResolver", () => {
  it("resolves a prediction-only provider without inventing a schedule or observation", async () => {
    const resolver = new CompositeMetroDataResolver(
      { load: async () => result(1) },
      null,
      { load: async () => result(3) },
      null,
      fusion,
    );

    expect(await resolver.resolveDepartures(query, context)).toEqual(result(4));
  });

  it("degrades when optional static data fails while preserving predictions", async () => {
    const resolver = new CompositeMetroDataResolver(
      { load: async () => result(1) },
      { load: async () => { throw new Error("Static timetable unavailable"); } },
      { load: async () => result(3) },
      null,
      fusion,
    );

    expect(await resolver.resolveDepartures(query, context)).toMatchObject({
      data: 4,
      warnings: [{ source: "schedule", message: "Static timetable unavailable" }],
    });
  });

  it("does not swallow cancellation as an optional-source failure", async () => {
    const controller = new AbortController();
    controller.abort();
    const resolver = new CompositeMetroDataResolver(
      { load: async () => result(1) },
      { load: async () => { throw new DOMException("Aborted", "AbortError"); } },
      null,
      null,
      fusion,
    );

    await expect(resolver.resolveDepartures(query, { ...context, signal: controller.signal }))
      .rejects.toMatchObject({ name: "AbortError" });
  });
});
