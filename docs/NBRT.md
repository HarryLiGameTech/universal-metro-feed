# Ningbo station schedules

NBRT is registered as `nbrt-subway`. Its browser-accessible station endpoint is
`https://metroinfo.ditiego.net/Api/Stations/ScheduleTime/{stationId}?DeviceType=6`.
Only the selected station is fetched, every 30 seconds. No proxy, custom user agent,
disabled TLS verification, or citywide schedule download is required.

## Data semantics

- `schedule.kind` is `proprietary-http`, coverage is `partial`, and predictions are `none`.
- The published seconds were explicitly confirmed by the project owner. Both clock
  fields become second-resolution `StrictTime` values with `kind: exact` in `Asia/Shanghai`.
  These are exact **planned** times, not observations of actual train movement.
- Explicit origin metadata selects `OutTimeStr`; all other stations use `IntimeStr`.
  Missing events stay missing. An arrival is never silently substituted for a departure.
- Delay seconds are null and delay status is undetermined. The shared UI renders
  scheduled times in white and omits delay labels.
- `tripId` is null and identity is `snapshot-only`. `Sequence`, `Key`, and `Name`
  do not establish stable train identity. Internal row IDs are hidden.
- The runtime provides neither a trip-path loader nor a full-day timetable loader.
  The UI consequently has no trip buttons, disclosure arrows, trip IDs, or full-day
  timetable for this provider.
- The source does not publish a generation timestamp. `feedTimestamp` is null;
  the footer reports time since retrieval. Polling does not make the source live:
  the resolved schedule has `freshness: static` and a refresh validity deadline.
- `StationStatus: 2` groups and paired `IntimeDura`/`OutTimeDura: -60` placeholders
  are excluded. `IsShow: 0` is not a filter: it also appears on valid records.
- Date-less clocks are anchored to the nearest local day around the request time,
  including midnight and extended-hour clocks. Past rows are filtered, rather than
  always advancing them to tomorrow. This is a rolling snapshot policy, not a
  service calendar; empty results never mean there are no trains for the rest of the day.

## Shared resolver and provider adapter

`ProprietaryHttpResolver` owns HTTP transport, cancellation, shared station requests,
source composition, filtering, deduplication, event selection, and schedule-only
normalization. A protocol adapter only converts an unknown response into separate,
semantically typed arrival and departure records. Another proprietary API can use
the same resolver by registering a codec and a URL template.

The NBRT adapter contains its response validation, placeholder rules, and confirmed
clock policy. Neither the shared resolver nor the UI branches on Ningbo's provider ID.

## Station directory and deferred topology

`scripts/providers/nbrt/stations.source.json` is the station directory supplied by
the owner's `nbrt-mcp/src/data/stations.json`; the old repository is unchanged.
`directions.json` records current terminal direction labels from its `direction.ts`.
Those endpoint labels also configure origins in the opposite direction. Adjust
this small file manually when terminal/origin rules change, then run
`npm run update:nbrt-data` to regenerate the checked-in catalog.

No ordered line topology has been imported. The old `lines.json` contains ordered
lists for lines 1–8, but its line 3 list includes missing station 101 and stations
102–104 that the station directory assigns to line 2. The directory also lists
line 3 memberships for several northern line 5 stations. Per the owner's decision,
topology reconciliation is deferred: the directory's source memberships are
preserved, no adjacency or shared-track groups are inferred, and unavailable
station/line schedule combinations simply yield no upcoming records. The old
10/12 line aliases do not supply corresponding topology or station records.

Coordinates and official line colors were not supplied. Coordinates remain null
and route bullets use neutral styling. Direction terminal labels are presented as
“Toward”, not as claims about the destination of a particular train or short turn.
