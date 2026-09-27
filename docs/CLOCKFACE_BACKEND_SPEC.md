# ClockFace Backend Behavior Specification

Status: Behavioral agreement in progress; no backend implementation authorized yet

Scope: Backend behavior accompanying the field-by-field planning in [ClockFace Field Specification](CLOCKFACE_FIELDS_SPEC.md). Confirmed policy and unresolved implementation details are distinguished below. Database fields continue to require their own agreement.

**Confirmed service boundary:** ClockFace stores and serves static topology, reference data, and planned schedules. Its expected workload is read-heavy, with comparatively infrequent ingestion, parsing, and publication writes. Live arrival predictions, vehicle positions, and realtime update storage are outside ClockFace's scope and must not drive its database or caching design. Planned data obtained through HTTP, including partial schedules, retains its existing static-data semantics and coverage limitations; a refresh does not make it a realtime prediction.

**Confirmed product focus — 2026-09-26:** select topology/reference data to support static timetables and their interpretation. Pathways/transfers serve only transfer-time information. Full GTFS coverage, cartographic geometry, indoor/street navigation, accessibility routing and fare calculation are not implicit backend requirements. Field section 15 records the confirmed reduced data contract and remaining behavioral deferrals.

Any intentionally postponed detail must be labeled **Deferred**, with a prerequisite or review point for resuming it. The register in section 1.4 tracks the current scheduling items; its cross-references use the field specification's F identifiers.

## 1. Static-timetable refresh scheduling

### 1.1 Confirmed scheduling direction

When an existing static timetable is available, use the end of its local last-train service, interpreted in the associated provider's configured `timezone`, to advance the refresh-day countdown. Account for service times written with hours of 24 or greater. The project owner's notation for this transition is `day--`.

For clarity, call this a service-day completion boundary. A civil calendar date still changes at local midnight; the service associated with the preceding date may continue after midnight. The scheduler must not treat midnight alone as proof that the preceding service day has ended.

The configured interval is `refreshIntervalDays`, with positive whole-day values or `NULL` as defined in the field specification. It controls scheduled backend checks, separately from frontend refreshing or on-demand station requests.

### 1.2 Extended-hour example and time interpretation

Suppose a provider has `timezone = Asia/Shanghai` and its timetable for service date `2026-09-20` has its last scheduled service event at `24:40:00`. That event occurs on civil date `2026-09-21` at `00:40:00` and remains associated with the September 20 service date. The end-of-service trigger occurs after that event, rather than at `00:00`.

**Confirmed revision — F04:** ClockFace interprets all associated timetables using `providers.timezone`, which also remains the provider's default display timezone. This replaces the previously planned source/agency-timezone precedence. Source timezone declarations do not override this configured value. There is no `agencies.timezone` field; see [field specification section 2.3](CLOCKFACE_FIELDS_SPEC.md#23-timezone--confirmed) and [the withdrawn agency proposal](CLOCKFACE_FIELDS_SPEC.md#124-provider-owned-schedule-timezone--confirmed-agency-field-withdrawn).

The current one-provider-per-source assumption provides the interpretation context. A shared agency's membership in several provider profiles does not determine a separate timezone. **Deferred — F04/F08/F16:** agree execution/provider binding and configuration capture, changes during execution, reprocessing after a provider-timezone change, and preservation of retained results during the resolver/execution and artifact/serving reviews before implementation. These details must follow the confirmed provider-timezone rule; they do not reopen timezone precedence or authorize new database/JSON fields.

### 1.3 Countdown interpretation — confirmed

Interpret `day--` as decrementing the remaining number of eligible day boundaries until the next update check. Keep `refreshIntervalDays` unchanged as the configured interval.

For example, with an interval of `3`, a conceptual remaining-days count advances from `3` to `2`, then `1`, then `0` across eligible service-day completions. Reaching zero triggers an update check. This illustration does not select an initialization, reset, retry, or persistence policy.

**Deferred — B08:** decide how to represent the countdown after the scheduling, reset, retry, and recovery policies are agreed. It may be derived from recorded scheduling events rather than stored as a mutable counter. No additional database fields or tables for that state have been agreed.

### 1.4 Deferred scheduling decision register

All items in this register are explicitly **Deferred**. The service-day-end direction and countdown meaning in sections 1.1–1.3 remain confirmed; the following details are not yet selected.

| ID | Deferred detail | Resume discussion after / at |
| --- | --- | --- |
| B01 | Which last-train event ends the service day: final departure, final arrival, or another event; any following buffer. | Trip/stop event semantics and the service-date/calendar model are agreed. |
| B02 | Boundary aggregation across routes/agencies within the current source scope, all interpreted in its provider timezone. Aggregation across providers sharing a source is outside the current stage. | Source scope (F06) and provider-timezone authority (F04) are agreed; resolve boundary event B01 and execution/calendar details before implementation. Revisit shared-provider aggregation only if source sharing returns to scope. |
| B03 | Continuous or overlapping service and dates with no scheduled service. | B01/B02 and calendar coverage rules are agreed. |
| B04 | Initial acquisition and refresh without a usable timetable, including expired or partial schedules. | Source capabilities and schedule coverage/validity are defined under F08/F13; resolve before acquisition is implemented. |
| B05 | Countdown initialization/reset and treatment of checks finding unchanged data. | Version/check outcomes are defined under F08 and eligible boundaries under B01–B04 are settled. |
| B06 | Failure retries and their interaction with the day countdown. | Failure outcomes and countdown initialization/reset (B05) are agreed. |
| B07 | Restart recovery, missed boundaries, and preventing duplicate processing of a boundary. | B01–B06 are agreed; resolve before scheduler execution is implemented. |
| B08 | Derived versus stored countdown and required execution-state persistence. | B01–B07 are agreed; return to the field specification to confirm any required fields or tables. |

These are backend behavior decisions. Any database state needed to implement them must return to the field-by-field agreement process before schema or migration work begins.

## 2. Source capability derivation

### 2.1 Responsibility — confirmed direction

Backend adapter/resolver code determines what data can be parsed from a source, especially for GTFS-based providers. The `adapter` field continues to select the registered handler. No manually configured `roles` column is added to declare parsable data categories.

Keep three concerns distinct when specifying the resolver contract:

- The parsing features supported by the registered adapter.
- The usable, semantically validated data actually present in the source being processed.
- The data scope associated with a provider, such as its selected routes or agencies.

