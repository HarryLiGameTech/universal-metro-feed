export type Freshness = "live" | "recent" | "stale" | "static";
export type IdentityStability = "stable" | "derived" | "snapshot-only";

export interface SourceReference {
  sourceId: string;
  providerId: string;
  observedAt?: number;
}

export interface ResolutionWarning {
  source: "topology" | "schedule" | "prediction" | "observation" | "fusion";
  message: string;
}

export interface Resolved<T> {
  data: T;
  generatedAt: number;
  validUntil?: number;
  freshness: Freshness;
  sources: SourceReference[];
  warnings: ResolutionWarning[];
}

export interface PlatformQuery {
  providerId: string;
  stationId: string;
  routeId: string;
  directionId: string;
}

export interface ResolutionContext {
  signal?: AbortSignal;
  nowSeconds: number;
}

export interface TopologySource<T, TQuery extends PlatformQuery = PlatformQuery> {
  load(query: TQuery, context: ResolutionContext): Promise<Resolved<T>>;
}

export interface ScheduleSource<T, TQuery extends PlatformQuery = PlatformQuery> {
  load(query: TQuery, context: ResolutionContext): Promise<Resolved<T>>;
}

export interface PredictionSource<T, TQuery extends PlatformQuery = PlatformQuery> {
  load(query: TQuery, context: ResolutionContext): Promise<Resolved<T>>;
}

export interface ObservationSource<T, TQuery extends PlatformQuery = PlatformQuery> {
  load(query: TQuery, context: ResolutionContext): Promise<Resolved<T>>;
}

export interface FusionInput<TTopology, TSchedule, TPrediction, TObservation, TQuery extends PlatformQuery = PlatformQuery> {
  query: TQuery;
  context: ResolutionContext;
  topology: Resolved<TTopology>;
  schedule: Resolved<TSchedule> | null;
  prediction: Resolved<TPrediction> | null;
  observation: Resolved<TObservation> | null;
  warnings: ResolutionWarning[];
}

export interface FusionPolicy<TTopology, TSchedule, TPrediction, TObservation, TOutput, TQuery extends PlatformQuery = PlatformQuery> {
  resolve(input: FusionInput<TTopology, TSchedule, TPrediction, TObservation, TQuery>): Resolved<TOutput>;
}

async function loadOptional<T, TQuery extends PlatformQuery>(
  source: ScheduleSource<T, TQuery> | PredictionSource<T, TQuery> | ObservationSource<T, TQuery> | null,
  kind: ResolutionWarning["source"],
  query: TQuery,
  context: ResolutionContext,
): Promise<{ result: Resolved<T> | null; warning?: ResolutionWarning }> {
  if (!source) return { result: null };
  try {
    return { result: await source.load(query, context) };
  } catch (error) {
    if (context.signal?.aborted) throw error;
    return {
      result: null,
      warning: {
        source: kind,
        message: error instanceof Error ? error.message : `${kind} source failed`,
      },
    };
  }
}

/** Coordinates independent data sources; provider quirks stay in sources and fusion policies. */
export class CompositeMetroDataResolver<TTopology, TSchedule, TPrediction, TObservation, TOutput, TQuery extends PlatformQuery = PlatformQuery> {
  constructor(
    private readonly topologySource: TopologySource<TTopology, TQuery>,
    private readonly scheduleSource: ScheduleSource<TSchedule, TQuery> | null,
    private readonly predictionSource: PredictionSource<TPrediction, TQuery> | null,
    private readonly observationSource: ObservationSource<TObservation, TQuery> | null,
    private readonly fusionPolicy: FusionPolicy<TTopology, TSchedule, TPrediction, TObservation, TOutput, TQuery>,
  ) {}

  async resolveDepartures(query: TQuery, context: ResolutionContext): Promise<Resolved<TOutput>> {
    const [topology, scheduleLoad, predictionLoad, observationLoad] = await Promise.all([
      this.topologySource.load(query, context),
      loadOptional(this.scheduleSource, "schedule", query, context),
      loadOptional(this.predictionSource, "prediction", query, context),
      loadOptional(this.observationSource, "observation", query, context),
    ]);

    const warnings = [scheduleLoad.warning, predictionLoad.warning, observationLoad.warning]
      .filter((warning): warning is ResolutionWarning => warning != null);

    return this.fusionPolicy.resolve({
      query,
      context,
      topology,
      schedule: scheduleLoad.result,
      prediction: predictionLoad.result,
      observation: observationLoad.result,
      warnings,
    });
  }
}
