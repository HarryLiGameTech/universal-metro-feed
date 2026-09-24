# ClockFace Backend Behavior Specification

Status: Behavioral agreement in progress; no backend implementation authorized yet

Scope: Backend behavior accompanying the field-by-field planning in [ClockFace Field Specification](CLOCKFACE_FIELDS_SPEC.md). Confirmed policy and unresolved implementation details are distinguished below. Database fields continue to require their own agreement.

**Confirmed service boundary:** ClockFace stores and serves static topology, reference data, and planned schedules. Its expected workload is read-heavy, with comparatively infrequent ingestion, parsing, and publication writes. Live arrival predictions, vehicle positions, and realtime update storage are outside ClockFace's scope and must not drive its database or caching design. Planned data obtained through HTTP, including partial schedules, retains its existing static-data semantics and coverage limitations; a refresh does not make it a realtime prediction.

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

**Confirmed refinement — F16:** topology should align with GTFS-static as closely as possible; station timetables contain arrays of `trainRun` records with the owner-specified camelCase properties in field specification section 13.9. **In discussion:** the older GTFS-like flat-group and `snake_case` proposal in section 13.5 remains a candidate for applicable standard data, not an override of the station-record shape. Outer containers, physical packaging, and remaining field mappings are not finalized. **Deferred — F13/F16:** define non-null value validation, array-element handling, unresolved references, and capability-specific serving behavior at the JSON/resolver/API review. Accept incomplete representations without inventing data; nullable IDs do not automatically create valid joins or usable lookup keys. Preserve source precision and partial coverage, and use the confirmed provider timezone. This does not relax database configuration constraints or approve a manifest schema. Other topology SQL tables are conditional query projections, not prerequisites of static ingestion.

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

Status: Backend responsibility and temporal semantics confirmed; wire fields and implementation details deferred (F04/F13/F16).

### 8.1 Scope and shared semantic baseline — confirmed

