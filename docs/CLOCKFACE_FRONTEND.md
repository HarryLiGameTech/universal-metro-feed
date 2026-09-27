# Clockface timetable connection

The MTA static timetable panel reads `trainRuns` from Clockface's versioned station endpoint. The provider manifest is [public/providers/mta-subway.json](../public/providers/mta-subway.json). Its `schedule.baseUrl` and `schedule.runId` are intentionally empty until Clockface has a browser-accessible HTTPS address.

For local development, [.env.development](../.env.development) selects the succeeded run on `100.92.91.101:3000`. Vite proxies `/clockface` to that Tailnet address, so the browser requests its own origin and needs no Clockface CORS permission. Run `npm run dev` on a computer connected to the same Tailnet. This development override is absent from production builds; without production configuration, the panel shows a configuration error instead of bundled timetable entries.

After Clockface has an HTTPS address, set the manifest's `baseUrl` to that browser-accessible API origin (optionally including its base path), and `runId` to a succeeded `sourceParseRunId` for the MTA source. Clockface does not select a latest run automatically. The API must allow the website's origin through `CORS_ORIGINS`, unless both services share an origin. The requested endpoint is:

```text
{baseUrl}/v1/runs/{runId}/stations/{stationId}/timetable?platformId={stationId}{direction}
```

For a single line, the request also includes `routeId`. For a shared-line selection, the frontend makes one request with `platformId` and filters the returned runs by the selected route IDs. It uses Clockface's `filterTags` and exact `TimeSpecSecond` values. Minute-only and unknown-second values are omitted because the current minute grid promises an exact departure time.

Clockface currently does not expose a service-date calendar endpoint. The panel still uses the website's generated `/timetables/calendar.json` to select weekday, Saturday and Sunday service, apply exceptions, and display trains after midnight. The local calendar files were byte-for-byte identical to the Clockface import on 2026-09-26; check this again when changing `runId`. If they differ, update the frontend's GTFS source or provide the calendar through Clockface before publishing the new run. The generated timetable shards remain for MTA realtime schedule matching and trip paths, but the static timetable panel does not fetch them.
