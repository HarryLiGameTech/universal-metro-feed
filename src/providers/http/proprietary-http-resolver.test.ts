import { describe, expect, it, vi } from "vitest";
import { CompositeMetroDataResolver, type PlatformQuery, type Resolved } from "../../domain/resolver";
import { mbtaV3Codec } from "../mbta/v3-codec";
import { ProprietaryHttpResolver, type HttpCodec } from "./proprietary-http-resolver";

const url = "https://transit.example/schedules";
const context = () => ({ nowSeconds: 1_000 });
const codec: HttpCodec<number[], number[]> = {
  decode: (value) => value as { data: number[]; next?: string },
  combine: (pages) => pages.flat(),
};
function resolver(request: typeof fetch, role: "schedule" | "prediction" = "schedule") {
  return new ProprietaryHttpResolver({ providerId: "test", timezone: "UTC", role, validForSeconds: 45 }, codec, request);
}
const response = (data: unknown) => new Response(JSON.stringify(data));

describe("ProprietaryHttpResolver", () => {
  it("composes HTTP schedules and predictions as independent semantic sources", async () => {
    const request = vi.fn(async (input: string | URL | Request) => response({ data: [String(input).endsWith("schedules") ? 10 : 20] }));
    const schedule = resolver(request, "schedule").asSource<PlatformQuery>(() => ({ url }));
    const prediction = resolver(request, "prediction").asSource<PlatformQuery>(() => ({ url: "https://transit.example/predictions" }));
    const query = { providerId: "test", stationId: "a", routeId: "r", directionId: "up" };
    const empty: Resolved<null> = { data: null, generatedAt: 1_000, freshness: "static", sources: [], warnings: [] };
    const composite = new CompositeMetroDataResolver<null, number[], number[], never, number[]>(
      { load: async () => empty }, schedule, prediction, null,
      { resolve: (input) => {
        expect(input.schedule?.freshness).toBe("static");
        expect(input.prediction?.freshness).toBe("live");
        expect(input.schedule?.data).toEqual([10]);
        expect(input.prediction?.data).toEqual([20]);
        return { ...input.prediction!, data: [...input.schedule!.data, ...input.prediction!.data] };
      } },
    );
    expect((await composite.resolveDepartures(query, context())).data).toEqual([10, 20]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("reuses a request within one snapshot but fetches again on the next refresh", async () => {
    const request = vi.fn(async () => response({ data: [10] }));
    const http = resolver(request, "prediction");
    const snapshot = context();
    const [first, second] = await Promise.all([http.load({ url }, snapshot), http.load({ url }, snapshot)]);
    expect(first).toEqual(second);
    await http.load({ url }, snapshot);
    expect(request).toHaveBeenCalledTimes(1);
    await http.load({ url }, context());
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("does not cache failed requests", async () => {
    const request = vi.fn().mockResolvedValueOnce(new Response("Unavailable", { status: 503 }))
      .mockResolvedValueOnce(response({ data: [20] }));
    const http = resolver(request);
    const snapshot = context();
    await expect(http.load({ url }, snapshot)).rejects.toThrow("503");
    expect((await http.load({ url }, snapshot)).data).toEqual([20]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("keeps independent consumers' cancellation signals separate", async () => {
    const first = new AbortController();
    const second = new AbortController();
    const request = vi.fn(async (_url, init?: RequestInit) => {
      if (init?.signal === first.signal) return new Promise<Response>((_resolve, reject) => {
        first.signal.addEventListener("abort", () => reject(first.signal.reason), { once: true });
      });
      return response({ data: [20] });
    });
    const http = resolver(request);
    const loading = http.load({ url }, { ...context(), signal: first.signal });
    const independent = http.load({ url }, { ...context(), signal: second.signal });
    first.abort();
    await expect(loading).rejects.toMatchObject({ name: "AbortError" });
    expect((await independent).data).toEqual([20]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("stops pagination after cancellation even if the response body completes", async () => {
    const controller = new AbortController();
    const request = vi.fn(async () => ({
      ok: true, json: async () => {
        controller.abort();
        return { data: [10], next: "?page=2" };
      },
    } as Response));
    await expect(resolver(request).load({ url, maxPages: 2 }, { ...context(), signal: controller.signal }))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("combines JSON:API pages and resolves relative pagination links", async () => {
    const request = vi.fn().mockResolvedValueOnce(response({
      data: [{ type: "prediction", id: "p", attributes: {} }], links: { next: "?page=2" },
    })).mockResolvedValueOnce(response({
      data: [], included: [{ type: "trip", id: "t", attributes: { headsign: "Terminus" } }], links: { next: null },
    }));
    const http = new ProprietaryHttpResolver({ providerId: "test", timezone: "UTC", role: "prediction" }, mbtaV3Codec, request);
    const result = await http.load({ url, maxPages: 2 }, context());
    expect(result.data.data[0]?.id).toBe("p");
    expect(result.data.included.get("trip:t")?.attributes.headsign).toBe("Terminus");
    expect(request.mock.calls.map(([input]) => input)).toEqual([url, `${url}?page=2`]);
  });

  it.each([
    ["https://other.example/next", 5, "origin"],
    [url, 5, "cycle"],
    ["?page=2", 1, "more pages"],
  ])("rejects unsafe or incomplete pagination: %s", async (next, maxPages, error) => {
    const request = vi.fn(async () => response({ data: [10], next }));
    await expect(resolver(request).load({ url, maxPages: Number(maxPages) }, context())).rejects.toThrow(String(error));
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("propagates JSON errors and refuses invalid source requests before fetching", async () => {
    const request = vi.fn(async () => new Response("Not JSON"));
    const http = resolver(request);
    await expect(http.load({ url }, context())).rejects.toThrow();
    await expect(http.load({ url, maxPages: 0 }, context())).rejects.toThrow("page limit");
    await expect(http.load({ url: "http://transit.example" }, context())).rejects.toThrow("HTTPS");
    await expect(http.asSource<PlatformQuery>(() => ({ url })).load({
      providerId: "wrong", stationId: "a", routeId: "r", directionId: "up",
    }, context())).rejects.toThrow("Unsupported provider");
    expect(request).toHaveBeenCalledTimes(1);
  });
});
