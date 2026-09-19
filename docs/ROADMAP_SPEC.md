# Universal Metro Feed Roadmap Specification

Status: Implementation in progress
Scope: Frontend architecture and product behavior; backend and device responsibility boundaries  
Language: English  

## 1. Purpose

Universal Metro Feed will be both:

1. a useful rider-facing product; and
2. a maintainable transit-data platform that demonstrates full-stack engineering depth.

The product must support transit providers with materially different data maturity and publication practices without turning the shared application into a collection of provider-specific conditionals.

The frontend is the first implementation target. This document specifies its architecture, data semantics, configuration, resilience, and user-facing behavior.

Clockface, Witness, and phone/glasses clients are included only to define ownership and integration boundaries. Their internal architecture, technology choices, storage, deployment, algorithms, and implementation plans are intentionally deferred. Implementing those systems is the next project stage, not part of the frontend work authorized by this roadmap.

### Implementation progress (2026-09-17)

| Workstream | Status | Implemented so far | Remaining before complete |
| --- | --- | --- | --- |
| Pre-refactor parity gate | Complete for the current MTA fixtures | Static/calendar and protobuf feed mocks, frozen outputs, legacy and composed-path parity tests | Add fixtures for each newly encountered provider quirk |
| Phase 1: Canonical foundation | In progress | Initial `StrictTime`, provenance-bearing `Resolved<T>`, provider-scoped direction strings, and precision tests; MBTA scheduled timestamps are disclosed only to the minute while V3 predictions retain explicit uncertainty | Complete topology/capability model; move remaining MTA-specific timetable policy out of shared code; finish contract tests |
| Phase 2: Source composition | In progress | Generic composed resolver; MTA topology, static schedule, and GTFS-Realtime prediction sources; MTA feed parsing and delay rules live in `src/providers/mta/feed.ts`; MTA static GTFS generation lives in `scripts/providers/mta/generate-static.mjs`; MTA and MBTA arrival/trip-path adapters use the source/fusion contract; current arrival board still uses a legacy projection | Migrate static timetable view; remove legacy projection; implement generalized identity, tracing, and all degradation states |
| Phase 3: Registry and Clockface boundary | In progress | Runtime JSON registry and provider manifests; MTA and MBTA catalogs loaded only when selected; provider selector and lazy adapter loading; generated station index removed from the production browser bundle | City search; YAML authoring/compilation; real Clockface integration after its deferred backend stage |
| Phase 4: Multi-shape prediction | Not generalized | MBTA's official browser-accessible V3 API is an explicitly scoped adapter because its GTFS-RT protobuf endpoint does not permit direct browser reads | Generalize other non-GTFS adapters only after a new provider requires them |
| Phase 5: Frequency inference | Not started | None | Contracts and mock-driven inference |
| Phase 6: Product hardening | In progress | MTA direction labels use GTFS headsigns; GTFS-adjacent-segment evidence gates shared-line selection; live rows show compact trip IDs and expand into a horizontally scrollable, stop-by-stop arrival/departure path | Shareable navigation, broader accessibility/performance review, and complete failure-state work |
| Frontend provider-neutrality cleanup | Partly complete | Shared app, hooks, direction selection, timezone formatting, and loader selection now use provider metadata/contracts; MTA-only feed logic remains isolated | Extract the remaining MTA/New York assumptions listed below before claiming a fully provider-neutral implementation |
| Second-provider validation: MBTA subway | Basic flow working | Official GTFS-derived catalog (125 stations, eight subway/light-rail routes), official V3 arrival predictions and on-demand schedules, shared-segment selection, and stop-by-stop trip paths; no citywide timetable ships in the frontend | Feed snapshot refresh policy, robust API quota/failure handling, and expanded cross-provider fixtures |
| Clockface, Witness, phone, glasses | Deferred | Responsibility boundaries only | Implement in the next stage, after frontend contracts are stable |

### Deferred frontend provider-neutrality cleanup

The following assumptions remain **recorded for later cleanup**:

- `src/lib/timetable.ts` combines reusable GTFS calendar/timetable logic with New York timezone, MTA service-day handling, and MTA static/realtime trip-ID matching. Move only the provider-specific policies into `src/providers/mta/`; keep genuinely reusable GTFS mechanics shared.
- `src/lib/trip-label.ts` embeds an MTA trip-ID abbreviation convention. Make display formatting a provider-supplied policy while retaining the full source ID.
- The current frontend runtime recognizes the two implemented adapter families. Registering another provider that uses a genuinely new transport/API shape still requires an adapter implementation; the registry is not a reflection system.

This cleanup is separate from, and must not be confused with, implementation of the deferred Clockface backend.