`StrictTime` is a backend domain contract as well as a frontend contract. Apply [roadmap section 7](ROADMAP_SPEC.md#7-stricttime) throughout the normalized schedule pipeline: adapter/resolver output, persisted JSON artifacts, and domain API responses. Preserve the temporal semantics of arrivals, departures, first/last-service or other temporal bounds, and applicable validity times. Raw source snapshots may retain strings/numbers in their source format; normalized time values must not lose their semantics into a bare timestamp, JavaScript Date, GTFS clock string, or localized display string. Localization and presentation remain frontend responsibilities.

The existing [frontend StrictTime type](../src/domain/strict-time.ts) already distinguishes exact times, published-minute values (truncated/underspecified/unknown), estimates, bounds, and uninterpreted timestamps. Use it as a compatibility baseline and preserve these distinctions when relevant. Its current representation primarily uses dated epoch values; copying it verbatim does not settle how recurring service-day-relative schedules will be stored. Do not invent a date merely to construct an epoch value.

ClockFace remains a static-data service. Supporting an estimate or bounded value in a shared temporal contract does not authorize realtime ingestion, inferred arrival generation, or writing predictions into official schedules. Durations/headways and calendar dates are not themselves instants; review their encoding with the respective field contracts. Confirmed operational timestamps such as acquisition and parse-run times keep their agreed database/API definitions.

### 8.2 Precision and interpretation invariants — confirmed

- Preserve the finest precision supported by source evidence. Distinguish an exact zero second from a minute-level publication; a serialized `:00` alone proves neither exact seconds nor truncation.
- Preserve the distinction between a finer value withheld by the publisher and a value for which finer detail was never specified. Where the source does not establish that distinction, retain the uncertainty rather than guessing.
- Keep point estimates and supported tolerances distinct from exact values; retain earliest/latest bounds rather than silently replacing them with an exact midpoint.
- Adapters/resolvers establish temporal meaning from source/provider policy before consumers claim a usable exact time. Unknown or uninterpreted meaning must not silently default to exact. A null/missing time remains unknown, not zero or midnight; all-nullable artifact rules continue to apply.
- Preserve the authoritative provider timezone, service-date association, and extended-hour meaning (such as `24:40` belonging to the preceding service day). Serialization or station grouping must not discard that context. The detailed service-relative/instant conversion and daylight-saving rules still require agreement.
- Backend normalization, query projections, and API serialization must retain precision/uncertainty information for the frontend. A station event without a trip still receives the same temporal treatment; a frequency alone does not establish exact departure times.

### 8.3 Implementation review — deferred

**Deferred — F04/F13/F16:** during the station-time and calendar field reviews, agree the StrictTime tags and exact fields, nullable/partial representations, unknown-value handling, service-relative versus dated-time forms, timezone/configuration binding, and conversion around extended hours and daylight-saving transitions. Review how incomplete values affect serving and scheduler boundaries before those consumers are implemented. Calendar dates and durations receive their own contracts rather than fabricated instants.

**Deferred — F13/F16:** during backend/frontend integration, agree the shared type/schema distribution mechanism, runtime validation, serialization versioning, and mappings to the existing frontend representation. Use semantic round-trip and compatibility checks when implementing the contract, including exact zero seconds versus minute publication, retained bounds/unknowns, and extended-hour service-day context. The independent backend repository has not yet been supplied; this agreement does not authorize creating it or implementing these fields in the current frontend repository.

### 8.4 StrictTime arithmetic and comparison — deferred prerequisite

**Confirmed requirement:** the detailed StrictTime contract must cover arithmetic and comparison, including the owner's requested operator override/overload behavior for `+`, `-`, and ordering operators. Intervals may use minute precision at one endpoint and second precision at the other. Preserve each operand's semantic precision; a shared machine representation does not establish equal precision or an exact ordering.

**Deferred — F04/F13/F16:** at the StrictTime contract review, define supported operations and operand combinations (such as time plus/minus duration and time differences), result meanings/types, precision and uncertainty propagation, ordering/equality behavior when ranges overlap or interpretation is unknown, timezone/service-date context, and null/unusable-value handling. Agree how operator-style semantics are exposed in the selected TypeScript stack; direct syntax, explicit functions/methods, coercion, or any dependency is not selected by this requirement. Do not silently use native numeric/string coercion as the temporal contract.

The field specification's confirmed `[start, end)` rule is a semantic boundary decision. Final interval-key serialization, validation, lookup and ordering must await this detailed contract; do not normalize mixed precision away to bypass the dependency. Existing frontend types remain a compatibility reference, not proof that the necessary operations are already specified. The current task records requirements only and adds no operator implementation.

## 9. Station trainRun and line frequency interpretation

**Confirmed:** [field specification section 13.9](CLOCKFACE_FIELDS_SPEC.md#139-station-trainrun-records--confirmed-fields-and-nullable-policy) records the station-associated `trainRun` array and its seven owner-specified properties, in addition to the existing `extras` extension. All may be null/omitted; in particular, missing arrival/departure times are not fabricated and unknown first/last-passenger flags are not defaulted to false. Keep topology as close to GTFS-static as practical, while preserving the independent station-event model and backend StrictTime contract.

`filterTags` is an open, documented vocabulary for labels such as weekday service or an operating-diagram number. Do not enforce a built-in meaning or infer calendar applicability from an arbitrary tag. The nullable `terminal` object and explicit-name guard are confirmed in section 9.3. The `topological_end` default meaning remains agreed; its materialization/serialization, resolution scope and ambiguous-topology behavior must be settled before implementation.

**Confirmed correction:** [field specification section 13.10](CLOCKFACE_FIELDS_SPEC.md#1310-line-frequency-information--confirmed-placement-and-unit-exclusivity) places `frequencyInSeconds` / `frequencyInMinutes` in line data, not on each `trainRun`. The operator's disclosed precision selects which value is supplied. Both populated values must produce an error, even if equivalent after unit conversion. Unknown frequency information remains null/omitted under the existing domain policy. Do not fill both, infer a missing headway from neighboring station events, or require each trainRun to carry frequency information. This validation is separate from the unenforced semantic convention governing when frequency data is used.

**Confirmed refinement:** frequency information uses the interval-keyed map in section 9.1. **Deferred — F04/F06/F13/F16:** during line/terminal/query reviews, agree frequency scoping across directions and time periods, interval-key encoding, anchors/windows, number validity/error reporting, first/last-passenger scope and partial coverage, tag matching, terminal fallback and calendar context. Do not reinterpret arrival/departure as frequency-window endpoints or infer complete service from a partial station list. Implementation remains pending those field contracts; no new SQL storage or infrastructure is selected here.

### 9.1 Line frequency interval map — confirmed direction

[Field specification section 13.11](CLOCKFACE_FIELDS_SPEC.md#1311-line-frequency-interval-map--confirmed-container-and-value-shape) confirms option A: the line-owned `frequencies` map uses time-interval keys and object values carrying `frequencyInMinutes` or `frequencyInSeconds`. Headways remain numbers, and unit exclusivity applies within each value object. Distinct entries may retain different disclosed units. The earlier array proposal is withdrawn; the alternative of two unit-named maps is not selected. Time-key encoding remains unresolved.

**Deferred — F04/F06/F13/F16:** resolve interval-key encoding together with paired temporal boundaries and StrictTime semantics before implementation. Review missing boundaries, service-day/extended-hour behavior, reference location, direction/diagram/date scope, duplicate-key collisions, overlaps, empty/null map entries, numeric validation and selection behavior. Map keys do not authorize precision loss, fabricated all-day intervals, automatic unit conversion, or dropping records that lack a complete time range. No new scope field, time-key grammar, or runtime validation implementation is approved by this container decision.

### 9.2 Frequency interval endpoints — confirmed inclusion; operations deferred

[Field specification section 13.12](CLOCKFACE_FIELDS_SPEC.md#1312-frequency-interval-endpoints--confirmed-inclusion-stricttime-prerequisite) confirms inclusive-start/exclusive-end applicability for paired frequency boundaries and permits mixed endpoint precision. A minute-level start and second-level end must retain their respective meanings; their comparison cannot assume fabricated seconds or discarded precision.

**Deferred prerequisite — F04/F13/F16:** complete the detailed StrictTime arithmetic/comparison review in section 8.4 before defining final interval keys, canonicalization, validation or selection. Resolve uncertain endpoints, reference location, overlap/gap handling and calendar scope afterward. No time-key grammar, extra StrictTime field, coercion rule or operator implementation is approved here.

### 9.3 Terminal identity and supplied name — confirmed

[Field specification section 13.13](CLOCKFACE_FIELDS_SPEC.md#1313-terminal-identity-and-supplied-name--confirmed) defines `terminal` as an object with nullable/omittable `stationId` and `name` members; the whole object remains nullable/omittable. This replaces the scalar string. Preserve a supplied name for display even when its reference is unresolved, and permit station-linked behavior only with an established reference. When only a reference is supplied, topology metadata can provide its display name.

An unresolved reference must not cause explicit terminal information to be overwritten by the topology-end fallback. **Deferred — F06/F13/F16:** review reference/name precedence, empty-object handling, identifier mapping, version binding and default materialization at the terminal/topology and artifact/API reviews. These confirmed contracts do not authorize implementing a matching algorithm or creating missing topology.

### 9.4 topological_end fallback scope — in discussion

[Field specification section 13.14](CLOCKFACE_FIELDS_SPEC.md#1314-topological_end-fallback-scope--proposed-not-yet-confirmed) proposes resolving the default only from an established applicable directed route/path with one unambiguous endpoint. Missing context, unresolved branches or loops without an established endpoint would leave the terminal unresolved rather than select an arbitrary station. Supplied station references or terminal names retain precedence. This scope rule is not yet confirmed.

**Deferred — F06/F13/F16:** after agreement, review topology evidence, lookup and ambiguous/unavailable output behavior, then select materialization, derivation representation and configuration/version binding during resolver/artifact/API review. No graph algorithm, new context field or terminal provenance column is selected here.
