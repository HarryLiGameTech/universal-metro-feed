# ClockFace Field Specification

Status: Field-by-field agreement in progress

Scope: Confirmed ClockFace database fields, relationships, corresponding API properties, and normalized JSON artifact contracts

Current-stage assumption: each source supplies data for only one provider; cross-source data overlap is outside the current design scope. This does not limit a provider to one source. See section 6.6 for the scope boundary and its effect on previously confirmed association fields.

Service boundary: ClockFace stores and serves static topology, reference data, and planned schedules, with a read-heavy workload. Live predictions, vehicle positions, and realtime update storage are outside this service's scope. The confirmed hybrid storage responsibilities are recorded in section 10.4 and backend section 7; normalized JSON contracts also require explicit agreement.

Database: PostgreSQL; data access and migrations: Drizzle

## 1. Agreement process

This document records fields explicitly agreed with the project owner. It is not a complete database schema.

- Discuss and confirm each field before adding it to a schema or migration.
- For association tables, present the whole table in one proposal: table name, columns, types, nullability, defaults, keys, foreign-key actions, and any proposed indexes. Discuss adjustments to that proposal together rather than requiring a separate round for each routine column.
- For paired start/end timestamps or validity boundaries, present both fields and their cross-field rules together for agreement rather than requiring separate turns for each endpoint.
- Record its meaning, API name, database column name, type, nullability, default, source or assignment rule, constraints, and update behavior.
- Unspecified details remain undecided. Examples and existing frontend types do not establish additional database requirements.
- Do not introduce implicit fields, including an additional `id`, `created_at`, or `updated_at`, without agreement.
- Keep proposals separate from confirmed definitions. Changes to a confirmed definition require renewed agreement.
- Mark intentionally postponed details explicitly as **Deferred**, identify what is deferred, and record when or after which decision it will be revisited. Track field-level items in section 7 and scheduling behavior in the backend specification. A deferred item is not implicitly approved.