MTA-subway's static GTFS `stop_time` seconds were confirmed as semantically meaningful for this provider on 2026-09-17. Its adapter therefore represents scheduled timestamps as `StrictTime` `exact` at second resolution. This is an MTA-specific policy, **not** a GTFS-wide assumption: every additional provider must establish its own precision policy. Realtime stop times remain second-resolution **estimates**, not exact observations. This intentional semantic correction is covered by an updated parity assertion; the existing arrival values remain unchanged.

The current `clockface-compat-static` catalog is a generated frontend asset, **not** a Clockface backend implementation. It exercises the frontend loading boundary while preserving the previously agreed deferral of Clockface internals. The production main JavaScript no longer imports `stations.generated.ts`, but the static timetable view still uses the legacy timetable fetch/render path.

The MTA trip-path view likewise loads generated, bucketed static GTFS trip-stop artifacts only after a rider expands a train. These are temporary Clockface-compatible static assets, not a Clockface backend. They are not embedded in the application JavaScript; the later Clockface service can replace this schedule source without changing the trip-path UI contract.

The MBTA integration uses a generated, compact topology catalog from the MBTA's official GTFS ZIP. Its recorded feed version and end date are metadata; refresh the checked-in catalog with `npm run update:mbta-data` when the GTFS feed changes. The official GTFS-RT Trip Updates protobuf is published, but its CDN response does not grant browser cross-origin access. The browser therefore requests only the selected station's predictions, the selected platform's timetable, or one expanded trip's stop times through the MBTA's official CORS-enabled V3 API. This V3 bridge is provider-isolated behind the same resolver contract; it is not a Clockface implementation. It also demonstrates that the second provider was **not** configuration-only: the prior MTA-specific frontend entrypoints and `N/S` direction type had to be generalized. MBTA static schedule seconds have not been semantically verified and are presented only as published minutes; realtime seconds are marked as estimates with the API's uncertainty when supplied. Unreliable schedule/prediction comparisons intentionally remain uncolored rather than asserting on-time service.

MBTA V3 and NBRT now share the `proprietary-http` source kind and generic HTTP resolver.
Their adapter names identify protocols, while the schedule/prediction role and
schedule coverage are configured independently. MBTA retains full-day schedules
and live predictions; NBRT remains a partial schedule source with no trip expansion.
See [Proprietary HTTP sources](PROPRIETARY_HTTP.md) for the implemented boundaries.

## 2. Product and Engineering Goals

### 2.1 Product goals

- Provide a polished, responsive arrival and timetable experience.
- Support providers serving one or more cities and publishing any useful combination of network topology, exact schedules, service frequencies, arrival predictions, and observations.
- Remain useful when a capability is missing or temporarily unavailable.
- Show the finest time detail actually supported by the source while never inventing precision.
- Explain uncertainty without overwhelming ordinary riders.
- Allow advanced users to inspect why a displayed prediction exists and where it came from.

### 2.2 Platform goals

- Add a standards-compliant provider profile primarily through configuration and reusable source adapters.
- Isolate unavoidable provider-specific behavior at explicit boundaries.
- Keep the normalized domain independent from React, GTFS, MTA, and any individual provider.
- Make every semantic transformation testable and traceable.
- Permit full provider-specific adapter code as an escape hatch without permitting provider quirks to invade the shared core.
- Load only the selected provider's required data. Global train schedules must never be bundled into or eagerly downloaded by the frontend.

### 2.3 Non-goals for the current stage

- Implementing Clockface.
- Implementing Witness.
- Implementing phone or glasses clients.
- Selecting backend databases, service frameworks, hosting platforms, queues, or deployment topology.
- Implementing computer vision or trust scoring for real observations.
- Claiming that every provider can be integrated without provider-specific code.
- Building a reflection or monkey-patching system that can mutate arbitrary resolver internals.

### 2.4 Provider identity and GTFS terminology

The application's top-level selectable identity is a **provider profile**, identified by `providerId`. A provider profile is the integration and product boundary presented to the resolver and UI. It may represent an operator, a rider-facing rail system, a mode-specific division, or another coherent service grouping.

Examples include:

- `mta-subway`;
- `mta-lirr`;
- `jr-east`.

A provider profile may:

- serve multiple cities or regions;
- contain routes that cross municipal boundaries;
- consume multiple static or realtime feeds;
- contain one or more GTFS agencies;
- publish multiple modes where they form one coherent product boundary.

City is therefore searchable geographic metadata, not a primary key, ownership boundary, routing key, or uniqueness scope. The relationship between providers and cities is many-to-many.

