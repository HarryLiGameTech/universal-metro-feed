import type { HttpCodec } from "../http/proprietary-http-resolver";

interface ResourceIdentifier { id: string }

export interface ApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data?: ResourceIdentifier | ResourceIdentifier[] | null }>;
}

export interface ApiBatch {
  data: ApiResource[];
  included: Map<string, ApiResource>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function resources(value: unknown): ApiResource[] {
  if (!Array.isArray(value) || value.some((row) => !isObject(row) || typeof row.id !== "string" ||
      typeof row.type !== "string" || !isObject(row.attributes) ||
      (row.relationships !== undefined && !isObject(row.relationships)))) {
    throw new Error("Invalid MBTA API resources.");
  }
  return value as ApiResource[];
}

export function relatedId(resource: ApiResource, key: string): string | null {
  const data = resource.relationships?.[key]?.data;
  return data && !Array.isArray(data) && typeof data.id === "string" ? data.id : null;
}

/** JSON:API shape, error bodies, related resources, and next-page links. No transport or time policy. */
export const mbtaV3Codec: HttpCodec<ApiBatch, ApiBatch> = {
  decode(value) {
    if (!isObject(value)) throw new Error("Invalid MBTA API response.");
    if (!Array.isArray(value.data)) {
      const error = Array.isArray(value.errors) ? value.errors[0] : null;
      throw new Error(isObject(error) && typeof error.detail === "string" ? error.detail : "Invalid MBTA API response.");
    }
    const data = resources(value.data);
    const included = resources(value.included ?? []);
    const next = isObject(value.links) ? value.links.next : null;
    if (next != null && typeof next !== "string") throw new Error("Invalid MBTA pagination link.");
    return {
      data: { data, included: new Map(included.map((row) => [`${row.type}:${row.id}`, row])) },
      next: next ?? null,
    };
  },
  combine(pages) {
    return {
      data: pages.flatMap((page) => page.data),
      included: new Map(pages.flatMap((page) => [...page.included])),
    };
  },
};