The existing roadmap's separation between capabilities and runtime health remains applicable. A fetch or parse failure must not be interpreted as proof that a source has no schedule capability.

### 2.2 Resolver contract details — Deferred (F13)

After the source-version and adapter contracts are defined, agree the capability result structure and detailed validation rules. Evaluate capabilities from actual available values and relationships in the nullable GTFS-inspired artifact (field specification section 13), rather than collection names alone. Missing/null GTFS-required fields must not by themselves invalidate the ClockFace payload. A partial record may support one capability while lacking another; define those consumer requirements without fabricating data or requiring a complete GTFS feed.

Preserve the existing roadmap's temporal invariants: frequency service is not silently expanded into exact trips, and GTFS serialization precision does not establish the semantic precision of every provider's times.

**Confirmed — F06:** full parsing and default inclusion are defined in section 3. Detailed identity and acquisition-scope decisions remain deferred until the referenced entity/adapter contracts are defined. **Deferred — F14:** intentional exclusions of available data are optional usage policy, to revisit only if a concrete requirement emerges after the capability contract is defined; default inclusion is settled.

Any cache or persistence of derived capability results requires field-by-field agreement before adding database storage. Neither the result schema nor new capability fields are selected here.

## 3. Full parsing and provider route overlap

Status: Full parsing remains confirmed (F06). The latest current-stage assumption is one provider per source, with cross-source overlap outside scope; it narrows the earlier acceptance of shared sources/overlapping provider sets. See [field specification section 6.6](CLOCKFACE_FIELDS_SPEC.md#66-current-stage-sourceprovider-scope--confirmed-assumption).

- Parse all supported, usable data within an acquired source version; expose missing or invalid content through diagnostics rather than inventing values or completeness.
- For this stage, each source supplies one provider. This does not limit a provider to one source or establish that each source contains a complete provider dataset.
- Make the valid parsed routes/modes from the provider's linked sources available by default, including additional modes in a mixed feed even when the provider name suggests a narrower mode.
- Do not currently design for cross-source overlap, matching, deduplication, conflict resolution, or source sharing across providers.
- Keep frontend loading selective. Broad backend ingestion does not change the requirement to fetch only topology and timetable data needed for the selected provider/query.

Source-scoped raw identifiers remain applicable. The globally unique `agencyId` primary key and many-to-many `provider_agencies` association are confirmed (field specification sections 12.1–12.2); other normalized-entity key rules remain unchanged. Membership synchronization and provenance remain deferred; this association does not bring cross-source matching into scope. Equal raw ID strings across sources do not automatically identify one physical entity. The already agreed `provider_sources` fields and constraints are retained; this scope decision does not add a unique source constraint or choose a replacement schema.

**Deferred — F06/F12:** revisit source sharing and overlap handling only after explicit scope expansion or a concrete integration requirement, before supporting those cases. Review any enforcement of single-provider source usage at the integration/write-contract review; additional database constraints require agreement. Review current-scope entity identity and parameterized acquisition with the relevant entity/adapter contracts. Full parsing of an acquired payload does not authorize an unlimited crawl.

**Deferred — F08/F16:** determine serving selection and any coordination between complementary sources from concrete source/query relationships. Keep publication tables and the identifier proposal deferred until a grouped-serving or version-history requirement is established. No independent activation or active-run pointer is implicitly approved.

**Deferred — F14:** optional provider-specific exclusions will be reconsidered if a concrete product requirement arises after the capability contract is agreed. Default inclusion is confirmed, and no exclusion or route-filter database fields are approved.

## 4. Raw snapshot storage

Status: Confirmed storage direction (F08); lifecycle details remain explicitly deferred below. This accompanies the confirmed `storageKey` field in [field specification section 8.5](CLOCKFACE_FIELDS_SPEC.md#85-storagekey--confirmed).

Retain raw snapshot files in backend-managed local storage. PostgreSQL stores version metadata and a relative storage key. The configured storage root is deployment configuration, rather than an absolute path repeated in each version record.

- Docker deployment: place the storage root on persistent mounted storage so snapshots survive container replacement.
- No-Docker deployment: use a configured persistent directory on the host.
- Retained content under an existing key is immutable. Moving the storage root preserves the relative keys and their contents.
- A single-artifact snapshot, such as a GTFS ZIP, retains the original bytes used for its agreed content fingerprint.

**Deferred — F08:** finalize key generation/validation, multi-resource packaging or manifests, and consistent file/database writes and failure recovery during the acquisition/storage lifecycle review, before implementation. Backup/restore and cleanup follow that lifecycle and downstream-reference review. Additional storage backends await a concrete deployment requirement. This decision records the storage direction only; implementation awaits the agreed planning process and the separately supplied backend repository.

## 5. Resolver-provided size statistics

Status: Confirmed responsibility (F15); the method contract remains deferred below.

Each backend resolver provides a method for size statistics appropriate to the content it handles. The project owner chose this approach because acquired content can have different formats and structures. Omit the proposed `contentSizeBytes` / `content_size_bytes` field from `source_content_versions`, as recorded in [field specification section 8.6](CLOCKFACE_FIELDS_SPEC.md#86-size-statistics--resolver-responsibility-confirmed-field-proposal-withdrawn).

This decision assigns responsibility to resolver code. It does not select a method name, result schema, common metric, or database persistence for the results. The withdrawn field's proposed `bigint` type and decimal-string API representation do not become resolver-interface requirements.

**Deferred — F15:** define the method name/signature, metrics and units, format-specific counting scope, result representation, unavailable/error handling, and invocation/caching policy at the resolver-interface review once snapshot acquisition/storage representations are agreed, before implementation. At that review, define which metrics can be compared or aggregated across resolvers based on their units and scope. Any proposed persisted statistics require separate field agreement.

## 6. Parse-run code provenance

Status: Confirmed logging direction (F08); build and logging details remain deferred below.

Record the actual executing build's Git commit together with `sourceParseRunId` in retained execution logs. Use metadata embedded in the running build, not commit/parse timestamp inference or a later read of the checkout's HEAD. No `adapterVersion` database column or independently maintained adapter version number is required by this decision.

The commit identifies the backend build's source revision. Different commits may use identical adapter implementations, and a commit change alone does not trigger reparsing. During diagnosis, compare relevant adapter code, shared code, and dependencies between the logged revisions.

**Deferred — F08:** settle build metadata for Docker/no-Docker and local uncommitted builds, and binding to the actual executing worker, at the build/release and run lifecycle reviews. Settle log structure, retrieval, and retention at the logging review before implementation. Dependency/configuration provenance awaits build and resolver contracts. Automatic adapter-change detection and reparse policy await a concrete requirement and dependency/build definitions; no algorithm or additional persistence is selected here. Revisit database provenance storage only if a concrete query or retention need emerges.

### 6.1 Physical execution logs

Status: Physical log storage and the `logStorageKey` execution-record field are confirmed (F08/F13), as recorded in [field specification section 9.8](CLOCKFACE_FIELDS_SPEC.md#98-logstoragekey--confirmed-errorsummary-proposal-withdrawn).

Keep detailed parsing logs in physical files and reference them from `source_parse_runs` for troubleshooting. The `errorSummary` field proposal is withdrawn. Retain the already-agreed `sourceParseRunId` and actual executing build's Git commit in the logs.

The confirmed field uses a relative key under configured persistent log storage, with a separate logical file for each run. It permits logs for running, successful, and failed executions. The key stays stable while diagnostic events append to the file; an existing key alone cannot establish log completeness or file availability. The detailed storage and logging lifecycle remains deferred below.

**Deferred — F08/F13:** settle log format, diagnostic content/redaction, key validation, rotation/compression, retrieval/access and retention at the resolver diagnostics/logging review. Settle file/database consistency, flushing, finalization, logging failures, crash recovery, and cleanup/missing-file behavior at the execution/storage lifecycle review. Define persistent directory/volume configuration for both Docker and no-Docker deployments during deployment review. Resolve these before implementation; no logging framework or additional logging service is selected by this direction.

## 7. Normalized-data storage — confirmed hybrid direction

Status: Storage responsibilities confirmed (F16), within ClockFace's static-only, read-heavy scope. Detailed artifact contracts, additional physical tables/fields, and the serving/publication lifecycle remain to be agreed. Parse-run status and its automatic `running` default have been separately confirmed in field specification section 9.5; further execution fields and lifecycle details remain subject to agreement.

### 7.1 Evidence and decision criteria

There is no single storage model established by the systems reviewed. Transitland's open-source service supports PostgreSQL-backed REST/GraphQL serving and reading/writing GTFS data through database adapters ([Transitland library](https://github.com/interline-io/transitland-lib#usage-as-a-web-service)). OpenTripPlanner separates building a transport graph from serving it and supports serializing the graph to a file for later loading or use by multiple server instances ([OTP tutorial](https://docs.opentripplanner.org/en/v2.7.0/Basic-Tutorial/), [OTP configuration](https://docs.opentripplanner.org/en/latest/Configuration/)). The OTP example supports the prebuilt-artifact approach; its graph format is not JSON, and it does not establish that JSON files are a universal production default.

ClockFace's static-only, read-heavy workload is the premise of this decision. The storage division supports building static results during ingestion and reading them repeatedly, with database operations for management, search, and publication metadata. Realtime storage and high-frequency realtime updates are outside this design.

ClockFace's existing roadmap emphasizes provider/station discovery, platform-and-date timetable retrieval, and selective trip-path loading. It already permits responses referencing versioned artifacts. These requirements support the confirmed storage division; they are not a measured performance result.

### 7.2 Storage responsibilities — confirmed refined direction

| Responsibility | Agreed storage direction |
| --- | --- |
| Provider/city/agency/source configuration, associations, raw snapshot metadata and parse-run metadata | Keep the already agreed PostgreSQL model and its required-field constraints. |
| Parsed static topology/reference and schedule data | GTFS Schedule-inspired versioned JSON artifacts with nullable domain data and a custom extension object; no complete SQL mirror is required. |
| Additional search/projection or serving-selection metadata | Consider PostgreSQL only when a concrete query/lifecycle requirement justifies the separately reviewed tables/fields. |
| Original acquired inputs | Keep the agreed backend-managed persistent raw-file storage. |
| Normalized planned trips, stop events, calendar rules/exceptions, frequencies, and first/last-service information | Immutable versioned JSON artifacts, optionally compressed, with query-oriented indexes and partitions. |

**Confirmed — F16:** [field specification section 13](CLOCKFACE_FIELDS_SPEC.md#13-static-json-artifacts--gtfs-inspired-nullable-blueprint-confirmed) adopts GTFS Schedule as a domain blueprint, with every domain field and collection nullable, plus a custom map/record-like extension object. This includes missing IDs and whole datasets such as trips or stop times. GTFS required/conditionally-required presence rules are not mandatory ClockFace payload requirements. The `extras` name, recursive JSON object/record value type, and dataset/record placement are confirmed in field specification section 13.3. Null/missing/empty conventions are confirmed in section 13.2.1: standard missing/null fields are equivalent, empty collections describe known empty content, and custom content inside `extras` is preserved. The `lines` SQL table/key proposal remains withdrawn.

**Confirmed refinement — F16:** topology should align with GTFS-static as closely as possible; station timetables contain arrays of `trainRun` records with the owner-specified camelCase properties in field specification section 13.9. **Confirmed:** section 15 accepts retained topology collections and snake_case naming without changing the station-record shape. **Confirmed:** section 15 also completes the reduced topology field review and adopts direct localized name maps. **In discussion:** the broader dataset/schedule container examples in section 13.5 remain unresolved. Physical packaging and remaining resolver mappings are not finalized. **Deferred — F13/F16:** define non-null value validation, array-element handling, unresolved references, and capability-specific serving behavior at the JSON/resolver/API review. Accept incomplete representations without inventing data; nullable IDs do not automatically create valid joins or usable lookup keys. Preserve source precision and partial coverage, and use the confirmed provider timezone. This does not relax database configuration constraints or approve a manifest schema. Other topology SQL tables are conditional query projections, not prerequisites of static ingestion.

**Confirmed — F13/F16:** [field specification section 13.7](CLOCKFACE_FIELDS_SPEC.md#137-station-oriented-timetables-and-optional-trip-relationships--confirmed) establishes station-oriented timetable organization, independently usable station arrival/departure records with their available service context, and optional source-backed trip relationships. The station is the organization/lookup entry point for multiple records, not the sole unique key for each event. Route/direction and date applicability must remain usable without a trip. **Deferred:** agree the exact context placement, identifiers, fields, query capability criteria, and artifact partitions under this model. No new database fields or nested/single-station file layout are selected. **Confirmed:** normalization, JSON artifacts, and domain API responses must preserve the backend StrictTime contract in section 8.

Here JSON means external files managed by the backend, not a new PostgreSQL `jsonb` column. The initial deployment can use persistent local directories or Docker-mounted volumes; no S3, Redis, or other new infrastructure is selected. Additional deployment/storage backends remain subject to their existing review process.

**Confirmed semantic convention — F13/F16:** only populate `frequencies` when concrete departure coverage in `stop_times` is missing or incomplete; this is a semantic convention without programmatic enforcement. [Field specification section 13.6](CLOCKFACE_FIELDS_SPEC.md#136-frequency-population-convention-and-template-trips--confirmed) permits retention of source-backed template trips and their stop times alongside frequencies. A template does not by itself enumerate all departures and is not an additional independent scheduled departure. Do not fabricate missing template data, require complete templates, or infer automatic trip expansion. **Deferred:** review service-scope/template representation and frequency consumption with the detailed frequency/stop-time fields. The broader JSON organization proposal in section 13.5 remains unconfirmed; this agreement does not change the already agreed storage architecture.

**Confirmed — F08/F16:** [field specification section 9.9](CLOCKFACE_FIELDS_SPEC.md#99-outputstoragekey--confirmed) defines `source_parse_runs.outputStorageKey` as the relative locator of a completed normalized JSON artifact set's entry manifest. The file-output reference, entry-manifest direction, and completion-state rules are agreed. Manifest fields, relational output provenance, and publication selection remain deferred to their contract reviews.

### 7.3 Serving and publication direction — unconfirmed

**Deferred — F08/F16:** [field specification section 11](CLOCKFACE_FIELDS_SPEC.md#11-publication--deferred-entitytable-candidate) postpones `publications`, `publication_parse_runs`, and `publicationId` until a concrete grouped-serving or retained-version-combination requirement emerges. The current-stage source/provider scope does not decide how active results are selected; all serving behavior below remains a design direction to review.

Resolve each request against selected completed output, use an index to locate only the relevant artifact partitions, and load/cache a bounded amount of content before returning the existing API response. Support platform/date and trip-path lookup without scanning a whole-network JSON document per request. Choose calendar-aware partitioning from representative feeds rather than assuming every service date must be expanded in advance. Cross-provider sharing and cross-source overlap handling are outside the current stage.

Prepare immutable artifacts, validate schemas, references, and completeness for their declared scope, then change serving selection only when the required relational data and files are ready. Determine the selection unit, request/version consistency, and whether any complementary sources need coordination during the serving review; this paragraph does not require a publication table. Failed generation should leave the previously selected data available. Files and PostgreSQL do not share an atomic transaction, so crash recovery, reader-safe retention, backup/restore, and multi-instance availability still require an explicit lifecycle contract.

JSON storage reduces the need for schedule-detail tables but still requires precise data contracts, indexes, validation and version management. It is less convenient for ad hoc cross-provider/date joins or independent editing of many individual records. If those become core requirements, or representative tests show excessive partition-loading costs, revisit relational or indexed-file storage behind the same API. File format can evolve separately from the API contract after review.

**Deferred — F16:** with storage responsibilities confirmed, define artifact schemas, partition/index design, serialization versioning, memory/cache budgets, and benchmarks using representative feeds and station/date/trip-path queries. Preserve StrictTime precision, extended-hour service times, timezone/calendar semantics, provenance, partial coverage, and frequency semantics regardless of storage. Publication consistency and cleanup must be resolved with F08 before implementation; the scheduler's service-end requirements remain subject to B01–B08. This direction does not approve new JSON fields, database fields, tables, a publication state machine, or performance targets.

## 8. Backend StrictTime contract

Status: Initial scope confirmed as known seconds, withheld seconds and minute-only values; wire fields remain for review, while arithmetic/comparison and broader variants are explicitly deferred (F04/F13/F16).

### 8.1 Scope and shared semantic baseline — confirmed

`StrictTime` is a backend domain contract as well as a frontend contract. The owner has limited the initial ClockFace scope to `12:00:00` (known seconds), `12:00:xx` (seconds exist but are withheld) and `12:00` (only minute precision was defined), following the distinctions in [roadmap section 7](ROADMAP_SPEC.md#7-stricttime). Apply these distinctions throughout the normalized schedule pipeline: adapter/resolver output, persisted JSON artifacts, and domain API responses. Preserve the temporal semantics of arrivals, departures, first/last-service or other temporal bounds, and applicable validity times. Raw source snapshots may retain strings/numbers in their source format; normalized time values must not lose their semantics into a bare timestamp, JavaScript Date, GTFS clock string, or localized display string. Localization and presentation remain frontend responsibilities.

The existing [frontend StrictTime type](../src/domain/strict-time.ts) already distinguishes exact times, published-minute values (truncated/underspecified/unknown), estimates, bounds, and uninterpreted timestamps. The current-phase subset is defined in field section 13.8; estimates, bounds, sub-second precision and additional variants are deferred rather than imposed as initial requirements. Preserve unsupported original input without relabeling it as one of the three supported meanings. This does not edit the existing frontend implementation. Its current representation primarily uses dated epoch values; copying it verbatim does not settle how recurring service-day-relative schedules will be stored. Do not invent a date merely to construct an epoch value.

ClockFace remains a static-data service. Supporting an estimate or bounded value in a shared temporal contract does not authorize realtime ingestion, inferred arrival generation, or writing predictions into official schedules. Durations/headways and calendar dates are not themselves instants; review their encoding with the respective field contracts. Section 10.7 specifically requires StrictTime precision semantics for cutoff lead durations under a before-departure wrapper; detailed StrictTime must support that meaning without treating a duration as a dated instant. Confirmed operational timestamps such as acquisition and parse-run times keep their agreed database/API definitions.

### 8.2 Precision and interpretation invariants — confirmed

- Preserve the finest precision supported by source evidence. Distinguish an exact zero second from a minute-level publication; a serialized `:00` alone proves neither exact seconds nor truncation.
- Preserve the distinction between a finer value withheld by the publisher and a value for which finer detail was never specified. Where the source does not establish that distinction, retain the uncertainty rather than guessing.
- Estimated/bounded/sub-second variants are outside the initial three-form scope and deferred. Do not erase their source meaning by converting them to fabricated exact normalized values; preserve raw input and review unsupported-input handling with the resolver contract.
- Adapters/resolvers establish temporal meaning from source/provider policy before consumers claim a usable exact time. Unknown or uninterpreted meaning must not silently default to exact. A null/missing time remains unknown, not zero or midnight; all-nullable artifact rules continue to apply.
- Preserve the authoritative provider timezone, service-date association, and extended-hour meaning (such as `24:40` belonging to the preceding service day). Serialization or station grouping must not discard that context. The detailed service-relative/instant conversion and daylight-saving rules still require agreement.
- Backend normalization, query projections, and API serialization must retain precision/uncertainty information for the frontend. A station event without a trip still receives the same temporal treatment; a frequency alone does not establish exact departure times.

### 8.3 Implementation review — deferred

**Deferred — F04/F13/F16:** review tags and exact fields for the three initial StrictTime forms, nullable/partial representations, unresolved-input handling, clock-time/advance-duration forms, timezone/configuration binding, and conversion around extended hours and daylight-saving transitions. Arithmetic/comparison implementation is not a prerequisite for reviewing the initial representation. Review how incomplete values affect serving and scheduler boundaries before those consumers are implemented. Calendar dates and durations receive their own contracts rather than fabricated instants.

**Deferred — F13/F16:** during backend/frontend integration, agree the shared type/schema distribution mechanism, runtime validation, serialization versioning, and mappings to the existing frontend representation. Use semantic round-trip and compatibility checks when implementing the contract, including exact zero seconds versus withheld seconds versus minute-only publication, unresolved source interpretation and extended-hour service-day context. Tests for additional semantic variants follow only if those variants are later brought into scope. The independent backend repository has not yet been supplied; this agreement does not authorize creating it or implementing these fields in the current frontend repository.

### 8.4 StrictTime arithmetic and comparison — deferred prerequisite

**Confirmed scope update:** implement the three initial semantic distinctions first; addition, subtraction and ordering/comparison can be implemented later. The earlier arithmetic requirement remains a later-stage contract, including the owner's requested operator-style behavior for `+`, `-`, and ordering operators. Intervals may use minute precision at one endpoint and second precision at the other. Preserve each operand's semantic precision; a shared machine representation does not establish equal precision or an exact ordering.

**Deferred — F04/F13/F16:** at the StrictTime contract review, define supported operations and operand combinations (such as time plus/minus duration and time differences), result meanings/types, precision and uncertainty propagation, ordering/equality behavior when ranges overlap or interpretation is unknown, timezone/service-date context, and null/unusable-value handling. Agree how operator-style semantics are exposed in the selected TypeScript stack; direct syntax, explicit functions/methods, coercion, or any dependency is not selected by this requirement. Do not silently use native numeric/string coercion as the temporal contract.

The field specification's confirmed `[start, end)` rule is a semantic boundary decision. Final interval-key serialization, validation, lookup and ordering must await this detailed contract; do not normalize mixed precision away to bypass the dependency. Existing frontend types remain a compatibility reference, not proof that the necessary operations are already specified. The current task records requirements only and adds no operator implementation. Deferred operations also defer automatic cutoff derivation and cross-cutoff temporal validation; their confirmed ordering/error semantics are not withdrawn. Initial storage/shape review must not be blocked on implementing those operations or substitute raw string/numeric comparisons.

## 9. Station trainRun and line frequency interpretation

**Confirmed placement:** the tag field is directly `trainRun.filterTags`; it is not an unresolved outer-envelope placement choice. No parallel line/station/wrapper tag field is selected. **Confirmed:** [field specification section 13.9](CLOCKFACE_FIELDS_SPEC.md#139-station-trainrun-records--confirmed-fields-and-nullable-policy) records the station-associated `trainRun` array, its seven owner-specified properties and the subsequently confirmed `routeId`, `directionId` and `platformId`, in addition to the existing `extras` extension. All may be null/omitted; in particular, missing arrival/departure times are not fabricated and unknown first/last-passenger flags are not defaulted to false. Keep topology as close to GTFS-static as practical, while preserving the independent station-event model and backend StrictTime contract.

`filterTags` is an open, documented vocabulary for labels such as weekday service or an operating-diagram number. The owner selected these tags to carry service-applicability labels and withdrew the separate station-record calendar reference (section 9.9). Do not enforce a built-in meaning or infer calendar applicability from arbitrary tag text; matching is confirmed in section 9.10, and frequency/date applicability directly reuses these tags as reaffirmed in section 9.11. Source-specific date-query conversion and API shapes remain implementation-contract details. The nullable `terminal` object and explicit-name guard are confirmed in section 9.3. Section 9.4 confirms the `topological_end` resolution scope and ambiguous-topology behavior; detailed lookup and materialization/serialization remain deferred.

**Confirmed correction:** [field specification section 13.10](CLOCKFACE_FIELDS_SPEC.md#1310-line-frequency-information--confirmed-placement-and-unit-exclusivity) places `frequencyInSeconds` / `frequencyInMinutes` in line data, not on each `trainRun`. The operator's disclosed precision selects which value is supplied. Both populated values must produce an error, even if equivalent after unit conversion. Unknown frequency information remains null/omitted under the existing domain policy. Do not fill both, infer a missing headway from neighboring station events, or require each trainRun to carry frequency information. This validation is separate from the unenforced semantic convention governing when frequency data is used.

**Confirmed refinement:** frequency information uses the interval-keyed map in section 9.1 and the existing `filterTags` for frequency/date applicability (section 9.11). **Deferred — F04/F06/F13/F16:** during artifact/resolver/API reviews, agree placement of tagged frequency contexts, interval-key encoding, anchors/windows, number validity/error reporting, first/last-passenger scope encoding and coverage evidence, tag-query encoding, detailed terminal fallback implementation and source-specific date/tag conversion. Do not reinterpret arrival/departure as frequency-window endpoints or infer complete service from a partial station list. Implementation remains pending those field contracts; no new SQL storage or infrastructure is selected here.

### 9.1 Line frequency interval map — confirmed direction

[Field specification section 13.11](CLOCKFACE_FIELDS_SPEC.md#1311-line-frequency-interval-map--confirmed-container-and-value-shape) confirms option A: the line-owned `frequencies` map uses time-interval keys and object values carrying `frequencyInMinutes` or `frequencyInSeconds`. Headways remain numbers, and unit exclusivity applies within each value object. Distinct entries may retain different disclosed units. The earlier array proposal is withdrawn; the alternative of two unit-named maps is not selected. Time-key encoding remains unresolved.

**Deferred — F04/F06/F13/F16:** resolve interval-key encoding together with paired temporal boundaries and StrictTime semantics before implementation. Review missing boundaries, service-day/extended-hour behavior, reference location, physical placement of the confirmed tag-based contexts, duplicate-key collisions, overlaps, empty/null map entries, numeric validation and selection behavior. Map keys do not authorize precision loss, fabricated all-day intervals, automatic unit conversion, or dropping records that lack a complete time range. No new scope field, time-key grammar, or runtime validation implementation is approved by this container decision.

### 9.2 Frequency interval endpoints — confirmed inclusion; operations deferred

[Field specification section 13.12](CLOCKFACE_FIELDS_SPEC.md#1312-frequency-interval-endpoints--confirmed-inclusion-stricttime-prerequisite) confirms inclusive-start/exclusive-end applicability for paired frequency boundaries and permits mixed endpoint precision. A minute-level start and second-level end must retain their respective meanings; their comparison cannot assume fabricated seconds or discarded precision.

**Deferred prerequisite — F04/F13/F16:** complete the detailed StrictTime arithmetic/comparison review in section 8.4 before defining final interval keys, canonicalization, validation or selection. Resolve uncertain endpoints, reference location, overlap/gap handling and tag-context placement afterward; the frequency/date applicability mechanism is already confirmed as `filterTags`. No time-key grammar, extra StrictTime field, coercion rule or operator implementation is approved here.

### 9.3 Terminal identity and supplied name — confirmed

[Field specification section 13.13](CLOCKFACE_FIELDS_SPEC.md#1313-terminal-identity-and-supplied-name--confirmed) defines `terminal` as an object with nullable/omittable `stationId` and `name` members; the whole object remains nullable/omittable. This replaces the scalar string. Preserve a supplied name for display even when its reference is unresolved, and permit station-linked behavior only with an established reference. When only a reference is supplied, topology metadata can provide its display name.

An unresolved reference must not cause explicit terminal information to be overwritten by the topology-end fallback. **Deferred — F06/F13/F16:** review reference/name precedence, empty-object handling, identifier mapping, version binding and default materialization at the terminal/topology and artifact/API reviews. These confirmed contracts do not authorize implementing a matching algorithm or creating missing topology.

### 9.4 topological_end fallback scope — confirmed

[Field specification section 13.14](CLOCKFACE_FIELDS_SPEC.md#1314-topological_end-fallback-scope--confirmed) confirms resolving the default only from an established applicable directed route/path with one unambiguous endpoint. Missing context, unresolved branches or loops without an established endpoint leave the terminal unresolved/null. Supplied station references or terminal names retain precedence; failed reference lookup does not trigger fallback when explicit terminal information exists. A topology-derived default does not establish a source-confirmed operational terminal or trip identity.

**Deferred — F06/F13/F16:** review topology evidence, lookup and the concrete representation of unresolved results under the confirmed ambiguity rules, then select materialization, derivation representation and configuration/version binding during resolver/artifact/API review. No graph algorithm, new context field or terminal provenance column is selected here.

### 9.5 First/last passenger flags — confirmed scope and evidence rules

**Placement clarification:** both flags are already properties of each station-specific `trainRun`. Their applicable scope belongs to that same record; the outer envelope review does not reopen the flags' placement. Exact context fields or references still require field-by-field agreement, and no separate `scope` object is implicitly selected.

[Field specification section 13.15](CLOCKFACE_FIELDS_SPEC.md#1315-firstlast-passenger-flags--confirmed-scope-and-evidence-rules) confirms interpreting the paired flags within the entry's station, line, direction and applicable service-day/operating-diagram scope, retaining any narrower source-declared branch or destination scope. Explicit source markings remain useful without complete timetable coverage. Unknown stays null/omitted; a downloaded or filtered list's endpoints do not establish first/last service. Both flags may be true for a known sole service in the applicable scope.

**Deferred — F04/F06/F13/F16:** review fields or references expressing each `trainRun`'s scope, platform distinctions, overlapping scopes and conflicts with the topology/calendar contracts. Revisit possible automatic derivation only after timetable coverage evidence and StrictTime ordering are defined. No derivation algorithm or additional field is approved by this semantic agreement.

### 9.6 Station record line reference — confirmed

[Field specification section 13.16](CLOCKFACE_FIELDS_SPEC.md#1316-trainrunrouteid--confirmed) confirms nullable/omittable `trainRun.routeId` to preserve known line context independently of optional trip identity. Source-backed timetable context or an established trip relationship can supply the association; unknown stays null/absent, with no guessed default line or reference.

**Deferred — F06/F13/F16:** exact route identity mapping, version binding, unresolved-reference validation and query usability await the topology/resolver/API reviews. This agreement adds no SQL field and does not confirm other station-record context fields.

### 9.7 Station record direction reference — confirmed

[Field specification section 13.17](CLOCKFACE_FIELDS_SPEC.md#1317-trainrundirectionid--confirmed) confirms nullable/omittable string `trainRun.directionId`, interpreted within its applicable line/topology context and usable without a trip. Do not supply a default direction or impose a global `0`/`1` or compass-direction vocabulary. The direction is distinct from a terminal or complete path; same-direction services may have different terminals.

**Deferred — F06/F13/F16:** agree topology representation, identity mapping, labels, route/version binding, loops/branches, incomplete references and query usability during topology/resolver/API review. This agreement adds no SQL table or field.

### 9.8 Station record platform reference — confirmed

[Field specification section 13.18](CLOCKFACE_FIELDS_SPEC.md#1318-trainrunplatformid--confirmed) confirms nullable/omittable string `trainRun.platformId`, referring to a specific topology platform/boarding location when its association is established. Missing platform information does not invalidate otherwise usable station timetables, imply that a station has no platforms, or authorize choosing one from line/direction alone. The field uses ClockFace naming; platform references can follow the GTFS-aligned unified location hierarchy without separate platform storage.

**Deferred — F06/F13/F16:** agree platform/stop identity mapping, labels, station membership, version binding, ambiguous relationships and query usability during topology/resolver/API review. This agreement introduces no SQL table or field.

### 9.9 Service-calendar reference — withdrawn; filterTags retained

[Field specification section 13.19](CLOCKFACE_FIELDS_SPEC.md#1319-service-calendar-reference--withdrawn-filtertags-retained) records the owner's decision to omit `trainRun.serviceId` and its suggested rename `serviceCalendarId`. Use the existing `filterTags` to carry service-applicability or operating-diagram labels. Preserve its open vocabulary, nullable array type and absence of built-in business-semantic enforcement. No substitute calendar-reference field is approved.

**Confirmed — F13/F16:** generic matching is defined in section 9.10. **Deferred — F04/F06/F13/F16:** agree resolver conventions, preservation/mapping of supplied calendar rules and exceptions, and date-query behavior during filtering/resolver/API review, respecting provider timezone and the detailed StrictTime service-day contract. Do not silently restore the withdrawn field or invent a calendar from an arbitrary tag. Raw source content remains preserved; this field withdrawal does not require discarding source calendar information or adding a SQL table.

### 9.10 filterTags query matching — confirmed

[Field specification section 13.20](CLOCKFACE_FIELDS_SPEC.md#1320-filtertags-query-matching--confirmed) confirms exact, case-sensitive matching with AND across requested tags. No tag condition leaves records unfiltered by tags; a nonempty condition is not satisfied by null/missing/empty record tags. Extra tags do not prevent a match. These query rules do not enforce a tag vocabulary or interpret tags into calendar dates.

**Deferred — F04/F13/F16:** define API parameter/response shapes, request validation, resolver conventions and date applicability at the resolver/API review, preserving the confirmed matching semantics. No new field, query parameter name, persisted result or index is approved here.

### 9.11 Frequency and date applicability — filterTags confirmed

[Field specification section 13.20.1](CLOCKFACE_FIELDS_SPEC.md#13201-frequency-and-date-applicability--filtertags-confirmed) reaffirms that frequency/date applicability directly uses the existing `filterTags`, including the confirmed open vocabulary and exact, case-sensitive AND matching. This representation choice is closed; do not add a separate calendar/service reference or present the same decision for approval again. The line-owned frequency interval map remains unchanged.

**Confirmed placement:** `filterTags` belongs to each `trainRun`. The line-owned frequency map stays with line data. **Deferred — F04/F06/F13/F16:** define their relationship in the outer artifact contract, preserving distinct applicable headways with the same interval key. Do not duplicate tags onto line/frequency values, fabricate trainRun records, infer tag inheritance or select new reference fields to bridge this relationship without agreement. Source/provider conventions govern any requested date-to-tag conversion; arbitrary tag strings do not become a built-in calendar language. API parameter shapes, resolver mappings and interval-key encoding retain their existing review points, with time operations depending on detailed StrictTime. This clarification selects no new JSON nesting, synthetic key or runtime implementation.

## 10. Topology location contracts

**Confirmed:** [field specification section 14.1](CLOCKFACE_FIELDS_SPEC.md#141-stop_id--confirmed) defines nullable/omittable `stop_id` on topology location records, with provided IDs unique across location types within a source's applicable topology version. Prefer supplied IDs and consistent established resolver mappings; do not match different sources by equal bare identifiers, use a display name as proof of identity or invent a default ID. This agreement leaves the confirmed station-record reference field names unchanged.

**Deferred — F01/F06/F13/F16:** agree source normalization, validation and duplicate diagnostics, version stability and reference-context representation during topology/resolver/artifact/API reviews. No source-prefix syntax, graph algorithm, new SQL table or mandatory identifier is selected here.

### 10.1 Location type interpretation — confirmed

[Field specification section 14.2](CLOCKFACE_FIELDS_SPEC.md#142-location_type--confirmed) confirms nullable/omittable numeric `location_type`, using the GTFS-aligned meanings of `0`–`4`. Classification must have source or established format-mapping support. Unknown ClockFace type values do not default to stops/platforms, and this field does not require producing all location types or supporting pathway navigation.

**Deferred — F06/F13/F16:** agree explicit source-default conversion, unmapped/invalid type handling and relationship validation during topology/resolver review. A source-format default must not silently become a default for normalized null/missing data. No SQL enum or additional location field is approved by this agreement.

### 10.2 Parent location interpretation — confirmed

[Field specification section 14.3](CLOCKFACE_FIELDS_SPEC.md#143-parent_station--confirmed) confirms nullable/omittable string `parent_station` referencing a parent `stop_id` in the applicable source/topology-version context. The hierarchy follows GTFS parent meanings while retaining ClockFace's all-nullable policy. In particular, boarding areas refer to platforms, and platforms refer to stations when that relationship is known. Do not synthesize missing parents. Self-parenting and cycles are invalid hierarchy structures.

**Deferred — F06/F13/F16:** agree source mapping, unresolved references, type conflicts, diagnostics and partial-data serving behavior during topology/resolver/API review. Reference-context encoding remains subject to the artifact/API contract; no SQL foreign key or new table is selected here.

### 10.3 Location display name — confirmed

[Field specification section 14.4](CLOCKFACE_FIELDS_SPEC.md#144-stop_name--confirmed) confirms nullable/omittable language-map `stop_name`, with one primary display name per supplied language from source data or explicit configuration. Do not default a missing name to an identifier, a parent's name or a generated translation. Equal names do not establish location identity. Store this attribute on the location record; topology relationships continue to reference the corresponding `stop_id`.

**Confirmed update — 2026-09-26:** location aliases and the five scalar-to-language-map display-name changes are accepted in field sections 15.2 and 15.8. The separate translation collection is removed. **Deferred — F03/F06/F08/F13/F16:** agree GTFS translation mapping, language selection, display fallback, validation, source/configured precedence and refresh/history behavior during localized topology/resolver/API review. Existing city/agency naming contracts do not automatically select a topology-name shape. No additional name field or translation table is approved here.

### 10.4 Location coordinates — confirmed

[Field specification section 14.5](CLOCKFACE_FIELDS_SPEC.md#145-stop_lat--stop_lon--confirmed) confirms `stop_lat` and `stop_lon` as independently nullable/omittable finite JSON numbers in WGS84 decimal degrees, with inclusive latitude/longitude ranges of `[-90, 90]` and `[-180, 180]`. Neither coordinate has a default. Retain useful partial data, but require a valid, consistently interpreted pair to use it as a geographic point.

Source or explicitly configured coordinates must describe the location itself; do not fabricate a point from its name or silently copy a parent's position. Establish source coordinate-system semantics and conversion before presenting other coordinate systems as normalized WGS84. Raw snapshots retain the original input.

**Deferred — F06/F08/F13/F16:** agree conversion, precision, validation diagnostics, configuration/version binding and coordinate-dependent query criteria during resolver/artifact/API review. This agreement adds no spatial database requirement, geocoder, conversion implementation or new metadata field.

### 10.5 Topology scope review — reduced contract confirmed

[Field specification section 15](CLOCKFACE_FIELDS_SPEC.md#15-topology-batch--confirmed-reduced-scope) records the accepted reduced scope. Retain the previously agreed core records, `stop_code`, `route_type`, the timing-only pathways/transfers subset, and localized maps for `stop_name`, route short/long names, direction names and pattern headsigns. These five map contracts replace their former scalar types; aliases retain their separate role. Other scalar text contracts, including `route_desc` and `trainRun.terminal.name`, are unchanged.

**Confirmed removed:** the four initially pruned optional fields, speech/description/fare-zone/street-access/continuous-boarding fields reviewed in section 15, the whole networks/shapes/levels collections and dependent shape references, and the separate translations collection. The extra pathway measurements/signage outside timing scope are also removed. Source snapshots remain available. No replacement grouping, geometry, translation SQL table or new event field is implied.

The retained pattern records support calling order without trips or geometry. Source/version identity context, provider timezone authority, all-nullable domain values and existing frequency/StrictTime agreements remain intact. Route-agency references require established mapping to configured global agency IDs. The nine SQL tables and 31 confirmed columns are unchanged.

### 10.6 Pathway and transfer responsibilities — clarification

**Confirmed correspondence:** `pre_boarding_limits` is the renamed ClockFace counterpart of the retained GTFS `transfers` collection, with the four agreed cutoffs added to its records. It carries the retained transfer fields and cutoffs together; there is no parallel normalized `transfers` group or separate cutoff collection. `in_station_pathways` likewise corresponds to the retained GTFS `pathways` collection. These normalized names do not rename raw GTFS files or add SQL tables.

`in_station_pathways` supplies physical location-to-location connections, supplied traversal durations and the limited agreed inputs for estimation. `pre_boarding_limits` supplies service-connection applicability and operational rules, including a published minimum arrival-to-departure interval where available. These are independent record groups: a transfer may traverse several pathways or be supplied without any pathway data. There is no `pathway_id` foreign reference on a transfer and no one-to-one relationship.

Traversal duration and a minimum transfer interval are distinct. Do not substitute an estimated walk for a published minimum, automatically add both when the minimum may already include the walk, or infer operator permission from physical connectivity. The illustrative example in field section 15.7.1 distinguishes a 180-second path from an applicable 300-second minimum; it selects no general conflict-resolution or estimation algorithm.

**Deferred — F01/F03/F06/F08/F13/F16:** resolve reference/context binding, resolver mapping, validation/capabilities, pattern selection, transfer-rule applicability/precedence, estimation and its result/provenance representation, localization, stop-coordinate conversion, manifest/layout and serving lifecycle. No walking-speed default or persisted estimate field is approved. Geometry-distance-unit review is dormant unless geometry is explicitly restored. Detailed temporal contracts and frequency interval/layout details retain their prerequisites; applicability already uses confirmed `filterTags`. No backend implementation or independent repository creation is authorized here.

### 10.7 Pre-boarding limits — confirmed names and requirements, details deferred

[Field specification section 15.7.2](CLOCKFACE_FIELDS_SPEC.md#1572-pre-boarding-limits--confirmed-names-and-fields-encoding-deferred) confirms the owner's `ticketing_cutoff`, `checkin_cutoff`, `boarding_cutoff` and `transfer_passage_cutoff` fields on `pre_boarding_limits` records, StrictTime values wrapped with time-of-day versus before-departure meaning, minute/second precision, scoped validation semantics and flexible applicability. All remain nullable/omittable without defaults. The collection names are confirmed as `in_station_pathways` and `pre_boarding_limits`, replacing normalized `pathways` and `transfers`; existing inner field names remain unchanged. `boarding_rules` and `connection_rules` are unselected alternatives. Collection ownership is settled. Exact union property names, applicability/reference fields, grouping of facts within records and physical packaging remain deferred.

The wrappers must distinguish a local deadline from a precision-preserving advance duration. Current frontend StrictTime primarily represents dated instants/ranges, so copying it does not implement relative durations or recurring service-day times. Detailed StrictTime must establish those representations and arithmetic; no fabricated epoch date or unqualified numeric fallback is permitted. Binding to the applicable departure is essential, particularly for rules tied to last service rather than an arbitrary candidate train.

The confirmed validation semantics apply directly to comparable advance durations sharing the same departure: door-closing advance is at most ticket-check advance. For actual deadline instants, the equivalent order reverses: the applicable ticket-check deadline is no later than door closure. This interpretation applies to the same passenger's check-before-boarding stages. Mixed wrappers, different anchors, precision uncertainty or missing scope need explicit resolution or an unresolved validation result, not a blind comparison of payloads. There is no universal passage/checkpoint/door ordering independent of the known passenger path. Definite contradictions produce validation errors; insufficient context or precision remains unresolved rather than passing by default. Exact diagnostic representation, blocking policy and comparison implementation remain deferred.

`ticketing_cutoff` is the applicable ticket-sales deadline and uses the same nullable StrictTime wrapper as the other cutoffs. Adding it does not approve any universal ordering against the other deadlines or any new ticket-state or purchase-channel fields; review additional ticketing applicability/validation rules separately.

The illustrated 13:07 arrival and 13:17 intercity departure with a three-minute check-in lead yield a displayed 13:14 check-in deadline and nominal seven minutes to reach that checkpoint. The departure remains 13:17. A feasible connection cannot be inferred without adequate movement-time and applicable-rule evidence. Minute precision does not authorize invented exact seconds, and deadline equality semantics remain undecided. Do not automatically sum a published transfer minimum and pathway/cutoff values that may already cover overlapping portions.

**Deferred — F04/F06/F13/F16:** review exact rule organization/applicability and departure anchors, tagged-union wire fields, StrictTime duration/time-of-day representations, comparisons and cutoff inclusion. Agree diagnostic representation, blocking policy, handling of retained incomplete/uncertain data, overlaps/precedence and source-versus-derived API presentation before implementation. No new stored validation field, operator implementation, universal buffer, full journey planner or frontend behavior is selected by this contract discussion.
