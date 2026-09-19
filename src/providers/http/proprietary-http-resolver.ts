import type { PlatformQuery, Resolved, ResolutionContext, SourceReference } from "../../domain/resolver";

export interface HttpRequest {
  url: string;
  maxPages?: number;
}

export interface HttpDecodeContext extends ResolutionContext {
  timezone: string;
}

/** The codec owns wire format and pagination links; the transport owns fetching them. */
export interface HttpCodec<TPage, TData> {
  decode(value: unknown, context: HttpDecodeContext): { data: TPage; next?: string | null };
  combine(pages: TPage[]): TData;
}

interface HttpSourcePolicy {
  providerId: string;
  timezone: string;
  role: "schedule" | "prediction";
  validForSeconds?: number;
  reference?: (request: HttpRequest, fetchedAt: number) => SourceReference;
}

/** Shared JSON-over-HTTP source resolution, independently usable for schedules or predictions. */
export class ProprietaryHttpResolver<TPage, TData> {
  // Each context is one snapshot, so cached predictions and AbortSignals cannot
  // leak into a later refresh or another consumer's request.
  private readonly snapshots = new WeakMap<ResolutionContext, Map<string, Promise<Resolved<TData>>>>();

  constructor(
    private readonly policy: HttpSourcePolicy,
    private readonly codec: HttpCodec<TPage, TData>,
    private readonly request: typeof fetch = (...args) => fetch(...args),
  ) {}

  async load(request: HttpRequest, context: ResolutionContext): Promise<Resolved<TData>> {
    context.signal?.throwIfAborted();
    const key = JSON.stringify([request.url, request.maxPages ?? 1]);
    let requests = this.snapshots.get(context);
    if (!requests) {
      requests = new Map();
      this.snapshots.set(context, requests);
    }
    const cached = requests.get(key);
    if (cached) return cached;
    const loading = this.read(request, context).catch((error: unknown) => {
      requests.delete(key);
      throw error;
    });
    requests.set(key, loading);
    return loading;
  }

  /** Bind a domain query without making the composite resolver depend on HTTP. */
  asSource<TQuery extends PlatformQuery>(requestFor: (query: TQuery) => HttpRequest) {
    return {
      load: async (query: TQuery, context: ResolutionContext) => {
        if (query.providerId !== this.policy.providerId) throw new Error(`Unsupported provider: ${query.providerId}`);
        return this.load(requestFor(query), context);
      },
    };
  }

  private async read(request: HttpRequest, context: ResolutionContext): Promise<Resolved<TData>> {
    const initial = new URL(request.url);
    const maxPages = request.maxPages ?? 1;
    if (initial.protocol !== "https:" || !Number.isInteger(maxPages) || maxPages < 1) {
      throw new Error("An HTTPS URL and a positive page limit are required.");
    }
    const pages: TPage[] = [];
    const visited = new Set<string>();
    let next: string | null = initial.href;
    while (next) {
      context.signal?.throwIfAborted();
      const url: URL = new URL(next);
      if (url.origin !== initial.origin) throw new Error("Unexpected HTTP API page origin.");
      if (visited.has(url.href)) throw new Error("HTTP API returned a pagination cycle.");
      if (pages.length >= maxPages) throw new Error("HTTP API returned more pages than this query can safely load.");
      visited.add(url.href);
      const response = await this.request(url.href, {
        cache: "no-store", signal: context.signal, headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP API request failed (${response.status}).`);
      const page = this.codec.decode(await response.json(), { ...context, timezone: this.policy.timezone });
      context.signal?.throwIfAborted();
      pages.push(page.data);
      next = page.next ? new URL(page.next, url).href : null;
    }
    const fetchedAt = Math.floor(Date.now() / 1_000);
    return {
      data: this.codec.combine(pages),
      generatedAt: fetchedAt,
      ...(this.policy.validForSeconds != null ? { validUntil: fetchedAt + this.policy.validForSeconds } : {}),
      freshness: this.policy.role === "schedule" ? "static" : "live",
      sources: [this.policy.reference?.(request, fetchedAt) ?? {
        providerId: this.policy.providerId, sourceId: request.url,
      }],
      warnings: [],
    };
  }
}