The existing semantic requirements in [Roadmap Specification, section 2.4](ROADMAP_SPEC.md#24-provider-identity-and-gtfs-terminology) remain applicable. This document adds the database decisions agreed during ClockFace planning.

### 1.1 Confirmed physical table names

| Entity | Table | Primary key |
| --- | --- | --- |
| Provider profile | `providers` | `provider_id` |
| City | `cities` | `city_id` |
| Provider–City association | `provider_cities` | `(provider_id, city_id)` |
| Source | `sources` | `source_id` |
| Provider–Source association | `provider_sources` | `(provider_id, source_id)` |
| Source content version | `source_content_versions` | `source_content_version_id` |
| Source parse run | `source_parse_runs` | `source_parse_run_id` |
| Operating agency | `agencies` | `agency_id` |
| Provider–Agency association | `provider_agencies` | `(provider_id, agency_id)` |

## 2. Provider profile

Provider profiles are stored in `providers`. All fields other than those confirmed below remain undecided.

### 2.1 `providerId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Stable, application-owned identifier for a provider profile within Universal Metro Feed. |
| API name | `providerId` |
| Database column | `provider_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Key role | Primary key; globally unique within Universal Metro Feed. |
| Assignment | Explicitly chosen when a provider profile is integrated. |
| Default | None; no automatically generated identifier. |
| Update behavior | The identifier remains stable when the provider's display name changes. |
| Additional surrogate key | No additional UUID key for this entity. |
| Examples | `mta-subway`, `mbta-subway`, `nbrt-subway`. |

The identifier denotes a provider profile, not a city, GTFS agency, or feed publisher. A provider profile may serve multiple cities and consume multiple feeds. Neither source `agency_id` nor feed-publisher metadata automatically becomes `providerId`.

The examples do not establish a character whitelist, regular expression, maximum length, or normalization rule. **Deferred — F01:** agree these details before implementing identifier validation and database format constraints.

The agreed API name describes the intended ClockFace contract. It does not by itself authorize renaming fields in the current frontend registry or manifests.

### 2.2 `names` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Localized display names for the provider profile. |
| API name | `names` |
| Database column | `names` |
| PostgreSQL type | `jsonb`, containing an object that maps language tags or the reserved fallback key to display-name strings. |
| Nullability and content | Not nullable; at least one name is required. Name values must not be empty or whitespace-only strings. |
| Language keys | Language tags such as `zh-CN`, `en`, and `ja`; English is not mandatory. `undetermined-language` is the reserved application-specific fallback key, not a standard language tag. |
| Default behavior | When names are not supplied, populate `{"undetermined-language": "<providerId>"}`, replacing `<providerId>` with this provider's actual identifier. |
| Uniqueness | Names are not required to be unique; different provider profiles may share a display name. |
| Update behavior | Names may be changed and translations added without changing `providerId`. |
| Content source | Names and translations are explicitly confirmed during integration, rather than automatically generated or guessed. The agreed `providerId` default is permitted when names are omitted. |
| Example with supplied names | `{"zh-CN": "宁波地铁", "en": "Ningbo Rail Transit"}` |

Store these names together in this field rather than introducing a separate translation table.

#### Default encoding

For a provider with `providerId` equal to `nbrt-subway`, omitting `names` produces:

```json
{"undetermined-language": "nbrt-subway"}
```

The default preserves the object representation and uses the provider identifier without claiming it is a translation. The agreed fallback key is `undetermined-language`, not `und`.

**Deferred — F02:** choose how to populate the agreed default after the creation/write contract is defined. **Deferred — F03:** determine language selection and display fallback order when reviewing localized API/display behavior.

### 2.3 `timezone` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Authoritative timezone for interpreting all schedules associated with this provider, and its default display timezone. |
| API name | `timezone` |
| Database column | `timezone` |
| PostgreSQL type | `text` |
| Value format | A valid IANA timezone identifier, such as `America/New_York` or `Asia/Shanghai`. |
| Nullability and validation | Not nullable; the value must identify a valid timezone. |
| Assignment | Explicitly specified when the provider profile is integrated. |
| Default | None. |
| Uniqueness | Not required to be unique. |
| Update behavior | May be changed without changing `providerId`; this is a schedule-interpretation configuration change as well as a display change. The capture, reprocessing, and retained-output behavior is explicitly deferred below. |

**Confirmed revision — F04:** all ClockFace timetables use the associated provider's `timezone` for interpretation. This replaces the earlier display-only definition and source/agency-timezone precedence. An upstream timezone declaration does not override this configured provider timezone. Omit `agencies.timezone`; the withdrawn proposal is recorded in section 12.4. A shared agency does not choose the timezone: interpretation follows the provider context.

**Deferred — F04/F08/F16:** define how an execution is bound to its provider and captures the configured timezone, handling of configuration changes during execution, reprocessing after a timezone change, and preservation of already interpreted outputs at the resolver/execution and artifact/serving lifecycle reviews before implementation. Calendar, extended-hour, and daylight-saving handling remain to be specified under this confirmed timezone choice. These are execution/representation details, not a deferred choice of which timezone takes precedence. No new provider-reference or timezone-history column/JSON field is implicitly approved.

An IANA timezone identifier selects date-dependent civil-time rules, including UTC offsets and daylight-saving transitions. A fixed UTC offset alone cannot express those rules. See the [IANA Time Zone Database](https://www.iana.org/time-zones).

### 2.4 `cities` — confirmed relationship

| Property | Agreed definition |
| --- | --- |
| Meaning | Cities through which users can search for and discover this provider profile. |
| API name | `cities` |
| Database representation | A many-to-many association between provider profiles and independently stored, shared city records. Use an association table rather than a city-list column on the provider. |
| API representation | A list of associated cities. City fields are agreed individually in section 3. |
| Optionality and default | A provider may have no configured city associations. Return `[]` in that case, not `null`. |
| Uniqueness | The same provider must not be associated with the same city more than once. |
| Assignment | Associations are explicitly specified during integration. |
| Update behavior | City associations may be added or removed without changing `providerId`. |

A provider may serve multiple cities, and a city may be associated with multiple providers. This list is discovery metadata; it does not imply that every route of a provider serves every listed city. City remains separate from provider identity.

The relationship is stored in `provider_cities`, linking `providers` and `cities`. Association-table fields are agreed individually in section 4; City fields are recorded in section 3. The empty API list is the representation of no associations, not a default for an additional database column.

### 2.5 `sources` — confirmed relationship

| Property | Agreed definition |
| --- | --- |
| Meaning | Data sources used by the provider profile. |
| API name | `sources` |
| Database representation | The previously confirmed many-to-many-capable `provider_sources` association is retained. Current-stage use assumes one provider per source; a provider may still use multiple sources (section 6.6). |
| API representation | A list of associated sources. **Deferred — F07:** finalize each entry's structure after the derived-capability contract, selection rules, and version/provenance references are agreed. |
| Optionality and default | A provider may have no associated sources. Return `[]` in that case, not `null`. |
| Uniqueness | Associate a given provider–source pair only once. |
| Update behavior | Associations may be added or removed. Removing an association does not itself delete the Provider or Source record. |

A provider may combine, for example, a station-directory source and a schedule source. Sharing one source across provider profiles was previously accepted as a broader possibility but is outside the current-stage assumption in section 6.6. **Confirmed — F05:** backend adapters/resolvers derive which kinds of data can be parsed; no manually configured `roles` column is added for that purpose. **Confirmed — F06:** full parsing and default inclusion of all valid parsed routes, including all transport modes, are recorded in section 6.5. Detailed identity mapping and parameterized acquisition scope remain deferred until the relevant entity/adapter contracts are defined. **Deferred — F14:** reconsider explicit provider-specific data-use exclusions only if a concrete requirement emerges after the capability contract is defined; the default inclusion policy is now settled.

The physical association fields and constraints are tracked in section 6. The empty API list represents no associations, not an additional database column with an array default.

## 3. City

City is an application-owned discovery entity shared across providers and stored in `cities`. All fields other than those confirmed below remain undecided.

### 3.1 `cityId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Stable, application-owned identifier for a city within Universal Metro Feed, independent of any provider. |
| API name | `cityId` |
| Database column | `city_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Key role | Primary key; globally unique within Universal Metro Feed. |
| Assignment | Explicitly chosen when the city record is created. Multiple providers may reference the same city record. |
| Default | None; no automatically generated identifier. |
| Update behavior | The identifier remains stable when the city's display name changes. |
| Additional surrogate key | No additional UUID key for this entity. |
| Examples | `us-ny-new-york`, `us-ma-boston`, `cn-zj-ningbo`, retaining the values used in the existing registry. |

Country and region components in readable identifiers must not be parsed to infer administrative-division metadata. **Deferred — F11:** decide whether separate country/region fields are needed when reviewing city-discovery queries; no such fields are approved yet.

#### Explicit project naming rule: Hong Kong, Macao, and Taiwan

City identifiers for Hong Kong, Macao, and Taiwan must start with `cn-`. This prefix is an explicitly confirmed requirement for the project's application-owned `cityId` values.

The `cn-` prefix rule is confirmed. **Deferred — F01:** agree the remaining identifier grammar, suffix conventions, maximum length, and normalization before identifier validation and seed data are implemented.

### 3.2 `names` — confirmed

| Property | Definition |
| --- | --- |
| Meaning | Localized display names for the city. |
| API name | `names` |
| Database column | `names` |
| PostgreSQL type | `jsonb`, containing an object that maps each language tag to a non-empty array of city-name strings. Use arrays even when a language has only one name. |
| Nullability and content | Not nullable. Each language array must contain at least one name; every name must be a non-empty, non-whitespace-only string. |
| Required languages | The object must contain `en` and every language tag listed in `localLanguages`. Each required key must have a valid non-empty name array. |
| Default | None. Explicitly supply names that satisfy the required languages when creating a city; do not substitute `cityId` for missing names. |
| Uniqueness | Names are not required to be unique; different cities may share a display name. |
| Update behavior | Names may be changed and translations added without changing `cityId`, while preserving the required language coverage. |
| Content source | Names and translations are explicitly confirmed rather than automatically guessed. |
| Display and aliases | The first entry in each language array is its primary display name. Subsequent entries are aliases available for search. |

An identifier under `undetermined-language` does not count as an English or local-language name.

#### Multiple names per language — confirmed

- Represent every language's value as a non-empty array of non-empty, non-whitespace-only strings, including languages with only one name.
- Use the first entry as the primary display name for that language; subsequent entries are aliases available for search.
- Keep each language under its own key. Multiple English names do not replace the required local-language names.

For example, `{"en": ["Macao", "Macau"]}` selects `Macao` as the English display name while also allowing discovery through `Macau`. This English-only fragment does not establish the complete local-language requirements for this city.

### 3.3 `localLanguages` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Local languages for which this city must provide names. |
| API name | `localLanguages` |
| Database column | `local_languages` |
| PostgreSQL type | `text[]` |
| Content | Language tags corresponding to keys in `names`, for example `["zh-Hant", "pt"]`. |
| Nullability and validation | Not nullable; the array must not be empty and must not contain duplicate language tags. |
| Assignment | Explicitly specified and confirmed during integration. |
| Default | None. |
| Cross-field validation | `names` must contain `en` and every tag in this array, each with a valid non-empty name array. |
| Update behavior | The list may be adjusted, but the resulting `names` must satisfy the updated language requirements. |

If English is a city's local language, `localLanguages` may be `["en"]`. The same `names.en` array satisfies both the English requirement and that local-language requirement; no duplicate name collection is needed.

## 4. Provider–City association

The `provider_cities` table implements the many-to-many relationship agreed in section 2.4. All fields other than those confirmed below remain undecided. The composite primary key is confirmed in section 4.3.

### 4.1 `provider_id` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Identifies the provider to which this city association belongs. |
| Database column | `provider_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Foreign key | References `providers.provider_id`; the referenced provider must exist. |
| Assignment | Explicitly supplied when establishing the association. |
| Default | None. |
| Uniqueness | Not individually unique; one provider may have multiple city associations. |
| Foreign-key delete action | `ON DELETE CASCADE`: deleting a provider automatically removes its association records. City records are retained. |

The cascade applies only to the association records.

### 4.2 `city_id` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Identifies the city associated with this provider. |
| Database column | `city_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Foreign key | References `cities.city_id`; the referenced city must exist. |
| Assignment | Explicitly supplied when establishing the association. |
| Default | None. |
| Uniqueness | Not individually unique; one city may have multiple provider associations. |
| Foreign-key delete action | `ON DELETE CASCADE`: deleting a city automatically removes its association records. Provider records are retained. |

After a city is deleted, previously associated providers remain available but are no longer discoverable through that city.

### 4.3 Composite primary key — confirmed

Use the pair `(provider_id, city_id)` as the association's primary key. Do not add a separate `id` or UUID column:

```sql
PRIMARY KEY (provider_id, city_id)
```

Each provider–city pair uniquely identifies one association. Either column may repeat across records as long as the pair differs. This enforces the agreed rule that a provider must not be associated with the same city more than once.

## 5. Source

A Source identifies an ongoing data origin, such as a periodically updated GTFS feed. Its identity is independent of provider identity and of individual downloads or data versions. Acquisition and update configuration will be agreed separately; the identifier alone does not enable automatic updates.

Sources are stored in `sources`. **Confirmed — F08:** the source-content-version fields through the storage key and the local-storage direction are agreed in sections 8.1–8.5. Section 8.6 records the decision to omit a content-size column and delegate size statistics to resolver code (F15). The parse-run fields through adapter identity are confirmed in sections 9.1–9.3; code provenance is recorded in logs without an `adapterVersion` column (section 9.4). Execution status is confirmed in section 9.5. The start timestamp is confirmed in section 9.6. The completion timestamp is confirmed in section 9.7. The log-file reference `logStorageKey` is confirmed in section 9.8. The normalized-output reference `outputStorageKey` is confirmed in section 9.9; remaining version details are explicitly deferred under F08. All fields other than those confirmed below remain undecided. The Provider–Source many-to-many relationship is confirmed in section 2.5; its physical association fields and constraints are tracked in section 6.

### 5.1 `sourceId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Stable, application-owned identifier for a data source, rather than an individual download or version. |
| API name | `sourceId` |
| Database column | `source_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Key role | Primary key; globally unique within Universal Metro Feed, independent of provider identity. |
| Assignment | Explicitly chosen when integrating the source. |
| Default | None; no automatically generated identifier. |
| Update behavior | The identifier remains stable through normal data refreshes or a download-address migration of the same source. |
| Additional surrogate key | No additional UUID key for this entity. |
| Examples | `mta-static-gtfs`, `mbta-static-gtfs`. |

The independent source identity is linked to its provider through `provider_sources`, described in sections 2.5 and 6. The association retains its previously agreed physical structure, while current-stage use assumes one provider per source (section 6.6). New data versions are recorded separately without replacing the source identity. **Confirmed — F08:** content-version identity is defined in section 8.1. **Deferred — F08:** retention/deletion rules await the snapshot, publication, and provenance-reference model.

### 5.2 `urlTemplate` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Address template used to acquire data from the source. |
| API name | `urlTemplate` |
| Database column | `url_template` |
| PostgreSQL type | `text` |
| Content | An absolute HTTP or HTTPS address, optionally containing agreed parameter placeholders. |
| Nullability | Nullable. `NULL` means no remote acquisition address is configured, as with a manually imported source. |
| Default | `NULL`. |
| Uniqueness | Not required to be unique. |
| Update behavior | May be changed when the same source migrates its acquisition address; `sourceId` remains stable. |

A fixed file-download address is a template without placeholders. Parameterized requests may use placeholders such as `{stationId}`. The corresponding adapter must explicitly interpret the supported placeholders; templates do not execute arbitrary code.

Adapter selection is recorded in section 5.3 and the day-based refresh interval in section 5.4. Service-day scheduling behavior is tracked in [ClockFace Backend Behavior Specification](CLOCKFACE_BACKEND_SPEC.md). **Deferred — F09:** agree request methods, placeholder parameters, and additional parsing configuration after each adapter's acquisition contract and source scope are defined. This field alone does not determine the source's update behavior.

### 5.3 `adapter` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Selects the code responsible for parsing, validating, and normalizing this source's data. |
| Location | A field on the Source record, alongside `source_id` and `url_template`. |
| API name | `adapter` |
| Database column | `adapter` |
| PostgreSQL type | `text` |
| Content | The name of an adapter registered in backend code. |
| Nullability and validation | Not nullable; the name must match a registered adapter. An unknown name is a configuration error. |
| Assignment | Explicitly selected when integrating the source, including manually imported sources. |
| Default | None. |
| Uniqueness | Not required to be unique; multiple sources may reuse the same adapter. |
| Update behavior | A changed selection applies to subsequent imports; already published data versions are not automatically rewritten. |
| Example names | `gtfs-static`, `mbta-v3`, `nbrt-schedule-time`. These illustrate adapter selection rather than an exhaustive backend registry. |

The backend reads the value and resolves it through a code-controlled adapter registry before calling the corresponding handler. The database stores the name, not executable code. No separate Adapter table or database foreign key is introduced for this field.

This field selects data-processing code. **Confirmed — F05:** the selected backend adapter/resolver determines parsable data capabilities; see section 6.4 and section 2 of the backend behavior specification. The background refresh interval is recorded in section 5.4.

### 5.4 `refreshIntervalDays` — confirmed; service-day scheduling details tracked separately

| Property | Agreed definition |
| --- | --- |
| Meaning | Interval in days for scheduled backend checks for source-data updates. |
| API name | `refreshIntervalDays` |
| Database column | `refresh_interval_days` |
| PostgreSQL type | `integer` |
| Values | A positive integer of at least `1`, or `NULL`. Fractional days and zero are not allowed. |
| Nullability | Nullable. `NULL` disables scheduled background checks while leaving manual or on-demand acquisition available. |
| Default | `NULL`; explicitly configure the interval when integrating the source. |
| Cross-field validation | If `urlTemplate` is `NULL`, this field must also be `NULL`. |
| Update behavior | After a change, subsequent scheduling uses the new interval. |

The project owner selected whole-day intervals for scheduled static-timetable updates, with one day as the minimum configured interval. This field replaces the seconds-based proposal; no `refresh_interval_seconds` field is approved.

This interval controls backend checks, not whether the upstream data has changed, how long published data remains valid, or how frequently the frontend refreshes. **Deferred — F06/F09:** agree the acquisition scope and parameter binding for templated URLs after the relevant entity and adapter contracts are defined.

#### Service-day scheduling boundary

When an existing static timetable is available, the project owner selected a local last-train boundary for advancing the update-day countdown, accounting for extended-hour times such as `24:xx`. This is a service-day completion rule, rather than a fixed 24-hour timer or an unconditional midnight trigger.

The rule, examples, and unresolved cases are recorded in [ClockFace Backend Behavior Specification](CLOCKFACE_BACKEND_SPEC.md). The configured `refreshIntervalDays` remains unchanged as an interval setting. The owner's `day--` notation is confirmed to mean decrementing the remaining update days; reaching zero triggers an update check. **Deferred — F10 and B01–B08 in the backend specification:** determine the remaining scheduling behavior after its listed prerequisites, then return here to agree any required state fields. No countdown, scheduling-timezone, or execution-state database fields are approved by this scheduling discussion.

## 6. Provider–Source association

The `provider_sources` table retains the previously confirmed many-to-many-capable physical structure from section 2.5; current-stage usage is narrowed by section 6.6. Its fields, delete actions, composite primary key, and absence of an additional identifier are confirmed below. **Confirmed — F05:** capability derivation belongs to backend code; the `roles` proposal is withdrawn. **Confirmed — F06:** default provider inclusion is defined in section 6.5. No selection-rule columns have been approved.

### 6.1 `provider_id` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Identifies the provider using this source through the association. |
| Database column | `provider_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Foreign key | References `providers.provider_id`; the referenced provider must exist. |
| Assignment | Explicitly supplied when establishing the association. |
| Default | None. |
| Uniqueness | Not individually unique; one provider may have multiple source associations. |
| Foreign-key delete action | `ON DELETE CASCADE`: deleting a provider automatically removes its association records. Source records are retained. |

### 6.2 `source_id` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Identifies the source used by the associated provider. |
| Database column | `source_id` |
| PostgreSQL type | `text` |
| Nullability | Not nullable. |
| Foreign key | References `sources.source_id`; the referenced source must exist. |
| Assignment | Explicitly supplied when establishing the association. |
| Default | None. |
| Uniqueness | Not individually unique in the previously confirmed physical schema. Current-stage usage assumes one provider per source (section 6.6); no new unique constraint is approved here. |
| Foreign-key delete action | `ON DELETE CASCADE`: deleting a Source removes its corresponding association records. Provider records are retained. |

The cascade specified here applies only to association records. **Deferred — F08:** source versions and historical/provenance data need their own retention and deletion rules once that model is agreed.

### 6.3 Base-table definition — confirmed

The base table is confirmed as follows. Additional business fields and supporting constraints are explicitly distinguished from that confirmed structure.

| Item | Definition | Status |
| --- | --- | --- |
| Source table name | `sources` | Confirmed |
| Association table name | `provider_sources` | Confirmed |
| Provider column | `provider_id text NOT NULL`, no default; references `providers.provider_id`; `ON DELETE CASCADE` | Confirmed |
| Source column | `source_id text NOT NULL`, no default; references `sources.source_id`; `ON DELETE CASCADE` | Confirmed |
| Association primary key | `(provider_id, source_id)` | Confirmed |
| Additional identifier | No separate `id` or UUID column | Confirmed |
| Parsable data capabilities | Derived by backend adapters/resolvers; no manually configured `roles` column | Confirmed direction — F05 |
| Default provider inclusion | All valid parsed routes from associated sources, including all modes | Confirmed — F06; source sharing and cross-source overlap are outside current scope (section 6.6) |
| Foreign-key update actions and supporting indexes | Not yet selected | Deferred — F12 |

### 6.4 Capability derivation — backend responsibility; no `roles` column

The project owner requested that backend resolver code determine what a source can be parsed into, particularly for GTFS-based providers. The proposed manually configured `roles` field is withdrawn; it is not part of the agreed database model.

The registered adapter's supported parsing features and the usable data actually produced from a source are distinct. Backend adapters/resolvers derive capabilities from parsing and validation results. Detailed behavior is tracked in [ClockFace Backend Behavior Specification, section 2](CLOCKFACE_BACKEND_SPEC.md#2-source-capability-derivation).

**Confirmed — F06:** section 6.5 includes all valid parsed routes from linked sources by default, with no mandatory filter field. Detailed identity mapping and acquisition scope remain deferred until the relevant entity/adapter contracts are defined. **Deferred — F14:** intentionally excluding otherwise available data for a provider is optional usage policy, to reconsider only after a concrete requirement and the capability contract exist.

**Deferred — F13:** capability output shape, coverage classification, runtime health, and any persistence of derived results await the source-version and adapter contracts. No replacement capability columns or tables are approved by this decision.

### 6.5 Full parsing and overlapping provider route sets — confirmed

Full parsing of all supported, usable data and default inclusion of valid routes/modes remain confirmed. This includes additional transport modes in a mixed feed even if a provider's current name suggests a narrower mode. No mandatory route-filter field is introduced.

The earlier agreement also allowed multiple providers to include overlapping route sets. That broader possibility is now outside the current-stage assumption in section 6.6; it is retained as context, not an implementation requirement for this stage. See [backend specification section 3](CLOCKFACE_BACKEND_SPEC.md#3-full-parsing-and-provider-route-overlap).

**Deferred — F06:** revisit shared physical storage, cross-provider projections, and cross-source entity matching only when the corresponding broader scope is explicitly resumed or a concrete integration requires it. Route identity and parameterized acquisition contracts still require review for the current scope. Source-scoped raw identifiers remain applicable; equal raw ID strings in different sources do not automatically identify one entity. Other normalized-entity identity rules remain unchanged; the owner explicitly requires global uniqueness for `agencyId` in section 12.1.

### 6.6 Current-stage source/provider scope — confirmed assumption

The project owner narrowed the current stage to the following assumptions:

- Each source supplies data for only one provider; sharing the same source across multiple provider profiles is outside the current stage.
- Do not currently design for overlapping data between sources. Cross-source entity matching, deduplication, conflict resolution, and overlap-driven merging are deferred.
- This is not a one-to-one provider/source requirement. A provider may still use multiple sources; the instruction does not establish that every provider has one complete feed.
- Full parsing and inclusion of supported, usable data remain as agreed in section 6.5.

This is a scope decision, not approval to change the already agreed physical fields, composite primary key, or foreign-key actions of `provider_sources`. Retain that association structure; do not silently add `UNIQUE(source_id)`, move `provider_id` onto `sources`, or remove the association table. **Deferred — F06/F12:** if enforcing single-provider usage requires additional validation or a database constraint, review that exact mechanism at the integration/write-contract review before implementation. Revisit source sharing and overlap handling only after explicit scope expansion or a concrete integration requirement, before supporting such data.

One provider per source and absence of overlap do not by themselves settle whether multiple complementary sources must be activated together. **Deferred — F08/F16:** review serving selection and any coordination when concrete queries, references, and source composition are defined. Keep `publications`, `publication_parse_runs`, and the `publicationId` proposal deferred under section 11; no active-run pointer or automatic activation rule is approved by this scope decision.

## 7. Deferred decision register

All items below are explicitly **Deferred** unless marked **In discussion** or **Confirmed**. Deferred items await the listed prerequisite or review point; this does not approve an implementation or any additional field. When a prerequisite is met, mark the item **In discussion** while reviewing the proposal rather than leaving a stale deferral. Keep the relevant section and this register synchronized as decisions are made. F05 is resolved by assigning capability derivation to backend code, without a `roles` column.

| ID | Deferred detail | Resume discussion after / at |
| --- | --- | --- |
| F01 | Identifier grammar, length, normalization, and remaining city-ID suffix conventions; the confirmed `cn-` rule remains in force. | The identifier-validation review, before input validation, format constraints, and seed identifiers are implemented. |
| F02 | How the agreed Provider `names` default is populated. | The creation/write contract is defined; choose the implementation before writing the create path. |
| F03 | **Confirmed:** agency `names` representation, language requirements, and freely specified names without resolver extraction/source-evidence requirements (section 12.3). **Deferred:** language selection, display fallback, and the detailed validation/search rules listed there. | Resolve language selection, fallback, and search behavior at the localized API/display contract review using the agreed name/alias structures. |
| F04 | **Confirmed:** `providers.timezone` governs interpretation of all associated timetables and remains the default display timezone. Source timezone declarations do not override it; the agency timezone field is withdrawn (sections 2.3 and 12.4). **Confirmed:** backend StrictTime semantics and precision preservation (section 13.8; backend section 8). **Deferred:** detailed StrictTime arithmetic/comparison contracts (including `+`, `-`, ordering operators and mixed minute/second precision), operator/API realization, field encoding and service-day-relative versus dated-time representation, execution/provider binding and timezone capture, configuration-change/reprocessing behavior, retained-output preservation, calendar/service-day semantics, and validation/recovery details. | Resolve execution/configuration behavior at the resolver/calendar review and historical representation at the artifact/serving review before implementation. The timezone authority itself is settled. |
| F05 | **Confirmed:** backend adapters/resolvers derive parsable data capabilities; no manually configured `roles` field. | Resolved in section 6.4 and backend section 2. Detailed capability representation remains deferred under F13. |
| F06 | **Confirmed:** full parsing/default inclusion and the current-stage assumption of one provider per source, with cross-source overlap out of scope (sections 6.5–6.6). **Confirmed:** globally unique `agencyId` as the agency primary key and the many-to-many `provider_agencies` association (sections 12.1–12.2). **Confirmed:** static domain data uses GTFS Schedule-inspired JSON with nullable data fields/collections and an extensible JSON object (section 13). The `lines` table/SQL-key proposal is withdrawn; JSON identifiers may be null and are not implicitly globally unique. Detailed identity/reference contracts remain deferred to the artifact review. **Deferred:** sharing, cross-source matching/deduplication/conflict handling, scope-enforcement mechanism, detailed identity mapping, route identity, and parameterized acquisition scope. | Revisit sharing/overlap only after explicit scope expansion or a concrete integration requirement. Review usage validation at the integration/write-contract review; any database constraint requires renewed agreement. Review current-scope identity/acquisition after route/agency/stop and adapter contracts are defined. |
| F07 | The exact API structure of entries in Provider `sources`. | The derived-capability contract, selection rules, and source-version/provenance references are agreed. |
| F08 | **Confirmed:** source-content-version fields through the storage key (sections 8.1–8.5), local-storage direction (backend section 4), parse-run fields through adapter identity (sections 9.1–9.3), their agreed deletion constraints, and code provenance in logs without an `adapterVersion` column (section 9.4; backend section 6). **Confirmed:** parse-run status and automatic `running` default (section 9.5). **Confirmed:** start timestamp (section 9.6). **Confirmed:** completion timestamp and status consistency (section 9.7). **Confirmed:** detailed parse-run logs in physical files with an execution-record reference; `errorSummary` withdrawn. **Confirmed:** `logStorageKey` (section 9.8; backend section 6.1). **Confirmed:** `outputStorageKey`, locating normalized JSON output through an entry manifest (section 9.9). **Deferred:** `publications`, `publication_parse_runs`, and `publicationId` until a concrete grouped-serving/version-history requirement is established (sections 6.6 and 11). **Deferred:** build metadata generation and execution binding, log format/retention, adapter-change detection and reparse policy, multi-resource snapshot boundaries and fingerprint representation, storage lifecycle details, version creation/reuse and associated uniqueness constraints, remaining run fields and processing/publication relationships, coverage/validity, remaining provenance, and retention/deletion policy. Resolver size statistics are tracked under F15. | Review serving selection after concrete current-scope source/query relationships are defined. Resume publication tables only if coordinated output selection or retained combination history is required; return to further run fields only when resolver, recovery, or serving contracts establish a concrete requirement. Resolve build metadata and execution binding during build/release and run lifecycle reviews, and log format/retention during the logging review. Review adapter-change detection if automatic reprocessing is required, after resolver dependencies and build contracts are defined. Resume other details as acquisition, storage, resolver, and publication contracts are defined; confirm required fields before implementation. |
| F09 | HTTP request methods, parameter binding, and additional adapter parsing configuration. | Adapter acquisition contracts and source selection scope are defined. |
| F10 | Remaining scheduling policies and any persistent execution state. | The prerequisites in backend items B01–B08 are satisfied; any required database fields then return to this agreement process. |
| F11 | Whether separate country/region metadata is needed. | The city-discovery query review; no administrative fields are assumed from identifier prefixes. |
| F12 | Foreign-key update actions and supporting query indexes, including reverse association lookups. | Identifier-update behavior and concrete API/query access patterns are reviewed, before migration and query implementation. |
| F13 | **Confirmed:** nullable/incomplete static artifacts are supported; missing GTFS-required data does not by itself invalidate the ClockFace payload (section 13.2). **Confirmed:** station timetable data can be usable without trip identity (section 13.7); backend time processing must preserve StrictTime semantics (section 13.8). **Deferred:** capability output shape, coverage classifications, handling of unusable records and unresolved references, runtime health, and any persistence of derived results. | Define capability-specific requirements at the resolver/API contract review without reinstating GTFS required-field rules as global payload requirements. Resolve before publishing capability/availability results or adding storage for them. |
| F14 | **Deferred:** whether explicit provider-specific exclusions of otherwise parsable data categories are needed. | A concrete usage requirement emerges and the capability/selection contracts are agreed; no exclusion fields are currently approved. |
| F15 | **Confirmed:** each backend resolver provides a size-statistics method; omit the `contentSizeBytes` database field (section 8.6; backend section 5). **Deferred:** method name/signature, metrics and units, counting scope, result representation, unavailable/error handling, invocation and caching policy. | Define the method contract during the resolver-interface review once snapshot acquisition/storage representations are agreed, before implementation. Any future database persistence requires separate field agreement. |
| F16 | **Confirmed:** hybrid storage responsibilities for ClockFace's static-only, read-heavy workload (section 10.4; backend section 7): management/search/publication metadata in PostgreSQL, detailed schedules in versioned JSON files. **Confirmed:** the parse-run JSON-output locator and entry-manifest direction (section 9.9). **Deferred:** publication tables and identifier (section 11), pending a concrete grouped-serving requirement under the scope in section 6.6. **Confirmed:** `agencies`, `agencyId`, and the whole `provider_agencies` association (sections 12.1–12.2). **Confirmed:** agency `names` (section 12.3). **Confirmed:** provider-owned schedule timezone; agency `timezone` proposal withdrawn (section 12.4). **Confirmed:** GTFS Schedule-inspired JSON for parsed static domain data, all data fields/collections nullable, and a custom extension object (section 13). **Confirmed:** `extras` naming, recursive JSON value type, and dataset/record placement (section 13.3). **Confirmed:** null, missing-key, and empty-collection conventions (section 13.2.1). **Confirmed:** populate `frequencies` only when concrete departure coverage in `stop_times` is missing/incomplete, without programmatic enforcement; source-backed template trips and their stop times may be retained alongside frequencies (section 13.6). **Confirmed:** station-oriented timetable organization, independently usable arrival/departure records, and optional source-backed trip relationships (section 13.7). **Confirmed:** backend `StrictTime` semantics across normalization, artifacts, and domain APIs (section 13.8; backend section 8). **Confirmed:** topology should align with GTFS-static as closely as possible; station timetables contain arrays of nullable/omittable owner-specified `trainRun` fields with opaque `filterTags` (section 13.9). **Confirmed correction:** mutually exclusive frequency units belong to line data, not individual `trainRun` records (section 13.10). **Confirmed:** line frequency information uses a map keyed by time interval; the rule-array proposal is withdrawn (section 13.11). **Confirmed:** option A, with `frequencies` as the map and a unit-bearing object for each value. **Confirmed:** inclusive-start/exclusive-end interval semantics (section 13.12). **Deferred prerequisite:** detailed StrictTime arithmetic/comparison semantics, including mixed-precision endpoints, before interval encoding or evaluation. **Confirmed:** `terminal` is a nullable object preserving a nullable station reference and supplied name; explicit names prevent topology fallback even when the reference is unresolved (section 13.13). **In discussion:** topology fallback only when the applicable directed path establishes one unambiguous endpoint (section 13.14). **Deferred:** exact outer containers/reference details, terminal fallback resolution, and frequency scoping across directions/time periods. Remaining GTFS-derived field mappings still require agreement. The `lines` SQL table/key proposal is withdrawn; topology SQL projections require a concrete query need. **Deferred:** further physical table decomposition/names/fields, service-pattern representation, JSON contracts, indexes, and serving/publication lifecycle details. | Review the retained database candidates and JSON contracts under the confirmed division, respecting F04/F06 identity and timezone dependencies. Resolve pattern representation during topology and artifact-index reviews, and publication consistency with F08 before implementation. Confirm every field before implementation. |

## 8. Source content version

A SourceContentVersion identifies an immutable source-data snapshot for provenance and later reinterpretation. It is distinct from the stable Source identity. The confirmed physical table is `source_content_versions`, with one row per retained snapshot of an individual source's collected content. The name explicitly refers to content versions, rather than revisions of the source's identity or configuration. Only the table name and fields marked confirmed below are agreed; other fields remain undecided.

Here a snapshot means the raw data collected from one source within an agreed acquisition scope. For a source delivered as a GTFS ZIP, this can be the downloaded ZIP and its contained files. It is not a global snapshot of every source or provider, nor does it by itself define a version of normalized output.

**Deferred — F08:** define the exact snapshot boundary and completeness criteria for paginated or parameterized HTTP sources after their acquisition contracts are specified. A set of responses acquired through multiple requests must not be assumed to represent a single atomic state of the upstream system.

### 8.1 `sourceContentVersionId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Identifier for an immutable source-data snapshot. |
| Table | `source_content_versions`; one row per retained source-content snapshot. |
| API name | `sourceContentVersionId` |
| Database column | `source_content_version_id` |
| PostgreSQL type | `uuid` |
| Nullability | Not nullable. |
| Key role | Primary key, globally unique within ClockFace. |
| Assignment/default | Automatically generated by the backend when creating the snapshot record; not manually assigned by an integrator. |
| Update behavior | The identifier and the source snapshot it identifies are immutable. A different snapshot must not overwrite the data referenced by an existing identifier. |

This application-owned identifier does not depend on an upstream publisher's version label. It is not an acquisition-attempt counter or a definition of whether two downloads have identical content.

**Deferred — F08:** determine when a new snapshot is created or reused and its boundary for multi-request/parameterized sources after the snapshot acquisition contract is defined. The content fingerprint is confirmed in section 8.4, with multi-resource representation explicitly deferred there. Parse-run fields through adapter identity are confirmed in sections 9.1–9.3, and code provenance in logs is confirmed in section 9.4; run status is confirmed in section 9.5. The start timestamp is confirmed in section 9.6; the completion timestamp is confirmed in section 9.7. The log-file reference `logStorageKey` is confirmed in section 9.8. The normalized-output reference is confirmed in section 9.9. Build metadata generation/binding and publication versions remain deferred until their build, execution, and publication contracts are defined. Coverage/validity and retention/deletion policy follow those decisions. No corresponding additional fields are approved by the content-version identifier decision. The source reference and its deletion constraint are confirmed in section 8.2.

### 8.2 `sourceId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | The source whose collected content this snapshot represents. Each content version belongs to exactly one source; a source may have multiple content versions. |
| Table | `source_content_versions` |
| API name | `sourceId` |
| Database column | `source_id` |
| PostgreSQL type | `text`, matching `sources.source_id`. |
| Nullability | Not nullable. |
| Default | None. |
| Assignment | The backend supplies the existing source's identifier when creating a snapshot during acquisition or manual import. |
| Foreign key | References `sources.source_id`. |
| Uniqueness | Not unique; multiple content versions may reference the same source. |
| Delete behavior | `ON DELETE RESTRICT`: a source with retained content versions cannot be deleted. Deleting the source must not automatically erase its content history. |
| Update behavior | A content version cannot be reassigned to a different source after creation. |

This is a direct one-to-many relationship, not a separate association table. The source reference does not add a provider reference: provider membership is already represented by `provider_sources`, with one provider per source assumed for the current stage (section 6.6).

**Deferred — F12:** agree the foreign key's `ON UPDATE` action and supporting indexes after identifier-update behavior and concrete queries are reviewed. **Deferred — F08:** agree whether and when content versions can be deleted after retention and downstream provenance references are defined; the source deletion constraint does not establish a content-version cleanup policy.

### 8.3 `acquiredAt` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | The instant when the backend finished acquiring the raw content used to create this content version, within the snapshot's agreed acquisition scope. |
| Table | `source_content_versions` |
| API name | `acquiredAt` |
| Database column | `acquired_at` |
| PostgreSQL type | `timestamptz` |
| API representation | An RFC 3339 timestamp serialized in UTC with a `Z` suffix, for example `2026-09-20T08:15:30Z`. |
| Nullability | Not nullable. |
| Default | No database default; the backend explicitly supplies the acquisition-completion instant. |
| Assignment | For a remote acquisition, record when the backend finishes receiving the content in the agreed snapshot scope. For a manual import, record when the backend finishes receiving the imported content. |
| Uniqueness | Not unique; multiple content versions may have the same timestamp. |
| Update behavior | Immutable after creation. Later checks, reparsing, or reuse of the existing version do not change its acquisition timestamp. |

This timestamp supports acquisition provenance. It does not represent the upstream publication time, schedule validity, parsing/publication completion, or database insertion time. Acquisition completion alone does not establish that the content is parsable or suitable for publication.

For acquisitions spanning multiple requests, the timestamp denotes completion of the overall agreed scope; it does not assert that all responses reflect one atomic upstream state. **Deferred — F08:** define that scope and its completeness criteria with the adapter acquisition contract. Whether unchanged content creates a new version or reuses an existing one remains deferred under F08; if reuse is chosen, the existing version's timestamp remains unchanged. **Deferred — F10 / B05–B08:** define later-check timestamps and any execution-history storage after scheduler outcome, retry, and recovery rules are agreed; the timestamp decision adds no fields for them.

### 8.4 `contentHash` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | A backend-computed fingerprint of the snapshot's acquired raw content, supporting content-change checks and possible version reuse. |
| Table | `source_content_versions` |
| API name | `contentHash` |
| Database column | `content_hash` |
| PostgreSQL type | `text` |
| Format | A SHA-256 digest encoded as exactly 64 lowercase hexadecimal characters, without a prefix. |
| Nullability | Not nullable. |
| Default | None; the backend computes it from the snapshot content before storing a content-version record. |
| Assignment | For a snapshot consisting of one downloaded or imported artifact, hash its raw file bytes. For example, a GTFS ZIP snapshot uses the ZIP bytes. Multi-resource snapshot representation remains deferred below. |
| Uniqueness | No uniqueness constraint at this stage; different sources may contain identical bytes. Any source-scoped uniqueness constraint awaits the version-creation/reuse policy. |
| Update behavior | Immutable after creation. Reparsing the retained raw content does not change this value. |

For change detection, compare fingerprints within the same source and acquisition scope using the same fingerprint rules. The fingerprint is computed by ClockFace rather than copied from an upstream version label or HTTP ETag. It does not replace the UUID primary key.

This is a fingerprint of raw content. Repacking a ZIP can change its bytes and fingerprint even when the contained timetable data is semantically unchanged. Semantic equivalence of parsed timetables is a separate processing concern and is not established by this field.

**Deferred — F08:** define a deterministic representation for snapshots containing multiple files or HTTP responses, including resource identity and ordering, after the acquisition scope/completeness and raw-content storage contracts are agreed. At that review, also agree how fingerprint-rule changes will be tracked before implementing comparisons across such changes; no additional fields are approved here. Decide whether matching content reuses a version, how to handle content that returns to a previously observed state, and any resulting unique constraint after those fingerprint rules are defined. The field decision alone does not approve a deduplication policy.

### 8.5 `storageKey` — confirmed

Retain the raw snapshot content in backend-managed local file storage and store its relative key in PostgreSQL. Both Docker and no-Docker deployments use this model; the confirmed storage direction is recorded in [backend specification section 4](CLOCKFACE_BACKEND_SPEC.md#4-raw-snapshot-storage).

| Property | Agreed definition |
| --- | --- |
| Meaning | A stable key locating the retained raw content for this version within the backend's configured storage root. |
| Table | `source_content_versions` |
| API/model name | `storageKey`; backend metadata, with API exposure deferred below. |
| Database column | `storage_key` |
| PostgreSQL type | `text` |
| Nullability and content | Not nullable; a nonempty relative storage key. |
| Default | None; assigned by the backend when storing the snapshot. |
| Format boundary | Relative to the configured storage root; no absolute path, parent-directory traversal, upstream URL, or temporary download URL. |
| Uniqueness | Unique within `source_content_versions`; each version has its own logical storage key. |
| Update behavior | Immutable after creation; the content addressed by the key must not be replaced with different content. The physical storage root can be relocated while preserving keys and their contents. |
| Example | `source-content/<sourceContentVersionId>/snapshot.zip` for a retained GTFS ZIP; this illustrates the relative-key model without fixing the final directory layout. |

**Deferred — F08:** finalize key generation/validation, multi-resource snapshot packaging or manifest format, and storage/database write consistency and recovery when reviewing the acquisition and storage lifecycle, before implementation. Finalize backup/restore and retention cleanup after the lifecycle and downstream references are defined. This field does not select indefinite retention. **Deferred — F08:** determine whether an administration API exposes the key after API access contracts are defined; it is not implicitly a public frontend property or download URL. Additional storage backends remain deferred until a concrete deployment requirement is reviewed.

### 8.6 Size statistics — resolver responsibility confirmed; field proposal withdrawn

Do not add `contentSizeBytes` / `content_size_bytes` to `source_content_versions`. The project owner chose to have each backend resolver provide a size-statistics method, allowing accounting to reflect the structure of the content it handles. The earlier column proposal and its type, constraints, and API representation are withdrawn.

The confirmed responsibility is described in [backend specification section 5](CLOCKFACE_BACKEND_SPEC.md#5-resolver-provided-size-statistics). This decision adds no replacement database field or statistics table.

**Deferred — F15:** agree the method name/signature, metrics and units, counting scope for each format, result representation, unavailable/error handling, and invocation/caching policy during the resolver-interface review, after snapshot acquisition/storage representations are agreed and before implementation. Any later proposal to persist these statistics must return to field-by-field agreement.

## 9. Source parse run

A SourceParseRun identifies each execution of the backend adapter/resolver against one retained source-content version. The confirmed table is `source_parse_runs`. A single content version can be parsed repeatedly, for example after fixing resolver code without downloading different source content. Each execution has a distinct run identity; success or failure remains attributable to that execution.

This is an execution-record entity, with fields reviewed individually. The entity, table name, fields through adapter identity (sections 9.1–9.3), execution status/start/end timestamps (sections 9.5–9.7), the log-file reference (section 9.8), and the normalized JSON-output reference (section 9.9) are confirmed. Other fields remain undecided unless explicitly marked confirmed. These decisions add no fields to `source_content_versions`.

### 9.1 `sourceParseRunId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | Identifier for one execution of parsing, validation, and normalization against a source-content snapshot. |
| Table | `source_parse_runs`; one row per execution. |
| API name | `sourceParseRunId` |
| Database column | `source_parse_run_id` |
| PostgreSQL type | `uuid` |
| Nullability | Not nullable. |
| Key role | Primary key, globally unique within ClockFace. |
| Assignment/default | Automatically generated by the backend when creating the run record; no integrator-supplied identifier is required. |
| Update behavior | The identifier is immutable. A new execution receives a new identifier, including a retry after failure or a reparse of unchanged content. |

For example, retaining the same GTFS ZIP preserves its content-version identity. Parsing it again after a resolver fix creates a new parse-run identity. The run identifier does not itself select the resolver code revision or establish which results are published to clients.

The content-version foreign key and adapter identity are confirmed in sections 9.2–9.3; code provenance in logs is confirmed in section 9.4. Run status is confirmed in section 9.5. The start timestamp is confirmed in section 9.6. The completion timestamp is confirmed in section 9.7. The log-file reference `logStorageKey` is confirmed in section 9.8. The normalized-output reference `outputStorageKey` is confirmed in section 9.9. **Deferred — F08:** agree build metadata generation and execution binding during build/release and execution lifecycle reviews, followed by any parsing configuration references, further diagnostics, and output lifecycle rules as resolver and execution lifecycle contracts are reviewed. Publication selection and output retention await the processing/publication and downstream-reference contracts. No corresponding additional fields, keys, indexes, or status values are approved by the run-identifier decision.

### 9.2 `sourceContentVersionId` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | The retained source-content version used as input to this parsing execution. Each run refers to exactly one content version; a content version may have multiple runs. |
| Table | `source_parse_runs` |
| API name | `sourceContentVersionId` |
| Database column | `source_content_version_id` |
| PostgreSQL type | `uuid`, matching the referenced content-version primary key. |
| Nullability | Not nullable. |
| Default | None. |
| Assignment | The backend supplies the existing input content-version identifier when creating the run record. |
| Foreign key | References `source_content_versions.source_content_version_id`. |
| Uniqueness | Not unique; repeated parsing and retries may refer to the same content version. |
| Delete behavior | `ON DELETE RESTRICT`: a content-version record referenced by any retained parse run cannot be deleted. Removing a snapshot record must not cascade into removal of execution history. |
| Update behavior | Immutable after creation; an existing run cannot be reassigned to a different input snapshot. |

This is a direct one-to-many relationship. The source can be traced through the referenced content-version record; no additional association table or repeated `source_id` field is proposed here.

**Deferred — F12:** agree the foreign key's `ON UPDATE` action and supporting indexes during the identifier-update and query review, before implementation. **Deferred — F08:** agree retention and cleanup order for parse runs, content-version records, and their raw files after downstream normalized-output and publication references are defined. The database deletion constraint does not by itself control filesystem deletion or establish how long files must be retained.

### 9.3 `adapter` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | The registered adapter/resolver selected for this execution, preserved as historical run metadata. |
| Table | `source_parse_runs` |
| API name | `adapter` |
| Database column | `adapter` |
| PostgreSQL type | `text` |
| Nullability and validation | Not nullable; a nonempty adapter name that resolves in the backend registry when the run is created. |
| Default | None. |
| Assignment | The backend records the selected adapter name from the source configuration when creating the run and uses that recorded selection for the execution. |
| Uniqueness | Not unique; multiple runs may use the same adapter. |
| Foreign key | None; adapter names are registered in code, with no Adapter table introduced. |
| Update behavior | Immutable after creation. Later changes to `sources.adapter` or the registry do not rewrite existing run metadata. |
| Example | `gtfs-static`, using the same adapter naming vocabulary as `sources.adapter`. |

The Source field records the current configured selection; this run field records the selection for a particular execution. For example, changing a source's adapter after an earlier run must not make that earlier run appear to have used the new adapter. Historical records remain readable even if their adapter name is no longer registered in a later backend deployment.

This field identifies the adapter by name only. Code provenance in execution logs is confirmed in section 9.4, without an adapter-version column. **Deferred — F08:** agree behavior for configuration or deployment changes between run creation and execution during the run lifecycle review, before implementing execution; a worker must not silently substitute a different adapter while retaining the recorded name. No replay/override policy is approved by the adapter-name decision.

### 9.4 Code provenance in logs — confirmed; `adapterVersion` proposal withdrawn

Omit `adapterVersion` / `adapter_version` from `source_parse_runs`. Record the actual executing build's Git commit together with `sourceParseRunId` in retained execution logs. Obtain the commit from metadata embedded in the running build, rather than inferring it from timestamps or reading the current checkout's HEAD after the process has started. Commit and parse timestamps alone cannot establish which revision was deployed and executing.

The logged commit identifies the backend build's source revision, not an adapter-specific version or a change to its behavior. Different commits can contain the same adapter implementation. A commit change alone does not trigger reparsing. For diagnosis, inspect relevant adapter, shared-code, and dependency differences between the recorded revisions. See [backend specification section 6](CLOCKFACE_BACKEND_SPEC.md#6-parse-run-code-provenance).

**Deferred — F08:** define build-metadata injection for Docker and no-Docker deployments, handling of local uncommitted builds, and execution binding during the build/release and run lifecycle reviews. Define log format, retrieval, and retention during the logging review before implementation. Dependency/configuration provenance awaits the build and resolver contract reviews; this decision is not a full reproducibility guarantee. If automatic reprocessing after adapter changes becomes a requirement, agree change detection and the reparse policy after resolver dependencies and build contracts are defined. Revisit database provenance storage only when a concrete query or retention requirement emerges. No replacement column or deployment table is approved.

### 9.5 `status` — confirmed

Create the run record when parsing execution actually begins. If `status` is omitted on insertion, it automatically takes the default value `running`.

| Property | Agreed definition |
| --- | --- |
| Meaning | The execution state of this parse run. |
| Table | `source_parse_runs` |
| API / database name | `status` |
| PostgreSQL type | `text`, constrained to the values below. |
| Nullability | Not nullable. |
| Allowed values | `running`, `succeeded`, `failed`. |
| Default | `running`; create the run record when execution begins. |
| Assignment | The backend updates the state according to the execution outcome. |
| Uniqueness | Not unique. |
| Update behavior | `running` transitions to `succeeded` or `failed`. Terminal states do not transition back to `running`; retrying creates a new run record. |

`succeeded` means the execution met the resolver's success criteria for parsing, validation, and normalization; it does not mean its output has been published or that all possible data capabilities are available. `failed` means the execution did not complete successfully. Detailed success/partial-data criteria remain deferred under F13 until the resolver contract is reviewed.

**Deferred — F08/F10:** define interruption, crash detection, and reconciliation of abandoned `running` records at the execution recovery review, before implementation. This decision does not introduce a queue or approve additional queue/cancellation states; revisit those only when the execution lifecycle requires them. The start timestamp is confirmed in section 9.6; the completion timestamp is confirmed in section 9.7. The log-file reference `logStorageKey` is confirmed in section 9.8. Further diagnostics remain deferred to the resolver diagnostics/logging review.

### 9.6 `startedAt` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | The instant when the backend begins this parsing execution against the retained source-content snapshot. |
| Table | `source_parse_runs` |
| API name | `startedAt` |
| Database column | `started_at` |
| PostgreSQL type | `timestamptz` |
| API representation | An RFC 3339 timestamp serialized in UTC with a `Z` suffix, for example `2026-09-21T08:15:30Z`. |
| Nullability | Not nullable. |
| Default | No database default; the backend automatically captures and explicitly supplies the actual execution-start instant when creating the run record. |
| Assignment | Supplied by the executing backend, not by the source publisher or integrator. |
| Uniqueness | Not unique; multiple executions can have the same start timestamp. |
| Update behavior | Immutable after creation. A retry creates another run with its own start timestamp. |

This timestamp records execution history. It is independent of source-content acquisition time, any queue submission time, the timetable's service date, and data publication time. The chosen execution-start boundary follows section 9.5: create the record as the backend begins the run, with `status` initialized to `running`.

The completion timestamp and its cross-field rules are confirmed in section 9.7. **Deferred — F08:** define how interrupted runs are reconciled during the execution recovery review before implementation; the start timestamp alone does not establish whether a worker is still running. No elapsed-duration column, timeout, or heartbeat field is approved by the start-timestamp decision.

### 9.7 `finishedAt` — confirmed

| Property | Agreed definition |
| --- | --- |
| Meaning | The known instant when this parsing execution ended, whether successfully or with failure. |
| Table | `source_parse_runs` |
| API name | `finishedAt` |
| Database column | `finished_at` |
| PostgreSQL type | `timestamptz` |
| API representation | An RFC 3339 timestamp serialized in UTC with a `Z` suffix, or `null`. |
| Nullability | Nullable; the execution has not ended or its actual end time is unknown. |
| Default | `NULL`. |
| Assignment | The backend captures and supplies the completion instant when it observes the execution ending. Ordinary success and caught failures both record it. |
| Status consistency | `running` requires `NULL`; `succeeded` requires a non-null value; `failed` records the known failure-completion time, or permits `NULL` when the actual end time cannot be established. |
| Temporal validation | When present, must be greater than or equal to `startedAt`. |
| Uniqueness | Not unique. |
| Update behavior | Populate a missing value when the end instant is known; once populated, do not change it. Retries use separate run records. |

For an observed completion, update the terminal `status` and `finishedAt` together so the stored state remains consistent. This field records parsing completion, not publication time. Do not add an elapsed-duration column by implication.

For an abandoned run discovered after a crash, the detection time must not be presented as the actual execution-end time. A failed run with an unknown end time may retain `NULL`; therefore `finishedAt = NULL` alone does not prove that a run is still running. **Deferred — F08/F10:** determine how to establish abandonment, mark the run failed, and recover trustworthy timing evidence during the execution recovery review, before implementation. The log-file reference `logStorageKey` is confirmed in section 9.8. Other diagnostics and any operational detection timestamps require their own field/logging agreement; none are added by the completion-timestamp decision.

### 9.8 `logStorageKey` — confirmed; `errorSummary` proposal withdrawn

**Confirmed direction:** retain detailed parse-run logs as physical files and store a reference on the execution record for troubleshooting. Withdraw the `errorSummary` / `error_summary` proposal, including its proposed constraints; it was not confirmed. The replacement field below is confirmed. This decision does not introduce a separate logs table.

| Property | Agreed definition |
| --- | --- |
| Meaning | A stable relative key locating this execution's detailed log file within the backend's configured persistent log storage root. |
| Table | `source_parse_runs` |
| API/model name | `logStorageKey`; backend metadata, with API exposure deferred below. |
| Database column | `log_storage_key` |
| PostgreSQL type | `text` |
| Nullability and content | Nullable; `NULL` means no log file has yet been bound to the run. If supplied, must be a nonempty relative storage key. |
| Default | `NULL`. |
| Assignment | The backend assigns the key when it creates and binds the run's log file; callers do not supply machine paths. |
| Format boundary | Relative to the configured log storage root; no absolute path, parent-directory traversal, or URL. |
| Status consistency | May be populated for `running`, `succeeded`, or `failed` runs; detailed logs are useful for successful runs and warnings as well as failures. |
| Uniqueness | Non-null keys are unique within `source_parse_runs`; each run has its own logical log file. Multiple records may have `NULL`. |
| Update behavior | Populate a missing key when the log file is bound; once assigned, preserve the key. Retries use separate run records and log files. |
| Example | `parse-runs/<sourceParseRunId>.log`; illustrative only, not a finalized directory layout or log format. |

Under this agreement, the backend appends diagnostic events to the file during execution. An assigned key is a locator, not proof that logging has finished or that the file remains available. Keeping the key stable does not make the actively written log file immutable. Logs retain the already-confirmed run identity and actual executing build's Git commit (section 9.4). See [backend specification section 6.1](CLOCKFACE_BACKEND_SPEC.md#61-physical-execution-logs).

**Deferred — F08/F13:** define log format, diagnostic content and redaction, key generation/validation, rotation/compression, retrieval/access, and retention during the resolver diagnostics/logging review before implementation. Define file/database write consistency, buffering/flush behavior, logging failures, crash recovery, and finalization during the execution/storage lifecycle review. Resolve cleanup and missing-file behavior with retention; this agreement does not guarantee indefinite availability. Finalize persistent directory/volume configuration for Docker and no-Docker deployments during deployment review. Administrative API exposure awaits its access contract. No additional error-code, log-size, logging-status, or diagnostics-table fields are approved by this field decision.

### 9.9 `outputStorageKey` — confirmed

This confirmed field connects a parse run to its completed normalized JSON artifacts through an entry manifest. The locator and entry-manifest direction are agreed; the manifest schema and detailed storage lifecycle remain deferred below. No new table is introduced by this field.

| Property | Agreed definition |
| --- | --- |
| Meaning | A stable relative key locating the entry manifest for the normalized JSON artifact set successfully produced by this run. The manifest identifies its files/partitions; its schema remains deferred below. |
| Table | `source_parse_runs` |
| API/model name | `outputStorageKey`; backend metadata, with API exposure deferred below. |
| Database column | `output_storage_key` |
| PostgreSQL type | `text` |
| Nullability and content | Nullable; if supplied, must be a nonempty relative storage key. `NULL` means no completed JSON artifact set is associated with this run. |
| Default | `NULL`. |
| Assignment | The backend supplies the key after producing and validating the artifact set and its entry manifest, when recording successful completion. |
| Format boundary | Relative to the configured normalized-output storage root; no absolute path, parent-directory traversal, or URL. |
| Status consistency | `running` and `failed` require `NULL`. A `succeeded` run that produces normalized JSON artifacts requires a non-null key; a successful run whose output is entirely relational may retain `NULL`. This does not establish success criteria for empty or partially usable inputs. |
| Uniqueness | Non-null keys are unique within `source_parse_runs`; each producing run has its own logical entry manifest. Multiple records may have `NULL`. |
| Update behavior | Assign with the transition to `succeeded` and its `finishedAt`; once assigned, preserve the key and the completed artifacts' contents. A retry/reparse uses a new run and its own logical manifest. |
| Example | `parse-output/<sourceParseRunId>/manifest.json`; illustrative only, not a finalized layout or JSON schema. |

One entry manifest can locate multiple schedule partitions without loading all schedule details into a single document. This key is separate from the raw snapshot's `storageKey` and the run's `logStorageKey`. An output reference denotes completed parsing output, not selection for public serving; publication selection remains to be agreed. Relational topology rows still need their separately reviewed provenance/version relationships, which are not defined by this file reference. `NULL` does not by itself establish execution failure or lack of usable relational output.

Under this agreement, file generation and validation precede the database completion update, which records `status`, `finishedAt`, and `outputStorageKey` together. Files and PostgreSQL do not share an atomic transaction. Partial or orphaned files may remain after failures; their handling requires the lifecycle review below, and they are not presented as completed output by this field.

**Deferred — F08/F13/F16:** agree the entry-manifest schema, JSON schema/versioning, partition/index layout, artifact integrity checks, capability/partial-data success criteria, and source/provider identity mappings after the resolver and normalized-data contracts are reviewed. Define key generation, write ordering/recovery, output retention/cleanup, missing-file behavior, publication references, and consistency with relational topology at the storage/publication lifecycle review before implementation. Agree any physical file reuse/deduplication only after artifact identity and retention are defined; unique logical entry keys do not decide physical partition sharing. Administrative API exposure awaits its access contract. No manifest JSON fields, output hash/size columns, publication identifier, or additional table are approved by this field decision.

### 9.10 First-pass review checkpoint

Eight physical fields are confirmed for `source_parse_runs`: `sourceParseRunId`, `sourceContentVersionId`, `adapter`, `status`, `startedAt`, `finishedAt`, `logStorageKey`, and `outputStorageKey`. No further run field is currently proposed. This checkpoint does not declare the schema complete.

**Deferred — F08/F10/F13/F16:** revisit recovery and any resulting fields when execution/reconciliation behavior is agreed; revisit capabilities, coverage and diagnostics when the resolver contract is agreed; revisit output/publication relationships and cleanup when normalized-data and publication lifecycle contracts are agreed. Any resulting additional field must return to explicit agreement. Publication tables and their identifier proposal remain deferred under the current-stage scope (sections 6.6 and 11); continue the remaining topology review without assuming those tables.

## 10. Table-by-table review inventory — planning candidates, not an approved schema

Inventory date: 2026-09-23. Update this inventory as table/field decisions advance. There are **9 confirmed table names and 31 confirmed physical columns**, including `agencies.names`. The deferred `publications` / `publication_parse_runs` candidates and `publicationId` proposal are not included in these counts; `errorSummary`, `agencies.timezone`, and the `lines` table/SQL-key proposal were withdrawn. Agency fields have reached the first-pass checkpoint in section 12.5. The GTFS-inspired nullable JSON format and the `extras` name, type, and placement are confirmed in section 13. Null/missing/empty conventions are confirmed in section 13.2.1. Station-oriented timetable organization and optional trip relationships are confirmed in section 13.7; backend StrictTime semantics are confirmed in section 13.8. The initial nullable station `trainRun` fields and line frequency unit fields are confirmed in sections 13.9–13.10. Exact outer grouping/naming (section 13.5), remaining standard fields, and unresolved value encodings still require agreement. These JSON decisions add no database columns. None of the confirmed tables should be described as schema-complete while relevant deferred decisions remain open.

### 10.1 Confirmed tables and remaining review

| Table | Confirmed physical columns | Remaining review |
| --- | --- | --- |
| `providers` | 3 | Identifier/name validation and default implementation, locale behavior, API relation shapes (F01–F03/F07). |
| `cities` | 3 | Identifier/name validation and locale behavior; optional administrative metadata only if needed (F01/F03/F11). |
| `provider_cities` | 2 | Foreign-key update actions and query-driven indexes (F12). |
| `sources` | 4 | Acquisition methods/parameters/configuration and scheduling implications; confirm any resulting fields separately (F09/F10). |
| `provider_sources` | 2 | Foreign-key update actions/indexes and any concrete future selection requirement (F12/F14). |
| `source_content_versions` | 5 | Snapshot boundaries, fingerprints/reuse, storage lifecycle and provenance/retention references (F08). |
| `source_parse_runs` | 8 | First-pass fields agreed through `outputStorageKey`; further diagnostics, recovery, output/publication relationships and lifecycle rules remain deferred (F08/F10/F13/F16). |
| `agencies` | 2 | First-pass fields agreed (section 12.5); source provenance, identity mapping, name validation/search and attribute history remain deferred (F01/F03/F06/F08/F16). Agency timezone withdrawn; provider timezone behavior is tracked under F04. |
| `provider_agencies` | 2 | Base association agreed; foreign-key update actions/indexes, membership synchronization and provenance/history remain deferred (F06/F08/F12/F16). |

### 10.2 Proposed remaining main review list

Beyond the nine confirmed tables, the active main list contains **12 logical domain responsibilities for the GTFS-inspired static JSON artifact contract**. These are not twelve required collections or files, and none requires a new database table by default. The earlier unconditional topology-table candidates are now conditional query/projection candidates in section 10.3. The nine confirmed tables still contain 31 agreed physical columns; the JSON direction does not add columns or relax their existing constraints.

| Group | Logical concept | Responsibility to review in the JSON contract |
| --- | --- | --- |
| Topology | Lines/routes | Use GTFS route concepts as the starting point; detailed identifier and field mapping remains open. |
| Topology | Stations | Station/stop-place identity and metadata, informed by GTFS stop concepts. |
| Topology | Platforms | Boarding locations and station relationships, informed by GTFS stop concepts. |
| Topology | Line–station relationships | Preserve supplied membership without inventing ordered trips or complete topology. |
| Topology | Service patterns | Directions, branches, and service variants; exact representation remains deferred. |
| Topology | Pattern stops | Ordered stops, including repeated visits; exact representation remains deferred. |
| Schedule | Service calendars | Planned recurring service rules and dates. |
| Schedule | Calendar exceptions | Date-specific changes. |
| Schedule | Trips | Planned trips/templates and source identity when available. |
| Schedule | Stop events | Planned arrivals/departures, including records without trip IDs; preserve StrictTime semantics. |
| Schedule | Frequency rules | Headway-based service without fabricating exact trips. |
| Schedule | Service windows | Partial first/last-service information without claiming a complete timetable. |

**Confirmed — F16:** use GTFS Schedule as the JSON blueprint, permit null in every domain field and entire data collection, and provide a map/record-like extension object for data outside that model. Section 13 records the confirmed `extras` and null/missing/empty definitions; top-level grouping and naming are proposed in section 13.5. GTFS required/conditionally-required files, primary-key rules, and field-presence requirements are not inherited as mandatory ClockFace payload constraints.

**Deferred — F04/F06/F13/F16:** agree exact collection/field mappings, non-null value types, ID/reference semantics, precision representation, query indexes, partitioning, and capability reporting before implementation. This is a blueprint, not a commitment to implement every GTFS component or reproduce each former SQL candidate as a JSON array. For populated identities, existing provider/source scoping applies until separately revised; the unapproved globally unique line-ID proposal is not carried over. The confirmed global `agencies.agency_id` database primary key remains unchanged.

### 10.3 Conditional table candidates, excluded from the main count

| Candidate table name | Decide whether it is needed after / at |
| --- | --- |
| `source_fetch_runs` | Acquisition/check outcome review: determine whether execution logs are sufficient or database query/recovery requirements justify retained attempt records (F08/F10). |
| `source_refresh_state` | Scheduler persistence review after B01–B08: determine whether state needs a separate table, existing records, or derivation (F10). |
| `provider_lines` | Only if source sharing returns to scope and a concrete query requires a relational line projection; line JSON storage alone does not require this association (F06/F16). |
| `stations` | Only if concrete station-search/access requirements justify a database projection beyond artifact indexes; define version binding and rebuild behavior before any SQL fields (F16). |
| `platforms` | Only if platform lookup/search requires a database projection; artifact storage alone does not establish that need (F16). |
| `line_stations` | Only if line–station queries justify a relational projection; membership can be represented in artifacts without this table (F06/F16). |
| `publications` | If concrete serving requirements require coordinated output selection, retained combination history, or whole-combination rollback, resume the responsibility review in section 11 (F08/F16). |
| `publication_parse_runs` | Only if `publications` is retained and run membership is required; review the entire association after both endpoint scopes are agreed (F08/F16). |

**Deferred — F16:** these eight names are only placeholders for alternatives at the listed review points. Do not create them by default. Additional tables require a concrete requirement and explicit discussion. Code provenance and resolver size statistics remain assigned to logs/code, with no tables added for either decision. Completing the field review still leaves the explicitly deferred API, resolver, scheduling, storage, and deployment behavior reviews before implementation.

### 10.4 Hybrid storage responsibilities — confirmed

The project owner reaffirmed that ClockFace stores static data and is read-heavy, and accepted the storage division. The confirmed responsibilities and remaining design work are described in [backend specification section 7](CLOCKFACE_BACKEND_SPEC.md#7-normalized-data-storage--confirmed-hybrid-direction).

- Keep the nine agreed table identities and their confirmed fields (currently 31 columns). Their remaining decisions are still open.
- The latest confirmed refinement places parsed static topology and schedule data in GTFS-inspired nullable JSON artifacts (section 13). Database search/projection tables are conditional on concrete queries. Keep the already confirmed configuration/metadata tables and their constraints; do not create full relational copies of artifact data by default.
- Use versioned JSON artifacts for the static domain concepts in section 10.2. Validation must permit null domain fields and partial data; populated values and usable relationships still follow their reviewed contracts. Preserve incomplete schedules without manufacturing a complete GTFS dataset.
- Review `service_patterns` and `service_pattern_stops` for artifact representation alongside schedules, retaining only any relational indexes justified by topology queries.
- Keep normalized artifacts separate from the already agreed raw-source snapshot storage. The parse-run artifact locator is separately confirmed in section 9.9; publication fields still require agreement.

**Deferred — F16:** agree artifact schema/versioning, query indexes and partitioning, source/provider identity mappings, calendar and StrictTime encoding, bounded loading/caching, validation and publication consistency, and retention/recovery before implementation. Use representative provider feeds and the existing station/date and trip-path API needs to evaluate partitioning and memory/load costs; no performance guarantee or shard layout is selected now. Section 10.2 reflects the revised database-candidate versus JSON-contract inventory; remaining physical table counts still depend on their individual reviews. JSON fields follow the same discussion-and-agreement process as database fields. Do not introduce realtime storage or an unrequested realtime cache into ClockFace's scope.

## 11. Publication — deferred entity/table candidate

Status: **Deferred — F08/F16.** The `publications` and `publication_parse_runs` table candidates are not required by the current-stage assumption in section 6.6 and remain outside the active field review. No publication table or field has been confirmed. The earlier `publicationId` proposal is retained below solely as an unapproved proposal to revisit if needed.

A parse run already identifies one execution and its completed output. A second table that only repeats that run's ID, output key, and execution metadata has no established separate responsibility. The possible independent role of a publication is to identify a retained combination of outputs selected together for serving, with any required history or whole-combination rollback. Such a combination could reference existing outputs without copying their files or execution logs.

The latest scope assumes one provider per source and excludes cross-source overlap. It does not assume one source per provider, nor does it select independent source activation or prove that complementary sources never need coordination. Multiple sources alone also do not establish the need for a publication table.

**Deferred — F08/F16:** first review how completed outputs are selected for serving, and how relational topology and JSON artifacts stay consistent, when concrete source/query relationships are defined. Resume publication-table design only if that review establishes a requirement for coordinated selection, retained combination history, or whole-combination rollback. If such a requirement is absent, do not introduce these tables. Any simpler active-run reference, automatic activation policy, or replacement field requires its own agreement. This deferral does not approve a serving implementation.

### 11.1 `publicationId` — deferred proposal, not confirmed

| Property | Proposal |
| --- | --- |
| Meaning | Identifier of one assembled version of normalized data prepared for serving clients. It does not mean that the version is currently active. |
| Table | `publications`; the entity and physical table name are part of this proposal. |
| API/model name | `publicationId`. |
| Database column | `publication_id` |
| PostgreSQL type | `uuid` |
| Nullability | Not nullable. |
| Key role | Primary key; globally unique within ClockFace. No additional surrogate `id` is proposed. |
| Assignment/default | Automatically generated by the backend when creating the publication record; no caller-supplied identifier is required. This does not select a UUID version or database-side generation function. |
| Update behavior | Immutable. A newly assembled data version receives a new identifier; an existing publication's identifier is not reassigned to different data. Selecting an already retained publication again preserves its identifier. |

Parsing success alone does not make a publication active. This identity field adds no status, timestamps, provider reference, validity boundaries, current-version pointer, or parse-run foreign key by implication. It does not establish that every parse run must produce a new publication or decide reuse when normalized content is unchanged.

**Deferred — F08/F16:** first establish the concrete serving requirement described above; if the publication entity is retained, resume this identifier proposal and then discuss publication scope/provider relationship before proposing the corresponding reference field. Define publication lifecycle, assembly/validation boundaries, activation and rollback/reselection, unchanged-output reuse, topology versioning and JSON-output bindings, and retention/cleanup during the publication/storage review before implementation. Review publication-to-parse-run association fields and all primary/foreign-key actions together after both endpoint scopes are agreed. Coverage/validity fields await calendar and resolver contracts (F04/F13); present paired boundaries together when proposed. API exposure and UUID serialization/generation details await API and identifier implementation reviews. All additional tables and fields require explicit agreement.

## 12. Agency

The confirmed table `agencies` stores normalized operating-agency identities. The roadmap distinguishes a provider, which is the application's selectable service/data grouping, from the agencies responsible for its represented services. The owner confirmed a globally unique `agencyId` as the sole primary key and a many-to-many Provider–Agency relationship through `provider_agencies`. These decisions replace the earlier unconfirmed provider-local agency identity and composite-key proposal.

Do not add `provider_id` to `agencies` as an ownership field or key component. Provider membership uses the association in section 12.2: a provider can include multiple agencies, and an agency can belong to multiple provider profiles. This does not change the current-stage source/provider assumption or authorize cross-source identity matching, deduplication, or merging. Agency names are confirmed in section 12.3; the agency timezone proposal is withdrawn in section 12.4 because schedules use the associated provider timezone. Source provenance and other fields still require agreement. No publication table is assumed.

### 12.1 `agencyId` — confirmed

The full revised field definition is confirmed, including global uniqueness and the single-column primary key.

| Property | Agreed definition |
| --- | --- |
| Meaning | Stable normalized identifier of an operating-agency record in ClockFace. |
| Table | `agencies`. |
| API name | `agencyId` |
| Database column | `agency_id` |
| PostgreSQL type | `text` |
| Nullability and content | Not nullable; must not be empty or whitespace-only. |
| Default | None; no database-generated value. |
| Assignment | The backend resolver/identity-mapping logic supplies the normalized identifier from the source's agency identity. Repeated imports of the same mapped agency reuse it. |
| Uniqueness | Globally unique within ClockFace. Different agency records must not share an identifier, including across providers and sources. |
| Key role | Sole primary key `agency_id`; no provider component. |
| Update behavior | Stable across reimports and changes to display names. A new content version or parse run does not by itself create a new agency identity. |
| Additional identifier | No additional surrogate UUID or separate `id` column. |

The normalized ID is distinct from an upstream agency ID. Different sources may reuse a raw ID string without describing the same institution; the mapping must prevent global collisions. For example, `source-a:operator-1` illustrates a normalized ID without prescribing its separator, grammar, or encoding algorithm. Global uniqueness is not an automatic real-world entity-resolution guarantee. Reusing one agency record across provider memberships does not require duplicating that record or giving it a second ID. How such memberships are populated remains to be agreed; automatic cross-source recognition remains out of scope.

**Deferred — F01/F06:** define identifier grammar, maximum length, globally collision-safe mapping/encoding, handling of missing or changed source IDs, and explicit identity remapping at the identifier/resolver contract review before implementation. Original source IDs and their source context require separately reviewed provenance fields. **Deferred — F08/F16:** define agency-attribute history, linkage to parsed outputs, serving selection, and retention during the topology/serving lifecycle review. A stable global ID alone does not authorize overwriting attributes required by retained schedules or add a history table. Names are confirmed in section 12.3. The agency timezone proposal is withdrawn in section 12.4; timestamps and all other entity columns remain unconfirmed.

### 12.2 Provider–Agency association — confirmed

The confirmed many-to-many relationship is implemented by `provider_agencies`. This stores membership only; agency attributes belong to `agencies`. The current one-provider-per-source assumption concerns source usage, not the maximum number of provider profiles that can reference an agency record. Supporting this association does not bring automatic cross-source matching back into scope.

| Item | Agreed definition |
| --- | --- |
| Table | `provider_agencies` |
| Provider column | `provider_id text NOT NULL`, no default; references `providers.provider_id`. |
| Agency column | `agency_id text NOT NULL`, no default; references `agencies.agency_id`. |
| Assignment | The backend supplies the two existing endpoint identifiers when establishing membership; synchronization/write behavior is deferred below. |
| Primary key | `(provider_id, agency_id)`; a given pair can appear only once. |
| Individual uniqueness | Neither column is individually unique; each endpoint may have multiple associations. |
| Delete actions | `ON DELETE CASCADE` on both foreign keys: deleting an endpoint removes its membership rows, not the opposite endpoint. Other tables' future references have their own delete rules. |
| Extra columns | No extra `id`, UUID, timestamps, or business fields. |
| Membership updates | Add or remove pairs; removing membership does not delete the Provider or Agency entity. |
| Foreign-key update actions | **Deferred — F12:** agree with the stable-identifier/update-policy review before implementation. |
| Supporting indexes | No additional index proposed now; reverse lookup/supporting indexes are **Deferred — F12** until concrete queries are reviewed. |

**Deferred — F06/F08/F16:** agree membership derivation from source results, import/removal synchronization, provenance, and historical/version retention after agency source references and serving-selection contracts are defined. A minimum number of associations per agency/provider is not selected here. API exposure and collection shape await the agency/topology API review. These deferrals do not approve new columns, a new merge mechanism, or any relaxation of the current source scope.

### 12.3 `names` — confirmed

**Confirmed correction:** the project owner may freely specify agency names, translations, and aliases. Withdraw the requirement to extract original names through a resolver or justify them against a source. The complete revised field definition below is confirmed.

| Property | Agreed definition |
| --- | --- |
| Meaning | Localized operating-agency display names and aliases. |
| Table | `agencies` |
| API / database name | `names` |
| PostgreSQL type | `jsonb`, containing an object mapping a language tag or the reserved `undetermined-language` key to a nonempty array of name strings. Use arrays even for a single name. |
| Nullability and content | Not nullable. At least one key with at least one name is required; every name must be nonempty and not whitespace-only. |
| Required languages | No mandatory English or local-language set is required for agencies. Language keys are supplied with the chosen names. The city-specific English/local-language rule is not inherited by this entity. |
| Unknown language | Use `undetermined-language` for a supplied name whose language is unspecified. |
| Default | None. Explicitly supply at least one chosen name; do not automatically substitute `agencyId` or an empty object. |
| Assignment | **Confirmed correction:** names, translations, and aliases may be freely specified. They need not be extracted by a resolver, match upstream wording, or have source evidence. Structural/nonempty-value validation still applies. |
| Display and aliases | The first entry for a language is its primary display name; later entries are aliases available for search. |
| Uniqueness | Names are not unique identifiers; different agency records may share a name. |
| Update behavior | Names and translations may be corrected or added without changing `agencyId`. Applying updates must respect the separately reviewed historical-data/serving lifecycle. |

Illustrative representation:

```json
{
  "en": ["Example Transit Company", "ETC"],
  "zh-Hans": ["示例公共交通公司", "示例公交"]
}
```

The example supplies two languages but does not require either. With only a chosen name of unspecified language, `{"undetermined-language": ["Example Transit"]}` satisfies this definition. There is no automatic identifier fallback; the freedom to choose a name does not depend on its presence in source data. Store the names in this field without introducing a translations table.

**Deferred — F03:** agree language-tag validation/canonicalization, display fallback, alias search normalization, and duplicate-name handling during the localized API/search review before implementation. **Deferred — F06/F13:** agree the name configuration/write workflow and how missing required name values affect creation/import during the integration contract review; this field decision does not independently decide whole-run versus partial-data failure. **Deferred — F08/F16:** agree preservation of configured names through data refreshes and name changes for retained outputs during the agency import/serving lifecycle review. The withdrawn resolver-extraction/source-evidence requirement is not deferred for later enforcement. No `localLanguages`, abbreviation, or name-provenance column is added by implication.

### 12.4 Provider-owned schedule timezone — confirmed; agency field withdrawn

Do not add `timezone` to `agencies`. The project owner explicitly requires all ClockFace timetables to be interpreted using `providers.timezone`. Withdraw the agency field proposal and all of its proposed nullability, default, assignment, and source-first fallback rules. This is a resolved responsibility decision, not a deferred agency column.

The existing provider field now supplies both the authoritative schedule-interpretation timezone and the default display timezone, as recorded in section 2.3. A source's declared timezone or an agency's identity does not select a different interpretation timezone. The current one-provider-per-source assumption supplies the provider context; the many-to-many Provider–Agency relationship does not add an agency timezone or a timezone to the association.

**Deferred — F04/F08/F16:** define execution/provider binding and configuration capture, in-flight configuration changes, reprocessing after provider-timezone changes, and preservation of retained results during the resolver/execution and artifact/serving lifecycle reviews before implementation. Extended-hour, calendar, and daylight-saving behavior must use the confirmed provider timezone and remains part of those reviews and B01–B08. No new provider-reference, resolved-timezone, history, or service-day field is approved by removing this proposal.

### 12.5 First-pass review checkpoint

The confirmed physical fields of `agencies` are `agencyId` and `names`. Provider membership is stored in the confirmed `provider_agencies` association. The timezone field was withdrawn; all timetables use their provider's timezone. No further agency field is currently proposed, and no website/contact/timestamp field is introduced just to complete a conventional agency record.

**Deferred — F01/F03/F06/F08/F16:** review original source identifiers and their mapping/provenance representation with the resolver identity contract, name validation/search with the localized API contract, and membership/attribute history and retained-output consistency with the import/serving lifecycle. This checkpoint does not waive source provenance or declare the schema complete. If those reviews require more physical fields or a mapping table, discuss them explicitly before implementation; do not infer one fixed source reference on a potentially shared agency record. Continue with the GTFS-inspired nullable artifact contract below before choosing detailed JSON identifier representations.

## 13. Static JSON artifacts — GTFS-inspired nullable blueprint confirmed

**Confirmed — F16:** use GTFS Schedule (GTFS-static) as the blueprint for normalized static JSON output, aligning topology as closely as possible with its existing concepts. Station timetables use the owner-specified `trainRun` direction in section 13.9. The all-nullable domain policy and map/record-like extension remain confirmed, including the `trainRun` time and first/last fields. Frequency information belongs to line data as recorded in section 13.10. Do not invent missing information.

The [official GTFS Schedule reference](https://gtfs.org/documentation/schedule/reference/) defines files such as `routes.txt`, `stops.txt`, `trips.txt`, and `stop_times.txt`, with required and conditionally-required presence rules. ClockFace borrows domain organization and applicable field meanings, not those presence requirements or the CSV/ZIP interchange format. The result is a ClockFace JSON format inspired by GTFS, not a claim that every output is a conforming GTFS feed. The exact source-schema subset/revision and JSON field spellings/types remain subject to agreement.

Line and other parsed topology/schedule data belong in the versioned artifact set located through `source_parse_runs.outputStorageKey`. The `lines` SQL table/key proposal remains withdrawn. Optional database projections require concrete queries and separate agreement; the nine already confirmed metadata/configuration tables remain in PostgreSQL with their existing nullability and keys. A nullable GTFS-like agency record in the artifact is distinct from the confirmed `agencies` configuration row and cannot silently overwrite its manually specified names.

### 13.1 Blueprint and semantic boundaries — confirmed

- Map available data to corresponding GTFS Schedule concepts where the meanings fit; do not force unrelated local data into a superficially similar standard field.
- Missing collections and fields are permitted, including data that GTFS requires. Do not invent agencies, routes, trips, IDs, calendars, stop sequences, coordinates, or times to make an incomplete input look complete.
- Keep available data outside the common model in the custom extension object. The `extras` name, value representation, and dataset/record placement are confirmed in section 13.3.
- Preserve ClockFace's existing time-precision and partial-coverage semantics. Borrowing a GTFS time field does not authorize adding unsupported seconds, treating a frequency as an exact trip, or presenting first/last service as a full timetable.
- Interpret all schedules using the associated `providers.timezone`, as already confirmed. Borrowing GTFS organization does not reinstate source/agency timezone precedence.
- The user authorizes this common blueprint and its nullability/extension rules, not an automatically generated exhaustive schema. Detailed standard and custom contracts continue through field-by-field agreement, with paired time boundaries and association structures reviewed together where applicable.

### 13.2 Nullable domain data — confirmed principle and missing/empty conventions

Every domain field is nullable, including IDs/references, names, positions, sequence numbers, dates, times, enums, booleans, and values inside standard nested objects. An entire collection such as routes, stops, trips, or stop times may also be null. No ID or supposedly essential GTFS field is exempt. A payload with only useful custom content and null standard collections is permissible at the representation level. Do not reject a ClockFace payload solely because standard fields are absent/null or a complete GTFS dataset cannot be constructed from it.

Nullability does not turn non-null values into arbitrary types or imply that every retained record supports every API operation. Preserve supplied information, avoid treating null IDs as one shared entity or a valid join target, and expose only capabilities justified by available values/relationships. A missing trip ID does not require discarding an otherwise useful departure time. Detailed unresolved-reference handling and capability criteria remain deferred below; these must not reintroduce globally mandatory GTFS fields. An all-null representation is not proof of useful output or parsing success.

The rule applies to normalized static domain data. It does not relax the confirmed database primary keys/required fields or automatically add required manifest/transport metadata. The manifest's detailed schema is still unapproved. Do not silently apply GTFS default enum values to null data or replace null with an empty string, zero, or false.

**Confirmed — F13/F16:** missing-key, explicit-null, and empty-collection semantics are defined below. **Deferred — F13/F16:** agree array-element handling, non-null value validation, unresolved references, and capability-specific serving behavior during the JSON/resolver/API contract review before implementation.

#### 13.2.1 Null, missing, and empty values — confirmed

Apply the following conventions to standard domain fields/collections and the `extras` container itself. They do not reinterpret arbitrary custom members inside `extras`, change database defaults/nullability, or select manifest metadata rules.

| Representation | Agreed meaning and behavior |
| --- | --- |
| Explicit `null` | The value or collection is unknown, unavailable, or not supplied. It does not assert zero records, no service, false, or zero. |
| Omitted key | Permitted; equivalent to explicit `null` for these domain fields and the `extras` container. Readers accept either, and writers may omit unavailable keys rather than emitting every GTFS-like property as null. No canonical choice between the two encodings is mandated here. |
| Empty collection `[]` | A supplied collection known to contain no entries within its declared scope. Do not use it as a blanket replacement for unavailable data. It does not by itself prove that the whole provider has no service. |
| Empty extension object `extras: {}` | An explicitly supplied extension container with no custom members. Do not automatically substitute it for an unavailable/omitted extension container. |
| Populated scalar values, including `0` and `false` | Preserve according to the individual field's meaning. Do not treat falsy values as missing or insert them as generic defaults for nulls. |
| Empty string `""` | Do not use as a generic encoding for missing data. Whether it is a valid actual value is decided by each field's contract; do not silently convert supplied custom strings. |

For example, `"trips": null` or an absent `trips` key means no trip collection was provided or established; `"trips": []` means the supplied collection is empty for its stated scope. A partial first/last-service source need not fabricate a trip collection. These examples do not approve the complete field list or a new coverage/scope metadata property.

The arbitrary JSON inside `extras` is preserved: omitted custom members, explicit null values, empty arrays/objects, zero, and false may have distinct meanings to their extension's consumer. Do not recursively rewrite that custom content using the standard-field normalization rules. A null ID is never a join key, regardless of which missing-value encoding is used.

**Deferred — F06/F13/F16:** define source-specific conversion of blank cells and sentinel values, diagnostic treatment of invalid values, actual coverage/scope reporting, array-element rules, and any need for canonical byte serialization during resolver/artifact contract review before implementation. This decision selects neither GTFS defaults nor content-hash rules and does not itself determine parse-run success criteria.

### 13.3 `extras` — confirmed

The confirmed extension field is named `extras`, uses a recursive JSON object/record value type, and is available at both the dataset/domain-payload level and individual domain-record level. Do not introduce `others` or `custom` as parallel synonyms.

| Property | Agreed definition |
| --- | --- |
| JSON field name | `extras` |
| Purpose | Preserve locally useful static data without an appropriate agreed GTFS-derived field. |
| Value type | `Record<string, JsonValue> \| null`, where `JsonValue` recursively permits JSON strings, numbers, booleans, null, arrays, and objects. |
| Placement | At the dataset/domain-payload level and on individual domain records, so source-wide and per-route/stop/trip details can remain with their respective data. No automatic extension property on manifest metadata is proposed. |
| Nullability | Nullable like the rest of the payload. Values inside the object may also be null. |
| Keys | Custom string keys and nested objects; no fixed business-key list. Namespaced grouping may be agreed later when multiple extensions need disambiguation. |
| Missing/default representation | When unavailable, the key may be omitted or explicitly `null`; these are equivalent under section 13.2.1. An explicit `{}` means an empty extension container, with no implicit `{}` default. |
| Standard-field relationship | Keep custom values under `extras`; do not flatten or silently override standard siblings or configured provider timezone. |
| Consumption | Preserve unfamiliar JSON members. Consumers may use extensions they understand; storing an extension does not promise automatic generic frontend rendering or interpretation. |

Confirmed extension value vocabulary; this is not an implemented or exhaustive artifact schema:

```ts
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type Extras = Record<string, JsonValue> | null;
```

Use a JSON object/record representation on disk. A JavaScript `Map`, `undefined`, functions, class instances, and non-JSON numeric values are not JSON values; any runtime representation must serialize without silently losing custom data. No fixed keys are imposed inside the custom object by this type.

Illustrative payload fragment using the confirmed extension placement; the other collection/field spellings remain examples, not a fully approved field list:

```json
{
  "routes": [
    {
      "route_id": null,
      "route_short_name": "1",
      "extras": {
        "local": {
          "carriageCount": 6,
          "boardingNote": "示例备注",
          "detail": null
        }
      }
    }
  ],
  "stops": null,
  "trips": null,
  "stop_times": null,
  "extras": null
}
```

**Confirmed — F13/F16:** section 13.2.1 defines the missing/null/empty conventions for the extension container. **Deferred — F06/F13/F16:** review extension discovery/interpretation, applicable local schemas, namespacing/collisions, and compatibility with API consumers as concrete resolver needs emerge, before implementing those contracts. Do not select every custom business key now or infer additional SQL tables from this object.

### 13.4 Remaining artifact and query review — deferred

**In discussion — F16:** section 13.5 proposes top-level grouping, record-array organization, and naming. **Deferred — F04/F06/F08/F13/F16:** agree the exact supported collection/field list, nullable identity/reference semantics, source provenance, time precision representation, schema evolution, partition/index layout, validation outcomes, and selected-provider query paths during the artifact/resolver/API reviews. Query capability depends on available data; full GTFS conformance is not an ingestion precondition. Preserve extended-hour/calendar behavior in the confirmed provider timezone.

**Confirmed — F13/F16:** the frequency-population convention in section 13.6 is documentation-level semantics, not a programmatically enforced condition. Source-backed template trips and their stop times may be retained alongside frequencies; a template does not by itself provide a complete enumeration of concrete departures. **Deferred:** review the detailed representation of service scope and template roles with the frequency/stop-time fields.

Review station/platform/line lookup and search against representative artifact catalogs before adding database projections. If a SQL index is justified, agree its version binding, rebuild/retention behavior, and every field separately. No `stations`, `platforms`, `line_stations`, or replacement line table is required by choosing the GTFS blueprint. Storage/database consistency, selected-output activation, cleanup, historical references, and configuration capture remain deferred to the serving lifecycle review. No performance target, cache service, or single-file packaging is selected here.

### 13.5 Top-level grouping and naming — proposed, not yet confirmed

**Confirmed boundary — F13/F16:** section 13.7 establishes station-oriented timetable organization and independently usable station entries with optional trip relationships. Their known service context must remain usable without a trip. Section 13.9 now specifies station-associated arrays of `trainRun` records and their owner-supplied camelCase field names. Topology should follow GTFS-static as closely as possible. The earlier flat-group/naming proposal below is only a candidate for applicable GTFS-derived data; it does not override station timetable grouping or rename `trainRun` fields. Exact outer containers and topology mappings remain unconfirmed.

Propose a logical dataset object whose tabular data groups follow the corresponding GTFS Schedule file names without the `.txt` suffix. Each group contains an array of records when provided; the entire group may be null or omitted under section 13.2.1. Retain GTFS `snake_case` field spellings for fields adopted from that model. This naming proposal applies to the static domain JSON, not to the already agreed camelCase management API properties.

For applicable GTFS-derived groups, the earlier proposal is to use separate flat record groups rather than nesting every trip and stop event inside its route. The newer station timetable direction in section 13.9 takes precedence for `trainRun` records. Use arrays rather than objects keyed by an ID: nullable or missing IDs must not prevent preservation of a record, collide at a `null` key, or silently overwrite another record. Any indices needed for lookups can be designed separately without making IDs mandatory in the stored data. Array-element validity and duplicate/reference policies remain deferred; this proposal does not silently resolve them.

Illustrative logical shape, not an exhaustive approved collection/field list:

```json
{
  "agency": null,
  "routes": null,
  "stops": null,
  "trips": null,
  "stop_times": null,
  "calendar": null,
  "calendar_dates": null,
  "shapes": null,
  "frequencies": null,
  "extras": null
}
```

The names above illustrate the naming convention and review sequence; they do not limit the blueprint to these groups or require resolvers to fabricate them. Missing groups may be omitted instead of written as null. A populated `routes` group, for example, would be an array of route records; every standard record field remains nullable/omittable and each record can carry the confirmed `extras` object. Entity references, when available, will be reviewed as record fields rather than assumed complete foreign keys.

The `agency` artifact group describes source domain data. It is distinct from the PostgreSQL `agencies` configuration table: its presence, names, and IDs do not silently rewrite configured agency identities or freely specified display names. The provider timezone remains authoritative. Extensions retain arbitrary custom key spelling; the proposed standard naming rule does not recursively rename keys in `extras`.

This is a logical data contract, not a requirement to write or load one large JSON file. The confirmed `outputStorageKey` points to an entry manifest; partitioning, references, index files, and the manifest schema still need review. Single-record tabular groups can follow the same array organization; non-tabular source components need their own representation review rather than being forced into this convention.

**Deferred — F06/F13/F16:** agree the supported GTFS-derived group list and exact record fields in subsequent reviews, under the confirmed independent station-event model in section 13.7, after agreeing this organizational proposal. Preserve field meaning and nullability while separately reviewing non-null types, IDs/references, time precision, and custom mappings. Agree scope/version metadata, non-tabular representations, array-element rules, and physical partitions/indexes at the artifact/resolver/API review before implementation. This proposal adds no SQL fields or tables, no mandatory IDs, no new manifest metadata, and no `schemaVersion` property by implication.

#### 13.5.1 Comparison with GTFS Schedule — clarification and proposed alignment

The proposal follows GTFS's separation of domain records into groups. It does not establish complete GTFS equivalence: JSON replaces its interchange packaging, all ClockFace domain fields/collections permit null or omission, `extras` carries custom content, and the previously agreed provider timezone governs schedule interpretation. The abbreviated example above is not an exhaustive GTFS group list. GTFS defines a dataset interchange format, not ClockFace's database, resolver, parse-run, or deployment architecture.

**Proposed, not yet confirmed:** follow GTFS's existing entity divisions and reference meanings for the standard domain groups we adopt, subject to the explicitly agreed ClockFace differences. For example, GTFS connects trips to routes and service calendars, stop-time records to trips and stops, and frequency records to trips. Do not replace those relationships with a new nested model merely because the storage format is JSON. These examples explain the intended alignment; they do not confirm individual fields, non-null constraints, a full supported group list, or a new identifier policy. Review the exact fields and treatment of incomplete relationships before implementation.

### 13.6 Frequency-population convention and template trips — confirmed

**Confirmed semantic convention:** only populate `frequencies` when `stop_times` is missing or incomplete in its coverage of concrete scheduled departures for the relevant service scope. Retaining template stop times does not by itself establish complete departure coverage. This is an authoring/interpretation convention, not a condition to enforce in program logic. Do not introduce a schema/runtime rejection, automatic removal, or automatic generation solely to enforce this convention. Missing stop times do not by themselves supply frequency information.

**GTFS reference context, not an additional ClockFace decision:** GTFS frequency-based service uses `stop_times` to describe the relative timing of a template trip; the presence of template stop-time records does not imply that every departure has been individually enumerated ([official frequency example](https://gtfs.org/documentation/schedule/examples/frequencies/)). GTFS also supports both headway-based service and compressed exact schedules through `exact_times` ([official frequency reference](https://gtfs.org/documentation/schedule/reference/#frequenciestxt)). Consequently, the two groups can legitimately coexist, and GTFS does not define their presence as mutually exclusive.

**Confirmed:** permit retention of source-backed template trips and their `stop_times` alongside `frequencies`. A template describes a repeatable journey, including its supplied stop sequence and relative arrival/departure timings; it is not counted as an additional independent scheduled departure. The two collections are not mutually exclusive. This permission does not authorize fabricating stop sequences, travel/dwell times, or scheduled departures to fill missing data. If the source supplies only frequency information, preserve that information and leave unsupported template data absent/null under the existing nullable-data policy. A complete template is not mandatory for ClockFace ingestion.

**Deferred — F13/F16:** review how the relevant service scope and template role are represented, how partial records remain useful, and how headway-based versus exact compressed schedules are consumed during the frequency/stop-time field review. This agreement approves neither the individual GTFS frequency fields nor expansion into generated trips. The frequency-population convention remains unenforced in code. Section 13.10 places frequency information in line data and separately requires an error for simultaneous seconds/minutes values; this representation check does not enforce the coverage-based convention. Individual `trainRun` records do not carry frequency fields. The earlier GTFS collection names describe the reference concepts, not a newly required top-level output collection. The broader top-level organization proposal in section 13.5 remains subject to agreement.

### 13.7 Station-oriented timetables and optional trip relationships — confirmed

**Requirement raised by the owner:** some target sources provide static timetable entries for a station without enough information to associate those entries with the same trip at other stations. Preserve and serve those planned times even when no trip can be established. This is consistent with the existing nullable-ID principle in section 13.2 and the roadmap's departure-identity and platform/date query requirements; it does not introduce realtime prediction storage.

**Design issue:** flat versus nested serialization is separate from requiring a trip relationship. GTFS `stop_times` requires a reference to a trip, while route and service-calendar context is carried by that trip ([official stop-time reference](https://gtfs.org/documentation/schedule/reference/#stop_timestxt), [trip reference](https://gtfs.org/documentation/schedule/reference/#tripstxt)). Merely making the reference nullable permits retention of an entry but does not settle how a consumer obtains its known route/direction and date applicability without a trip. ClockFace must review that contextual relationship explicitly rather than assume the GTFS reference chain is sufficient.

**Confirmed:** organize timetables around stations and treat a supplied station arrival/departure record as independently usable static domain data. Preserve its available station/boarding-location, route/direction, time, and service-date/calendar context without requiring a trip as the intermediary. Context may be shared with a timetable group rather than repeated on every record; its exact placement remains deferred and this agreement does not make any domain field mandatory. Keep a trip relationship only where the source establishes it, so complete GTFS inputs can retain their trip structure while station-only inputs remain useful without one. Independently usable station timetable data belongs in the common domain model rather than only in `extras`.

The owner's description of a station as the “primary key” establishes the station as the organization/lookup entry point for a collection of timetable records. One station can have many records across dates, routes, directions, and boarding locations; station identity alone is not a unique key for an individual arrival/departure. This agreement selects neither a new database primary key nor a one-file-per-station layout. **Deferred — F06/F16:** agree station identity scope, any per-record identity or composite uniqueness, duplicate handling, and physical grouping when those fields and artifact partitions are reviewed. Unknown station information remains nullable; do not fabricate a station to make a record queryable.

A missing public train number is not the same as a missing journey association: a source may establish which stop records belong together without publishing a passenger-facing number. Conversely, two station times must not be joined into one trip merely because their difference resembles plausible travel time. Retained template trips (section 13.6) do not establish that independent entries refer to the same concrete departure. No trip synthesis or cross-station matching algorithm is approved by this agreement.

Illustrative requirement, not a field schema: a source lists station A departures at 08:00 and 08:06, and station B departures at 08:04 and 08:10. Those station lists can be useful independently; their apparent four-minute offset alone does not establish two through trips. Missing trip linkage also does not imply that the supplied station departure times are inexact or should be replaced with frequency rules. Timetable coverage and cross-station identity are separate questions.

**Confirmed serving direction:** support station/platform-and-date timetable queries to the extent the source supplies the required context. Offer a trip's ordered stop path only when that relationship is supported. Retain useful partial data without inventing a platform, direction, calendar, arrival/departure distinction, or precision. Preserve extended-hour service times and the confirmed provider timezone. GTFS imports should retain their available trip relationships and other useful source information.

**Confirmed refinement:** section 13.9 records the nullable owner-specified `trainRun` fields and tags; section 13.10 assigns frequency information to line data. **Deferred — F04/F06/F13/F16:** review the exact outer container, remaining presence/value constraints, shared versus per-record context, station/platform and direction mapping, date applicability, any record identity distinct from trip identity, duplicate handling, and GTFS import/query mappings. Review frequency scope, first/last-only information, template representation, and capability criteria with their respective contracts. Physical artifact partitions and indexes follow the agreed queries; neither a new SQL table nor a nested physical file layout is selected here. The station-oriented direction alone adds no database column, required ID, or matching heuristic. The subsequently agreed JSON fields are recorded in sections 13.9–13.10; all other fields remain subject to agreement.

### 13.8 Backend StrictTime contract — confirmed semantics; field encoding deferred

**Confirmed:** the backend must implement and preserve the same `StrictTime` temporal semantics as the frontend. This applies to normalized schedule-time values from adapter/resolver output through persisted JSON artifacts and domain API responses, including independent station arrival/departure records and source-backed trip/template times. It also applies to normalized temporal bounds and validity times where relevant; raw source snapshots keep their original representation. Backend behavior and the semantic baseline are recorded in [backend section 8](CLOCKFACE_BACKEND_SPEC.md#8-backend-stricttime-contract).

Use [roadmap section 7](ROADMAP_SPEC.md#7-stricttime) as the semantic requirement and [the current frontend implementation](../src/domain/strict-time.ts) as an explicit compatibility reference. The roadmap's conceptual union and the current frontend's epoch-based representation are not automatically the final backend artifact schema. Preserve known precision, truncation/underspecification, estimates, bounds, and unresolved interpretation without inventing precision or dates. The provider timezone remains authoritative, and service-day/extended-hour context must survive normalization.

**Deferred — F04/F13/F16:** agree each StrictTime field, tag, non-null type, optional/null behavior, duration/date distinction, and representation of recurring service-relative times versus dated instants before implementing the artifact/API contract. The detailed contract must also settle arithmetic and comparison semantics, mixed-precision values, and the operator-style or explicit API mechanism (backend section 8.4); interval-key encoding and evaluation depend on that review. Review missing or uninterpreted values and consumer capability rules under the existing all-nullable domain policy; missing time is not zero or midnight. Resolve version compatibility, shared type/schema distribution, runtime validation, and conversion with the future independent backend repository's integration contract. This semantic agreement does not add a database column, replace confirmed operational timestamp columns, or make every field in the frontend's current TypeScript union mandatory in ClockFace artifacts.

### 13.9 Station trainRun records — confirmed fields and nullable policy

**Confirmed direction:** align topology (routes, stations, platforms, directions and related metadata) with GTFS-static as closely as possible, retaining source-backed relationships. GTFS's `stops` hierarchy is a reference for station/platform relationships; route and direction/headsign concepts should retain their meanings rather than require trips where ClockFace has none. Exact adopted fields, identifier mappings, and any local extensions remain subject to review. This direction does not adopt GTFS required-field constraints or its trip dependency wholesale.

**Confirmed:** each station has an array of `trainRun` records describing its supplied static service entries. The name does not imply a known full-network trip or cross-station identity. Preserve explicit trip associations where available. The supplied bracket notation is a shape sketch, not a final JSON envelope; the outer property name and physical file layout remain undecided. Keep the owner's camelCase spellings for these record properties. The previously confirmed record-level `extras` remains available. **Confirmed correction:** frequency fields belong to line data (section 13.10), not to `trainRun`.

**Confirmed nullable policy:** all fields below may be null or omitted under section 13.2.1, including both time fields and both first/last flags. The owner's clarification retains this policy despite the absence of `?` on some fields in the original sketch. Unknown flags do not default to false; missing time does not default to zero/midnight or copy the other event's time. Terminal fallback has the explicitly requested semantic default described below; its unresolved/null handling must be settled before implementation.

| JSON field | Non-null value type | Meaning / agreement |
| --- | --- | --- |
| `tripId` | `string` | Optional source-backed trip reference. Absence does not invalidate an otherwise useful station entry or authorize a fabricated trip. Identifier/reference mapping remains deferred. |
| `terminal` | Object with nullable/omittable `stationId: string` and `name: string` | Optional explicit terminal, defined in section 13.13. The default meaning is `topological_end`. A supplied name or station reference takes precedence; an unresolved station reference does not discard the name or trigger fallback. |
| `arrivalTime` | `StrictTime` | The station entry's supplied arrival time, nullable/omittable independently of departure. Missing arrival must not be invented from departure. |
| `departureTime` | `StrictTime` | The station entry's supplied departure time, nullable/omittable independently of arrival. Missing departure must not be invented from arrival. |
| `filterTags` | `string[]` | Optional documented filtering/classification tags, such as `weekdays` or `Y801`. Open vocabulary; no semantic enforcement. |
| `isFirstPassengerTrain` | `boolean` | Marks first passenger service within its applicable scope. Unknown is null/omitted, not false. Exact scope and derivation policy are deferred. |
| `isLastPassengerTrain` | `boolean` | Marks last passenger service within its applicable scope. Unknown is null/omitted, not false. Exact scope and derivation policy are deferred. |

`filterTags` documents meanings rather than enforcing a built-in calendar or operating-diagram taxonomy. `weekdays` may label weekday service and `Y801` may label an operating diagram; neither spelling establishes a mandatory enum, a trip ID, or automatic date applicability. Do not reject unfamiliar tag values because their business meaning is unknown. Generic matching behavior (including AND/OR, case sensitivity and any association with dates) remains deferred until the filtering/query review. Primitive shape validation is distinct from enforcing tag semantics. This decision does not require a separate GTFS calendar object or silently turn tags into a complete date-resolution algorithm.

**Confirmed — F06/F16:** section 13.13 defines a structured `terminal` value with a nullable station reference and supplied name, replacing the scalar type. **In discussion:** section 13.14 proposes how the applicable directed topology selects an unambiguous default endpoint. **Deferred — F04/F06/F13/F16:** review identifier/reference mapping and whether `topological_end` is materialized or resolved at read time. Resolve absent topology, branches, loops, short turns, multiple endpoints, and omitted versus explicit-null terminal handling before implementing fallback. Do not silently pick an arbitrary endpoint or equate a topology endpoint with a source-confirmed run terminal.

**Deferred — F04/F13/F16:** review the first/last flags' scope (station, route/direction, diagram and service day), source evidence and partial-coverage behavior; a fragment's first/last row does not establish the first/last passenger service. Define service-date/calendar applicability and route/direction/platform context without inventing missing data. Preserve StrictTime and extended-hour service-day meaning. No new database table/column, extra record ID, or implicit calendar field is approved here.

### 13.10 Line frequency information — confirmed placement and unit exclusivity

**Confirmed correction:** store frequency information with line/route data, not on each station `trainRun`. `line` here names the domain responsibility; the exact outer collection/property path remains subject to GTFS-aligned topology review. The correction supersedes the earlier sketch that repeated frequency properties on individual records.

| Unit property name | Non-null headway value type | Meaning / agreement |
| --- | --- | --- |
| `frequencyInSeconds` | `number` | Operator-disclosed headway in seconds, used when this reflects the disclosed precision. Stored on a `frequencies` map value object under section 13.11. |
| `frequencyInMinutes` | `number` | Operator-disclosed headway in minutes, used when this reflects the disclosed precision. Stored on a `frequencies` map value object under section 13.11. |

When frequency information is supplied, use exactly one of these two value representations. Retain the operator's disclosed precision and unit rather than automatically converting, rounding, or populating both. Both populated values are an error, even if numerically equivalent after conversion; do not silently select one. Unavailable frequency data remains null/omitted under the all-nullable domain policy; it does not require an invented value. Thus the presence cases are:

| Seconds value | Minutes value | Presence result |
| --- | --- | --- |
| Null/omitted | Null/omitted | Frequency unavailable; retain missing-data semantics. |
| Supplied | Null/omitted | Seconds representation; subject to its later number validation. |
| Null/omitted | Supplied | Minutes representation; subject to its later number validation. |
| Supplied | Supplied | Error; do not accept duplicate unit representations. |

This code-enforced representation rule is separate from the documentation-only convention in section 13.6 about using frequency information when detailed stop-time coverage is absent/incomplete. Neither rule authorizes inferring a headway from adjacent station departures, generating exact trips, or treating a partial station list as complete service.

**Confirmed refinement:** section 13.11 selects option A: `frequencies` is a map keyed by time interval, each value is an object carrying the numeric unit field, and duplicate-unit validation applies within that value. Distinct entries may use different disclosed units. **Deferred — F04/F06/F13/F16:** during line frequency field review, agree how directions/branches, time periods, operating diagrams and service dates apply, and how source GTFS frequency records map without losing their scope. Line-level ownership does not establish one constant headway for the entire line. Do not collapse differing source headways to an arbitrary value. Review frequency anchors/windows, StrictTime use for applicable boundaries, number range/fraction rules, validation error reporting, and unknown/partial scope before implementation. This agreement adds no implicit interval, direction, calendar, or discriminator field and no database columns.

### 13.11 Line frequency interval map — confirmed container and value shape

**Confirmed:** use a map for line-owned frequency information. Each key identifies a time interval; its value is the headway for that interval in the operator-disclosed minutes or seconds. The owner selected a map instead of the previously proposed rule array; that array proposal is withdrawn. Frequency information remains outside individual station `trainRun` records.

For JSON artifacts, the map is represented by an object/record with string keys, rather than serializing a JavaScript Map object directly. The interval string grammar is not yet selected. Map organization does not make source values or interval bounds mandatory, authorize fabricated intervals, or override the backend StrictTime contract.

**Confirmed — option A:** `frequencies` is the line-owned map. Each supplied non-null value is an object using `frequencyInMinutes` or `frequencyInSeconds`, whose headway value remains a number. Apply the duplicate-unit error within a single value object, including when the two values would be equivalent after conversion. Different entries may retain different operator-disclosed units. The alternative of two mutually exclusive unit-named maps is not selected.

The existing nullable/missing-value policy and record-level `extras` remain applicable. There is no implicit conversion, rounding, default headway, or new unit discriminator. A supplied interval does not require inventing a headway where it is unavailable. Null entry and empty-map interpretation remain in the artifact review below.

Illustrative shape; the placeholder keys are not literal accepted time-range encodings:

```json
{
  "frequencies": {
    "<time-interval-A>": { "frequencyInMinutes": 3 },
    "<time-interval-B>": { "frequencyInSeconds": 150 }
  }
}
```

**Confirmed — F04/F13/F16:** section 13.12 establishes inclusive-start/exclusive-end semantics for paired interval boundaries. **Deferred prerequisite:** detailed StrictTime arithmetic, comparison and mixed-precision semantics must be agreed before interval keys or interval evaluation are finalized.

**Deferred — F04/F13/F16:** after the detailed StrictTime contract is agreed, define interval-key grammar and canonicalization under the confirmed inclusion rule in section 13.12. Preserve service-day and extended-hour meaning, and specify how keys preserve or reference StrictTime precision and uncertainty. A convenient string form alone is not approval to collapse unknown, truncated, estimated, or bounded time meanings into exact wall-clock instants. Also agree how to retain a known headway when one or both time boundaries are unavailable; do not invent all-day boundaries, a date, an `unknown`/wildcard key, or midnight to make a map entry fit.

**Deferred — F04/F06/F13/F16:** at the frequency scope/query review, agree direction/branch/diagram/date context, where different contexts with the same interval key live, reference location/time anchoring, empty-map semantics, null entry handling, duplicate/canonical-key collisions, interval overlaps and rule selection. A single map key must not silently overwrite differing source data, and object iteration order does not establish temporal priority. Numeric constraints and validation error reporting remain deferred to value validation. This agreement adds no database fields, implicit scope keys, or final time-boundary schema.

### 13.12 Frequency interval endpoints — confirmed inclusion; StrictTime prerequisite

**Confirmed:** frequency intervals are inclusive at the start and exclusive at the end: `[start, end)`. Start and end are agreed as a pair. For known, comparable boundaries, an exactly shared boundary belongs to the later adjacent interval only. This governs frequency applicability; it does not assert a train departs at that boundary, or add JSON start/end fields or a key delimiter.

**Confirmed requirement:** an interval may have mixed endpoint precision, including a minute-level boundary at one end and a second-level boundary at the other. Preserve the semantics and precision of each endpoint independently. Do not require matching precision, append a zero second as evidence of exactness, truncate a precise endpoint, or claim a definitive comparison that the source does not support.

**Deferred prerequisite — F04/F13/F16:** wait for the detailed StrictTime specification before finalizing interval-key encoding, canonicalization, validity tests, containment or ordering. That specification must include, but is not limited to, the semantics of `+`/`-`, `<`/`<=`/`>`/`>=`, mixed-resolution operands, and the intended operator override/overload or equivalent API mechanism. The current agreement does not select an operator implementation, result type, coercion rule or precision/uncertainty propagation algorithm. See backend section 8.4.

Retain the confirmed provider timezone, service-day association and extended-hour values. A service time such as 24:40 must not silently wrap to 00:40 of the same service day. These requirements do not choose how an interval is encoded into a JSON object key.

**Deferred — F04/F13/F16:** after StrictTime operations are agreed, review interval validity, unknown/open/estimated/bounded endpoints, source-specific boundary conversion, and uncertain event times near a boundary. Reference location, direction/calendar scope, overlaps, duplicate keys and gaps remain deferred to the scope/query review. The confirmed inclusion rule does not imply continuity, complete coverage, priority, or an invented precise boundary. Proceed with independent non-temporal field reviews while this prerequisite remains open.

### 13.13 Terminal identity and supplied name — confirmed

**Confirmed:** `trainRun.terminal` is a nullable/omittable object retaining a station reference, a supplied terminal name, or both. This replaces the previously agreed scalar string type. A supplied name remains useful even when station identity cannot be established; do not synthesize a topology station just to populate the reference.

| JSON member | Non-null type | Agreed meaning |
| --- | --- | --- |
| `stationId` | `string` | Reference to the terminal station in the applicable provider topology when established. Null/omitted when unresolved; exact station-key grammar and mapping remain deferred. |
| `name` | `string` | Supplied terminal name, retained even when the station reference cannot be established. Null/omitted when unavailable. |

Example of an unmatched name:

```json
{
  "terminal": {
    "stationId": null,
    "name": "机场北"
  }
}
```

**Confirmed behavior:** the name can be displayed without claiming a station match. Station-linked behavior requires an established `stationId`. When only a station reference is supplied, its topology metadata can provide the display name. Do not reinterpret an arbitrary name as an identifier or generate an identifier merely to populate the object.

**Confirmed default guard:** an explicit supplied terminal name counts as terminal information even if its station reference is null. It must not be replaced by `topological_end` solely because station lookup failed. A supplied station reference also counts as explicit terminal information. The default meaning applies only when no terminal information is supplied; its resolution and serialization remain subject to the review below. No separate `terminalName` property, new sentinel or discriminator is added.

**In discussion — F06/F13/F16:** section 13.14 proposes the topology scope and ambiguity behavior of default resolution. **Deferred — F04/F06/F13/F16:** review identifier mapping, reference validation, name/display precedence when both members exist, preservation of source text, empty-object/null/omission handling, and default materialization/read-time behavior at the terminal/topology contract review. Resolve topology-version changes and branch/loop/short-turn context before implementation. No fuzzy matching or arbitrary endpoint selection is implied by these confirmed fields.

### 13.14 topological_end fallback scope — proposed, not yet confirmed

The `topological_end` default meaning and explicit-terminal guard are already confirmed. **Proposal:** when no terminal information is supplied, resolve the default against the entry's applicable directed route/path. Use known line, direction and, when necessary, branch/service-pattern context; do not select an endpoint from an undirected whole-line graph merely because it is a terminal somewhere on that line. This scope may come from the enclosing timetable or available topology; the proposal adds no new per-entry context fields.

| Situation | Proposed default behavior |
| --- | --- |
| Applicable directed path is established and has one unambiguous endpoint | Resolve the default to that terminal station. Display metadata can come from the identified station; do not fabricate an unavailable name. |
| Branches or candidate paths leave multiple possible endpoints | Leave the terminal unresolved/null; do not choose by ordering, distance, popularity or an arbitrary branch. |
| A loop has no established end, or required path/topology context is missing | Leave the terminal unresolved/null; do not use an arbitrary first station as an endpoint. |
| Source supplies a terminal station reference or terminal name | Preserve the explicit terminal under section 13.13; this is not a fallback case. |

A default derived from topology is not a source-confirmed operational terminal and does not establish cross-station trip identity or prove a train runs the full line. Preserve this semantic distinction; metadata or API representation for its derivation is deferred rather than invented here. Known source terminal information for a short turn remains explicit and takes precedence.

**Deferred — F06/F13/F16:** after the scope proposal is agreed, define reference lookup, permitted topology/path evidence, incomplete/contradictory topology handling, empty terminal objects, representation of an unresolved result, and configuration/version binding during topology/resolver review. Confirm materialization versus read-time resolution and any provenance fields during artifact/API review. The proposal selects neither a graph algorithm nor a matching heuristic, additional identifier, or new JSON property.
