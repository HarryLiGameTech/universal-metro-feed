# Toei realtime and lightweight station references

The browser loads `catalog.json` and `trip-map.json` only when Toei is selected.
Both are generated from the [official static GTFS ZIP](https://api-public.odpt.org/api/v4/files/Toei/data/Toei-Train-GTFS.zip).
The ZIP stays outside `public/` and the app bundle. Browsers never download or parse it.

## Refresh the references

Download a new official snapshot and generate both files:

```sh
npm run update:toei-data
```

Or reuse a ZIP already downloaded outside the public directory:

```sh
npm run update:toei-data -- /path/to/Toei-Train-GTFS.zip
```

Commit both generated JSON files together. Normal builds use these checked-in files;
they do not depend on downloading the Toei ZIP. The generator records the source URL,
feed version and validity dates in each output. Refresh after upstream timetable changes
and before the source validity period ends.

## Contents and runtime behavior

- The catalog contains the four subway lines (`route_type = 1`), stations, directions and source-published headsigns.
- The trip map stores the actual `stop_sequence` → `stop_id` mappings, grouped into reusable patterns.
  Each trip ID points to a pattern index. `null` marks known trips outside this subway scope, so tram/liner
  updates from the shared realtime feed are not mistaken for missing mappings.
- No scheduled clock times, fares or geometry are copied into the trip map. Static schedules remain disabled.
- The Toei adapter joins the cached references to live TripUpdates and filters the selected station, line
  and direction. Realtime timestamps and their published uncertainty remain authoritative.
- Unknown trips/sequences, out-of-range trip service dates, explicit feed-version mismatches, or conflicting
  route/direction IDs are not guessed. Unresolved fields remain null; unlocatable arrivals cannot enter a
  station board, which warns when results may be incomplete.

The references are frontend assets, not a ClockFace API or database contract.
Source credit: Bureau of Transportation, Tokyo Metropolitan Government / Association for Open Data of Public Transportation.
See the [official dataset and attribution terms](https://ckan.odpt.org/dataset/train-toei).
