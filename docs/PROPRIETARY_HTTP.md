# Proprietary HTTP sources

`proprietary-http` describes the source access mechanism. The `schedule` and
`predictions` manifest sections identify the data's role; `adapter` names the
wire protocol. Provider names are not source kinds.

| Provider | Schedule | Predictions | Topology |
| --- | --- | --- | --- |
| MBTA | `proprietary-http`, `mbta-v3`, `full-day` | `proprietary-http`, `mbta-v3` | `gtfs-static` |
| NBRT | `proprietary-http`, `nbrt-schedule-time`, `partial` | `none` | `station-directory` |

MBTA endpoints are configured separately in its manifest. Both return JSON over
HTTPS; neither endpoint is parsed as GTFS-Realtime Protobuf or a GTFS static file.
The GTFS topology generation script and MTA source kinds are unchanged.

## Boundaries

- `ProprietaryHttpResolver` loads JSON, passes unknown responses to a codec,
  follows codec-provided page links within the initial origin, enforces page
  limits, detects cycles, and propagates failures and cancellation. Incomplete
  pagination fails rather than returning a seemingly complete schedule.
- `HttpCodec` validates and combines protocol pages. The MBTA codec preserves
  JSON:API relationships and merges included resources across pages; the NBRT
  codec handles its station groups and known placeholder records.
- Each HTTP resolver is configured as a schedule or prediction source. Its
  `asSource` binding plugs into `CompositeMetroDataResolver` through the existing
  domain source contract. Fetching a schedule repeatedly keeps `freshness: static`;
  predictions retain `freshness: live` and their configured validity deadline.
- Request reuse is scoped to the same `ResolutionContext` object, including its
  cancellation signal. Selected routes share a station query within one snapshot;
  a later refresh or another consumer gets a new context and a new request. Failed
  requests are evicted. No global prediction cache is introduced.
- Protocol runtime factories are registered in `http/adapters.ts` and loaded only
  for the selected adapter. `runtimeForProvider` has one HTTP dispatch path. The
  current runtime factories require matching protocol adapters when both HTTP
  schedule and prediction sources are configured; arbitrary mixed-protocol fusion
  is not implemented.

## Preserved provider policies

MBTA keeps its GTFS station/platform selection, real trip identities, trip paths,
full-day timetable queries, minute-level published schedules, prediction seconds
and supplied uncertainty. Schedule and prediction failures still degrade
independently in a trip path. Its existing provenance and freshness rules remain
in the MBTA policy, not in the JSON codec.

NBRT's `PartialScheduleResolver` retains second-precision planned times, explicit
origin departure selection, intermediate arrival selection, null trip IDs,
snapshot-only record identity, and absent delay information. It has no trip-path
or full-day timetable loader. That capability restriction is independent of HTTP
transport. No additional Ningbo topology is imported by this refactor.

To add a protocol, supply a codec and the necessary domain normalization/runtime
policy, then register its adapter name. Avoid adding an operator-specific source
kind or duplicating HTTP fetching/pagination code.