`providerId` is an application-owned identifier and must not be conflated with GTFS terminology. GTFS defines `agency_id` for an agency responsible for represented service and `feed_publisher_name` for the organization publishing a dataset. A GTFS feed may contain multiple agencies, and its publisher may differ from those agencies. GTFS does not define a `provider_id` field. Source `agency_id` values and feed-publisher metadata must be preserved as provenance and mapped into the application domain; neither automatically becomes `providerId`. See the [official GTFS Schedule reference](https://gtfs.org/documentation/schedule/reference/).

`providerId` must be globally unique and stable within Universal Metro Feed. Normalized entities are scoped to a provider profile. Raw source identifiers remain additionally scoped to their source feed because GTFS identifiers are dataset-local and two feeds consumed by one provider profile may reuse the same values.

Conceptually:

```ts
interface ProviderEntityKey {
  providerId: string;
  entityId: string;
}

interface SourceEntityReference {
  providerId: string;
  sourceId: string;
  sourceEntityId: string;
}
```

## 3. Core Data Model

The system must not model transit data as only `static` and `realtime`. It must treat the following dimensions independently.

### 3.1 Topology

Topology describes the network itself:

- agencies and networks;
- routes and service patterns;
- stations, stop places, and platforms;
- directions and destinations;
- provider identifiers and normalized identifiers;
- optional display metadata such as names, colors, and localized labels.

Topology may be complete, partial, or unavailable. A provider may publish topology separately from predictions or schedules.

### 3.2 Schedule

Schedule describes planned service. Supported schedule forms include:

- exact trip and stop times;
- frequency/headway service;
- first-and-last-train information only;
- no published schedule.

Frequency data must not be silently expanded into exact scheduled trips. Any concrete times inferred from a frequency require an anchor, explicit inference semantics, and uncertainty metadata.

### 3.3 Prediction

Prediction describes a future arrival or departure claim. Its basis must be explicit:

- official live prediction;
- operator estimate;
- schedule-derived countdown;
- frequency-derived inference;
- fused estimate;
- unknown.

An official source is authoritative about what it published, but the label `official` does not imply second-level precision or direct vehicle observation.

### 3.4 Observation

Observation describes an event that is reported to have already occurred, such as:

- vehicle arrived;
- doors opened;
- doors closed;
- vehicle departed.

An observation is evidence, not an automatic correction to the schedule or official prediction. Observation support is optional and will later be supplied by Witness.

## 4. Capability Model

Capabilities must be derived from configured sources and runtime health rather than represented by a single `hasRealtime` or `hasStatic` boolean.

The normalized capability model must be able to express at least:

```ts
interface ResolverCapabilities {
  topology: "full" | "partial" | "unavailable";
  schedule:
    | "exact"
    | "frequency"
    | "first-last-only"
    | "unavailable";
  predictions:
    | "official-live"
    | "operator-estimate"
    | "schedule-derived"
    | "unknown"
    | "unavailable";
  observations: "witness" | "unavailable";
}
```

Runtime availability is separate from declared capability. A supported source may currently be healthy, degraded, stale, unavailable, or disabled.

The UI must derive available features from this model:

- no schedule: hide the timetable and schedule-deviation UI;
- no predictions: show schedule data when available;
- predictions without a schedule: show upcoming predictions but do not calculate delay;
- partial topology: show only destinations and platform metadata that are actually known;
- stale predictions: retain useful data when appropriate, but label it stale and stop presenting a live countdown as current;
- no observations: official and inferred behavior continues normally.

## 5. Frontend Source Composition

The frontend must use composition from the beginning. It must not start with a single provider-specific resolver that later needs to be split apart.

The minimum conceptual source interfaces are:

```ts
interface TopologySource {
  loadTopology(query: ProviderTopologyQuery, context: ResolutionContext):
    Promise<Resolved<TransitTopology>>;
}

interface ScheduleSource {
  loadTimetable(query: TimetableQuery, context: ResolutionContext):
    Promise<Resolved<PlatformTimetable>>;
}

interface PredictionSource {
  loadDepartures(query: DepartureQuery, context: ResolutionContext):
    Promise<Resolved<PlatformDepartures>>;
}

interface ObservationSource {
  loadObservations(query: ObservationQuery, context: ResolutionContext):
    Promise<Resolved<PlatformObservations>>;
}
```

A composed resolver coordinates whichever sources are present:

```ts
class CompositeMetroDataResolver implements MetroDataResolver {
  constructor(
    topology: TopologySource,
    schedule: ScheduleSource | null,
    predictions: PredictionSource | null,
    observations: ObservationSource | null,
    inference: InferencePolicy,
    fusion: FusionPolicy,
  );
}
```

Expected source combinations include:

| Provider profile type | Topology | Schedule | Predictions | Observations |
| --- | --- | --- | --- | --- |
| Full GTFS + GTFS-Realtime | Clockface | Clockface | GTFS-Realtime | Optional |
| Realtime arrivals without a full timetable | Clockface | None | Provider API | Optional |
| Pseudo-realtime ETA without a full timetable | Clockface | None | Provider ETA API | Optional |
| Static-only network | Clockface | Clockface | None | Optional |
| Frequency service with an observed anchor | Clockface | Clockface frequency | Optional | Witness |

GTFS is a source format, not the application domain. The implementation should expose focused components such as a GTFS static source and GTFS-Realtime prediction source rather than making the rest of the application depend on a monolithic `GtfsResolver`.

## 6. Resolved Data Contract

The UI must consume normalized, provenance-bearing results rather than provider payloads.

```ts
interface Resolved<T> {
  data: T;
  generatedAt: number;
  validUntil?: number;
  freshness: "live" | "recent" | "stale" | "static";
  sources: SourceReference[];
  warnings: ResolutionWarning[];
  traceId?: string;
}
```

Results should be query-specific instead of one universal object containing many optional fields. Examples include:

- `Resolved<TransitTopology>`;
- `Resolved<PlatformDepartures>`;
- `Resolved<PlatformTimetable>`;
- `Resolved<ServiceAlerts>`;
- `Resolved<PlatformObservations>`.

Departure identity must not require a public trip number or stable provider trip ID. A resolved departure must describe its identity quality explicitly:

```ts
type IdentityStability = "stable" | "derived" | "snapshot-only";
```

Snapshot-only predictions may be displayed, but the frontend must not pretend that it can reliably track the same train across refreshes.

## 7. StrictTime

All schedule, prediction, observation, and validity times crossing normalized boundaries must use a `StrictTime`-like representation. A bare epoch number is insufficient as the canonical temporal model.

### 7.1 Governing rule

The frontend must expose the finest time detail actually supported by the available evidence, but it must never invent precision.

Serialized precision is not evidence of semantic precision. A source string ending in `:00` may represent an exact zero second, a truncated minute-level publication, or a time whose seconds were never defined.

### 7.2 Required semantic distinctions

The model must distinguish at least:

1. **Exact**: the supplied second or sub-second value is meaningful.
2. **Truncated**: a finer upstream value exists, but the public source intentionally discloses only a coarser value. A formatted `:00` may be padding.
3. **Underspecified**: no finer time was defined by the source.
4. **Estimated**: a point estimate exists with declared semantic resolution and, where known, tolerance.
5. **Bounded**: only an earliest time, latest time, or finite window is supported.

One possible conceptual representation is:

```ts
type StrictTime =
  | {
      semantics: "exact";
      value: ZonedInstant;
      resolution: "millisecond" | "second" | "minute";
    }
  | {
      semantics: "truncated";
      bucket: TimeBucket;
      resolution: "minute";
      finerValueExistsUpstream: true;
    }
  | {
      semantics: "underspecified";
      bucket: TimeBucket;
      resolution: "minute";
      finerValueExistsUpstream: false;
    }
  | {
      semantics: "estimated";
      value: ZonedInstant;
      resolution: "second" | "minute" | "headway";
      tolerance?: Duration;
    }
  | {
      semantics: "bounded";
      earliest?: ZonedInstant;
      latest?: ZonedInstant;
    };
```

The final implementation shape may differ, but these semantics must remain distinguishable.

### 7.3 Display behavior

Examples of valid presentation include:

| Semantic value | User-facing presentation |
| --- | --- |
| Exact to second | `14:00:37` |
| Official minute-level publication | `14:00` |
| Minute-level estimate | `About 14:00` |
| Exact lower bound | small `Earliest`, primary `14:00:37` |
| Finite uncertainty window | `14:00–14:02` |
| Frequency only | `Every 5–7 min` |

The presentation layer must not append `:00` merely because an internal timestamp has a zero-second field. Conversely, it must not discard valid second-level precision without an explicit disclosure rule.

Provider adapters return temporal semantics, not localized display strings. Localization and visual presentation remain shared frontend responsibilities.

### 7.4 Deviation calculations

Schedule deviation must reflect the precision of both values:

- two exact values may produce an exact deviation in seconds;
- an exact observation compared with a truncated schedule may produce a deviation range;
- an observation in the same minute as an underspecified minute-level schedule may produce a `same-bucket` result;
- no schedule means deviation is unavailable.

The application must not force every deviation into `delaySeconds: number`.

## 8. Frequency and Observation Inference

Frequency data may be combined with an observation to estimate subsequent arrivals. These estimates must remain distinguishable from published schedule times and official predictions.

Conceptually:

```text
estimated center = observed anchor + n × expected headway
uncertainty = observation error
            + accumulated headway variation
            + age penalty
            + operating-condition penalty
```

The first implementation should prefer explainable interval arithmetic over an opaque predictive model.

Confidence must decline or inference must stop when any of the following applies:

- the prediction horizon grows too large;
- the published headway period changes;
- the line has branches, short turns, or multiple service patterns that cannot be identified;
- the observation cannot be associated with an applicable route pattern;
- official disruption information invalidates ordinary frequency assumptions;
- recent observations materially disagree with the published headway;
- the anchor observation becomes stale.

Inferred events must not be written back as official schedule data. They are temporary resolved predictions with explicit provenance.

Confidence and time precision are separate concepts. A minute-level official publication may have high source confidence, while a second-level model output may have low predictive confidence.

The public UI should prefer qualitative disclosure and ranges over unsupported numerical confidence percentages. Examples include:

- `About 14:06`;
- `Earliest 14:06:30`;
- `14:06–14:08`;
- `Based on a train observed at 14:01 and a 5–6 minute service interval`.

## 9. Runtime Provider Registry and Provider Manifests

The frontend requires a runtime-loaded, versioned provider registry. It must not hard-code the set of supported providers in React components or generated TypeScript station files.

### 9.1 Two-level configuration

Use a small global index and lazy-loaded per-provider manifests. The index contains enough city metadata for fast discovery without loading every provider manifest. City metadata never determines provider identity.

Example registry:

```yaml
schemaVersion: 1

clockface:
  baseUrl: https://clockface.example.com

providers:
  - id: mta-subway
    names:
      en: New York City Subway
      zh-CN: 纽约地铁
    cities:
      - id: us-ny-new-york
        names:
          en: New York
          zh-CN: 纽约
    manifest: /providers/mta-subway.yaml

  - id: mta-lirr
    names:
      en: Long Island Rail Road
    cities:
      - id: us-ny-new-york
        names:
          en: New York
          zh-CN: 纽约
    manifest: /providers/mta-lirr.yaml

  - id: jr-east
    names:
      en: JR East
      ja: JR東日本
    cities:
      - id: jp-tokyo
        names:
          en: Tokyo
          ja: 東京
    manifest: /providers/jr-east.yaml
```

The `cities` list is a search index and localized display aid. It may contain multiple entries for a cross-city provider or route. It does not imply that every route in the provider serves every listed city. Route-level city metadata may be added when finer-grained discovery is required.

Example provider manifest:

```yaml
schemaVersion: 1
id: hk-mtr
timezone: Asia/Hong_Kong

topology:
  kind: clockface
  providerId: hk-mtr

schedule:
  kind: none

predictions:
  kind: provider-json
  adapter: mtr-next-train-v1
  access:
    mode: direct
    url: https://example.invalid/provider-endpoint
  refreshSeconds: 10
  staleAfterSeconds: 30
```

The example URL is intentionally non-operational. Production URLs must be validated before a manifest is published.

### 9.2 Configuration rules

- YAML is an authoring format, not an executable language.
- Manifests must be validated against a versioned schema before use.
- Production publication may compile YAML into validated JSON so the browser does not require a YAML parser.
- Manifests must not contain secrets.
- Adapter names must resolve through a code-controlled allowlist.
- Capabilities should be derived from configured sources where possible instead of duplicated manually.
- Unknown manifest versions must fail safely with an actionable error.
- A malformed provider manifest must not prevent other configured providers from loading.

## 10. Clockface Integration in the Frontend

The frontend must use Clockface as the normalized source for static topology and provider reference data and, where available, schedule data.

The browser must never receive every provider's full timetable as part of the application bundle or initial page load.

Required loading behavior:

```text
Load small provider registry
  -> user searches by city or selects a provider
  -> load that provider's manifest
  -> load or search that provider's topology
  -> user selects a platform and date
  -> fetch only the required schedule artifact or query result
```

The existing build-time pattern of generating and importing a global `stations.generated.ts` file is transitional and must be removed from the target architecture.

Clockface responses may point to versioned artifacts or return query results. The frontend contract must support:

- provider metadata and source version;
- topology discovery or station search;
- platform metadata;
- schedule capability and coverage dates;
- on-demand platform timetable retrieval;
- provenance and validity metadata;
- cache validators or immutable version identifiers.

If a selected provider has no schedule, the frontend must not request a timetable from Clockface.

## 11. Realtime Access Modes

Official or provider prediction data should be fetched directly by the browser when that is safe, permitted, and operationally sound. Direct access is a strategy, not a universal assumption.

Supported access modes are:

- `direct`: the browser requests the provider endpoint;
- `relay`: an approved service transports the provider payload when direct access is impossible;
- `managed`: a service supplies a cached or normalized snapshot when central polling is required.

Reasons not to use direct access may include:

- absent CORS support;
- credentials that must not be exposed;
- provider terms that prohibit direct client use;
- unusually large feed payloads;
- upstream rate limits;
- required request signing or header adaptation;
- unstable or non-public endpoints.

Transport selection must be configured. React components and normalized domain logic must not contain provider-specific transport branches.

Failure behavior must be graceful:

- prediction failure with a schedule: show the schedule and explain that live predictions are unavailable;
- prediction failure without a schedule: show a clear unavailable state and last known data only while its stale policy permits;
- Clockface failure after topology has been cached: retain locally available topology where safe;
- one provider failure must not break provider discovery or city-based search.

## 12. Provider Overrides and Extension Boundaries

The project must not use reflection, arbitrary monkey-patching, or runtime mutation of resolver internals.

The correct rule is:

> Do not make undocumented assumptions about provider inputs. Maintain a strict canonical output contract and permit provider-specific code at explicit semantic boundaries.

The processing pipeline should expose replaceable stages such as:

```text
Fetch
  -> Decode
  -> Extract
  -> Normalize identifiers
  -> Interpret time semantics
  -> Establish entity identity
  -> Infer
  -> Fuse
  -> Resolve
  -> Present
```

Provider variation should be handled in three levels.

### 12.1 Declarative parameters

Use manifest values for ordinary differences such as endpoint URLs, refresh intervals, field mappings, timezone, declared time units, and staleness thresholds.

### 12.2 Registered strategies

Use a code-controlled strategy registry for known semantic patterns, such as a provider that publishes a relative whole-minute ETA and a misleading second-formatted absolute field.

Configuration may select a registered strategy but must not execute arbitrary code.

### 12.3 Full adapter escape hatch

An unusual provider may implement an entire source interface in ordinary code and return canonical resolved data. This is the final escape hatch for unavoidable provider-specific complexity.

Provider-specific code may be messy internally, but it must not weaken canonical invariants or require provider checks in shared UI components.

## 13. Raw Evidence and Resolution Tracing

Normalization must not destroy the original evidence required to debug or reinterpret provider behavior.

Where practical, normalized results or debug records should retain references to:

- source payload version or hash;
- provider timestamps;
- raw temporal fields;
- selected interpretation strategy;
- applied inference and fusion rules;
- warnings and rejected fields.

Each resolution should be traceable through the semantic stages. The complete trace need not be sent to ordinary users, but it must be available in development and diagnostic tooling.

Example trace events include:

```text
Decoded provider time field as 14:02:37
Detected minute-level semantics under provider policy mtr-relative-minute-v1
Ignored inherited seconds as non-semantic padding
Constructed an earliest-time bound
Rendered with an "Earliest" qualifier
```

## 14. Frontend User Experience Requirements

### 14.1 Provider selection and city discovery

- Present provider profiles from the runtime registry.
- Allow users to search or filter providers by entries in their `cities` metadata.
- Do not assume that a provider belongs to exactly one city or that a route remains within one city.
- Load detailed configuration only after selection.
- Preserve the selected provider, platform, and view in a shareable URL where identifiers permit it.
- Localize provider, city, route, destination, and direction names when source data supports localization.

### 14.2 Capability-aware layout

- Show the live arrivals section only when a prediction source exists.
- Show the timetable section only when usable schedule data exists.
- Allow a static-only provider profile to remain a useful product.
- Allow a prediction-only provider profile to remain a useful product.
- Never show empty controls for capabilities a provider does not support.
- Use provider headsigns or equivalent direction metadata for platform labels; compass letters alone are not a rider-facing direction name.
- Offer an "any line" platform view only when route grouping has source-backed evidence, such as a shared directed GTFS stop-to-stop segment. Do not infer it from a shared station name alone.
- Keep each arrival's route visible when multiple lines are combined, and retain the source trip identifier (when supplied) even if the UI abbreviates it.
- Allow a rider to expand a specific trackable trip into a horizontally scrollable stop sequence with separate arrival and departure fields. Load full static GTFS trip paths on demand rather than putting them in the main browser bundle.
- Center the expanded horizontal sequence on the selected station when it first loads, while leaving subsequent manual scrolling undisturbed.
- For each current or downstream stop/event, prefer a fresh matching live prediction over a static schedule. For passed stops, show the static schedule rather than reconstructing historical actual times without an observation record. Never fill a missing arrival from departure or vice versa, and label partial feed-only topology as partial.
- Keep source-backed stop topology visible when both arrival and departure times are missing. If trip/date matching is ambiguous, retain an unambiguous stop sequence but suppress uncertain static clock times.
- Preserve an expanded trip and its horizontal scroll position across background refreshes, including transient feed failures; only a platform change or explicit rider action closes it.
- Color a stop's live arrival and departure predictions using the existing delay bands computed from that stop's live versus static **departure** time. When no comparable departure pair exists, use neutral styling rather than implying on-time service.

### 14.3 Source and freshness disclosure

The UI must distinguish:

- official predictions;
- operator estimates;
- schedule-derived values;
- frequency-and-observation inference;
- direct observations;
- fused estimates;
- stale data.

Primary information must remain easy to scan. Detailed provenance should be available through secondary text, a tooltip, disclosure control, or details panel.

### 14.4 Temporal honesty

- Display seconds when they are semantically supported.
- Do not display padded or fabricated seconds.
- Do not animate a minute-level estimate into a fake second-level countdown.
- Stop or relabel countdown behavior after prediction expiry.
- Use qualifiers such as `About`, `Earliest`, or a time range when required by the temporal semantics.
- Do not display delay status when no comparable schedule exists.

### 14.5 Accessibility

- All precision and confidence information conveyed by color must also be available as text.
- Screen-reader labels must include temporal qualifiers.
- Refreshes must not cause disruptive repeated live-region announcements.
- Loading, degraded, stale, unsupported, and unavailable states must be distinguishable.

## 15. Frontend Testing Requirements

### 15.1 Canonical contract tests

Every source adapter must be tested against a shared contract covering:

- capabilities;
- timezone handling;
- identity stability;
- freshness and expiry;
- provenance;
- failure isolation;
- absence of schedule data;
- absence of trip IDs;
- partial topology.

### 15.2 StrictTime tests

Required fixtures include:

- exact `14:00:00`;
- exact non-zero seconds;
- serialized `:00` that is semantically truncated;
- minute-level time with no finer value defined;
- relative whole-minute ETA;
- an exact earliest bound;
- finite uncertainty window;
- post-midnight service time;
- daylight-saving transition where applicable;
- provider local time without an explicit offset;
- stale prediction behavior.

### 15.3 Inference tests

Required cases include:

- frequency plus a valid observation anchor;
- confidence decay across subsequent inferred trains;
- headway-period boundary;
- branched or ambiguous service pattern;
- stale observation;
- disruption disabling inference;
- contradictory observations;
- inference that must remain separate from published schedule data.

### 15.4 Provider regression fixtures

Provider adapters must use recorded, sanitized fixtures that preserve problematic behavior, including misleading field precision and undocumented sentinel values. Fixtures must not contain credentials or unnecessary personal data.

### 15.5 Pre-refactor behavior parity

The checked-in corpus at `tests/fixtures/mta-parity/` freezes current MTA behavior before the architecture changes. It includes mocked static timetable and calendar responses, topology identity, protobuf-encoded realtime feed responses, and complete expected results. The composed resolver must consume equivalent inputs and pass a legacy/UI projection comparison before replacing the existing path. Any intentional correction to current behavior requires an explicit, reviewed golden-result change and a test for the new semantics; migration must not silently update expectations.

## 16. Frontend Delivery Roadmap

### Phase 1: Canonical foundation

- Introduce topology, schedule, prediction, and observation as separate domain concepts.
- Define `Resolved<T>`, capability status, provenance, warnings, and identity stability.
- Define and test the initial `StrictTime` semantics.
- Remove New York-specific direction and timezone assumptions from the canonical domain.
- Preserve current NYC behavior through adapters while refactoring.

Exit criteria:

- Shared UI code no longer imports MTA-specific network logic.
- Current tests remain green and new canonical contract tests pass.
- The pre-refactor MTA parity corpus still passes through a legacy/UI projection of the new resolver.
- No normalized time crosses the resolver boundary as an unexplained bare timestamp.

### Phase 2: Source composition

- Introduce focused topology, schedule, prediction, and observation source interfaces.
- Build the composed resolver.
- Split GTFS static handling from GTFS-Realtime prediction handling.
- Introduce explicit prediction expiry and degraded-state behavior.
- Add resolution tracing in development mode.

Exit criteria:

- A resolver may run with schedule absent or predictions absent.
- The UI renders both static-only and prediction-only fixtures correctly.
- Provider-specific logic is isolated behind registered strategies or adapters.

### Phase 3: Runtime provider registry and Clockface boundary integration

- Add the versioned provider registry schema.
- Add lazy-loaded per-provider manifests.
- Add searchable many-to-many `cities` metadata without using city as an identity key.
- Add schema validation and safe failure behavior.
- Replace generated global station imports with a Clockface-backed topology source.
- Fetch timetable information only for the selected provider/platform/date.
- Ensure production bundles contain no global timetable dataset.

Exit criteria:

- Adding a provider to the selector does not require editing React components.
- One provider can be found through multiple city entries without duplicating the provider profile.
- Selecting one provider does not download another provider's topology or schedule.
- A provider with `schedule.kind: none` never issues a timetable request.

### Phase 4: Multi-shape prediction support

- Support GTFS-Realtime predictions as one prediction source.
- Add at least one non-GTFS provider prediction adapter.
- Support missing trip IDs and snapshot-only identity.
- Support minute-level operator estimates without fake seconds.
- Implement source-aware freshness and provenance display.

Exit criteria:

- At least two materially different source shapes use the same normalized UI.
- The second source does not require provider-specific checks in React components.
- Delay UI appears only when a meaningful schedule comparison exists.

### Phase 5: Explainable frequency inference preparation

- Define the frontend inference and confidence contracts.
- Implement deterministic frequency inference against mock observations.
- Render `About`, `Earliest`, and time-window presentations.
- Add an optional diagnostic evidence view.

Exit criteria:

- Inferred predictions remain clearly distinguishable from official predictions and schedules.
- Prediction windows widen or confidence declines with horizon.
- Invalid or stale anchors stop producing apparently current predictions.

### Phase 6: Product hardening

- Improve network, station, route, and platform navigation.
- Add shareable URLs and persisted preferences.
- Complete accessibility testing.
- Add error boundaries and per-source health presentation.
- Measure bundle size, data transferred per selected provider, refresh cost, and rendering performance.

Exit criteria:

- The product remains useful under partial source failure.
- Initial load contains no selected-provider timetable payload.
- Accessibility and performance budgets are documented and enforced.

## 17. Deferred Responsibility Boundaries

The following sections define ownership only. They intentionally do not specify internal architecture or implementation. Work on these components begins in the next implementation stage after the frontend contracts are stable.

### 17.1 Clockface backend

Clockface owns:

- normalized static topology and provider reference data;
- provider and source version metadata;
- topology publication or discovery;
- schedule publication where a schedule exists;
- schedule coverage and validity metadata;
- on-demand access to the selected provider's required timetable data;
- provenance required for the frontend to explain static data;
- preventing consumers from needing to download unrelated global schedules.

Clockface does not own:

- direct browser polling of provider predictions unless a provider is configured for relay or managed access;
- interpretation of observations as unquestioned truth;
- frontend presentation choices;
- device capture behavior.

Clockface implementation is explicitly deferred to the next stage.

### 17.2 Witness backend

Witness owns:

- accepting structured observation tickets from authorized clients;
- preserving observation provenance and event timestamps;
- exposing observation evidence or derived calibration data through an explicit contract;
- preventing a single observation from silently rewriting official schedule data;
- representing observation status so the resolver can distinguish raw, corroborated, rejected, and expired evidence.

Witness does not own:

- the official schedule;
- the official provider prediction feed;
- final rider-facing presentation;
- unilateral replacement of normalized predictions without resolver policy.

Witness implementation is explicitly deferred to the next stage.

### 17.3 Phone client

The phone client may later own:

- obtaining informed user permission for observation capture;
- capturing or receiving candidate arrival/departure events;
- attaching device-side timing quality and available context;
- submitting structured observation tickets to Witness;
- clearly identifying mock, automated, and human-confirmed observations.

The phone client must not:

- declare an observation to be global truth;
- rewrite schedules;
- manufacture trip identity when none is known;
- claim finer temporal precision than the device evidence supports.

Phone-client implementation is explicitly deferred to the next stage.

### 17.4 Glasses client

The glasses client may later own:

- privacy-aware capture of candidate platform events;
- on-device extraction of the minimum structured observation needed by Witness, where feasible;
- reporting capture time, timing quality, confidence, and source mode;
- distinguishing a mock demonstration from a real camera-derived observation.

The glasses client must not:

- upload or retain unnecessary visual data by default;
- treat a model detection as verified truth;
- directly mutate public predictions or schedules;
- conceal uncertainty or timing limitations from Witness.

Glasses-client implementation is explicitly deferred to the next stage.

## 18. Global Invariants

These invariants apply across all future components:

1. Raw evidence is never silently upgraded to greater semantic precision.
2. Serialized precision is not assumed to equal semantic precision.
3. Missing schedule data never produces a fabricated delay value.
4. Missing stable trip identity never produces a fabricated public trip identifier.
5. Inference never becomes official schedule data merely because it is useful.
6. Observation never becomes truth merely because it came from a camera.
7. Provider-specific complexity remains behind explicit source or adapter boundaries.
8. Runtime configuration never executes arbitrary code.
9. Every user-facing resolved value has provenance, even when that provenance is not shown by default.
10. The frontend loads only the selected provider data required for the current task.
11. Backend and device implementation remains deferred until the frontend contracts in this specification are reviewed and accepted.
