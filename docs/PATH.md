# PATH live arrivals

The PATH provider reads the Port Authority's [RidePATH JSON feed](https://www.panynj.gov/bin/portauthority/ridepath.json). For each message, the adapter computes the predicted station arrival as `Date.parse(lastUpdated) / 1000 + Number(secondsToArrival)` in Unix seconds. It respects the timezone offset in `lastUpdated` and displays the result in New York local time. The feed's rounded `arrivalTimeMessage` is not used for this calculation.

The live source groups messages by `consideredStation` and direction (`ToNJ` or `ToNY`). The local station directory supplies display names for the 13 station codes; `target` and `headSign` supply each prediction's destination. The source does not provide a stable trip ID or platform. `PATH` is the service selector in the live board. The board retains prediction semantics while displaying the calculated time without a `~` prefix.

## Static timetable

The static panel fetches `trainRuns` from Clockface's versioned PATH station timetable endpoint. The current Tailnet Clockface run is `53b31254-465a-492a-b9ec-ac213d0efa4d`. Local development uses the existing `/clockface` Vite proxy and sets `VITE_PATH_CLOCKFACE_RUN_ID` in `.env.development`; production configuration remains empty until Clockface has a browser-accessible deployment.

Clockface's PATH import keeps numeric GTFS stop IDs separate. The [PATH timetable adapter](../src/providers/path/clockface-timetable.ts) maps each visible station and direction to the corresponding numeric stops, then filters the source `directionId` (`0` toward New York, `1` toward New Jersey). It excludes terminal arrivals at Journal Square and Hoboken from outgoing station timetables. Times and service tags come from Clockface; no timetable times are bundled with this website.

Clockface has no calendar API yet. The small [PATH calendar](../public/providers/path-rail/calendar.json) comes from the same GTFS ZIP as this run, whose content hash is `67bf028e155e9f6eec5157c0768f1c490c111055b0a45d63d3e4a497765a77e8`. The adapter rejects a different run ID until the calendar is reviewed and updated. The shared minute-grid rule marks `+` when known source seconds are `30` or greater, including `:30`; it applies to all timetable providers.

The official live feed does not allow browser cross-origin requests. In local development, `.env.development` sets `VITE_PATH_ACCESS_URL=/path-feed`, and Vite proxies that same-origin path to the official JSON endpoint. Check `http://localhost:5173/path-feed` after starting the dev server. For deployment, arrange an equivalent same-origin proxy to the official endpoint and set `VITE_PATH_ACCESS_URL` at build time or the manifest's `predictions.accessUrl` to its path. The Clockface static panel also needs a reachable `baseUrl` and this PATH run ID. Until production access is configured, the panels show configuration errors.
