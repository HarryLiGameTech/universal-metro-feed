import { useEffect, useState } from "react";
import { AlertTriangle, CalendarClock, ChevronDown, Radio, RefreshCw } from "lucide-react";
import { useArrivals } from "../hooks/useArrivals";
import { useClock } from "../hooks/useClock";
import { directionDisplay } from "../lib/platform-selection";
import { arrivalIdentity, visibleArrivals } from "../lib/arrival-board-state";
import { compactTripId } from "../lib/trip-label";
import { presentStrictTime } from "../domain/strict-time";
import type { ProviderRuntime } from "../providers/runtime";
import type { Arrival, Direction, Station } from "../types";
import { RouteBullet } from "./RouteBullet";
import { TripPathPanel } from "./TripPathPanel";

type ArrivalBoardProps = {
  providerId: string;
  timezone: string;
  runtime: ProviderRuntime;
} & ({
  station: Station;
  routeIds: readonly string[];
  direction: Direction;
} | { station?: never; routeIds?: never; direction?: never });

export function ArrivalBoard({ providerId, timezone, runtime, station, routeIds = [], direction = "" }: ArrivalBoardProps) {
  const feedScope = runtime.arrivalScope === "feed";
  if (!station && !feedScope) throw new Error("Select a station for this provider.");
  const [expandedTrip, setExpandedTrip] = useState<{ platformKey: string; arrival: Arrival } | null>(null);
  const now = useClock();
  const query = useArrivals(providerId, station?.id ?? "", routeIds, direction, runtime.loadArrivals, runtime.refreshIntervalMs);
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const heading = station ? directionDisplay(station, routeIds, direction) : { short: "All active trips", full: "All active trips" };
  const nowSeconds = now / 1_000;
  const scheduled = runtime.arrivalSource === "schedule";
  const platformKey = `${providerId}:${station?.id ?? ""}:${direction}:${routeIds.join(",")}`;
  useEffect(() => setExpandedTrip(null), [platformKey]);
  const selectedArrival = runtime.loadTripPath && expandedTrip?.platformKey === platformKey ? expandedTrip.arrival : null;
  const arrivals = visibleArrivals(query.data?.arrivals ?? [], nowSeconds, selectedArrival, feedScope ? 12 : 4);
  const ageTimestamp = query.data ? scheduled ? query.data.fetchedAt : query.data.feedTimestamp : null;
  const feedAge = ageTimestamp != null ? Math.max(0, nowSeconds - ageTimestamp) : Infinity;
  const isStale = ageTimestamp != null && feedAge > Math.max(90, runtime.refreshIntervalMs / 1_000 * 3);

  const uncertaintyLabel = (seconds: number) => seconds >= 60 && seconds % 60 === 0
    ? `±${seconds / 60} min estimate` : `±${seconds} sec estimate`;

  return (
    <section className="board" aria-labelledby="arrivals-title" aria-live="polite">
      <header className="board-header">
        <div>
          <div className="board-eyebrow">
            {station && <div className="route-bullet-group">
              {routeIds.map((routeId) => <RouteBullet key={routeId} routeId={routeId} size={routeIds.length > 1 ? "small" : "large"} />)}
            </div>}
            <span title={heading.full}>{heading.short}</span>
          </div>
          <h2 id="arrivals-title">{station?.name ?? "Upcoming predictions"}</h2>
        </div>

        <div className={`live-status${scheduled ? " is-schedule" : ""}${isStale && query.data ? " is-stale" : ""}`}>
          {isStale && query.data ? <AlertTriangle size={16} /> : scheduled ? <CalendarClock size={16} /> : <Radio size={16} />}
          <span>{scheduled ? isStale && query.data ? "Refresh overdue" : "Partial timetable" : isStale ? "Feed delayed" : query.isFetching ? "Refreshing" : "Live"}</span>
        </div>
      </header>

      {query.data?.unavailableRoutes?.length ? (
        <div className="partial-feed-warning" role="status">
          {scheduled ? "Schedule" : "Live feed"} unavailable for line {query.data.unavailableRoutes.join(" / ")}; showing the other selected lines.
        </div>
      ) : null}

      {query.isError && query.data ? (
        <div className="partial-feed-warning" role="status">Refresh failed; showing the last available feed.</div>
      ) : null}

      {query.isPending ? (
        <div className="board-message">
          <RefreshCw className="spin" aria-hidden="true" />
          <strong>Reading {runtime.feedLabel}…</strong>
          <span>{scheduled ? "Loading published times for this station." : "Loading the latest arrival estimates."}</span>
        </div>
      ) : query.isError && !query.data ? (
        <div className="board-message board-message--error">
          <AlertTriangle aria-hidden="true" />
          <strong>{scheduled ? "Partial timetable unavailable" : "Realtime feed unavailable"}</strong>
          <span>{query.error.message}</span>
          <button type="button" onClick={() => query.refetch()}>Try again</button>
        </div>
      ) : arrivals.length === 0 ? (
        <div className="board-message">
          <strong>{scheduled ? "No upcoming times in this partial timetable" : "No upcoming trains in the live feed"}</strong>
          <span>{scheduled ? "This is not a full-day schedule. Times will refresh automatically." : "The feed will check again automatically."}</span>
        </div>
      ) : (
        <ol className="arrival-list">
          {arrivals.map(({ arrival, retained, fromFeed }, index) => {
            const secondsAway = Math.max(0, Math.round(arrival.eventTime - nowSeconds));
            const minutesAway = Math.floor(secondsAway / 60);
            const proximity = !fromFeed ? "Last seen" : arrival.eventTime < nowSeconds - 5 ? "Passed" :
              index === 0 ? "Next" : minutesAway < 1 ? "Due" : `${minutesAway} min`;
            const tripKey = feedScope ? arrival.id : arrivalIdentity(arrival);
            const expanded = selectedArrival != null && arrivalIdentity(selectedArrival) === tripKey;
            const panelId = `trip-path-${station?.id ?? providerId}-${index}`;
            const semantic = arrival.displayTime?.kind === "uninterpreted" ? null : arrival.displayTime;
            const presented = semantic ? presentStrictTime(semantic) : null;
            const tripQuery = station && arrival.tripId != null && arrival.routeId != null ? {
              providerId, stationId: station.id, routeId: arrival.routeId, directionId: direction,
              tripId: arrival.tripId, entityId: arrival.id,
              anchorEventTime: arrival.eventTime, anchorEventKind: arrival.eventKind,
            } : null;
            const canExpand = runtime.loadTripPath != null && tripQuery != null;
            const Row = canExpand ? "button" : "div";
            const isSchedule = arrival.timeSource === "schedule" || scheduled;

            return (
              <li key={tripKey} className={retained ? "arrival-entry is-retained" : "arrival-entry"}>
                <Row
                  type={canExpand ? "button" : undefined}
                  className={`arrival-row${canExpand ? "" : " is-static"}`}
                  aria-expanded={canExpand ? expanded : undefined}
                  aria-controls={expanded ? panelId : undefined}
                  onClick={canExpand ? () => setExpandedTrip(expanded ? null : { platformKey, arrival }) : undefined}
                >
                <div className="arrival-order">{String(index + 1).padStart(2, "0")}</div>
                <div className="arrival-destination">
                  <div className="arrival-destination-meta">
                    {routeIds.length > 1 && arrival.routeId != null && <RouteBullet routeId={arrival.routeId} size="small" />}
                    {feedScope && arrival.routeId != null && <small>Route {arrival.routeId}</small>}
                    {feedScope && arrival.direction != null && <small>Direction {arrival.direction}</small>}
                    {arrival.destinationName != null && <small>{arrival.destinationKind === "direction" ? "Toward" : "To"}</small>}
                  </div>
                  <strong>{arrival.destinationName ?? (feedScope ? arrival.stopId ??
                    (arrival.stopSequence == null ? null : `Stop sequence ${arrival.stopSequence}`) : null)}</strong>
                  {arrival.tripId != null && <small className="arrival-trip" title={`Full source ID: ${arrival.tripId}`}>
                    {arrival.tripId === arrival.id ? "Feed ID" : "Trip ID"} {compactTripId(arrival.tripId)}
                  </small>}
                </div>
                <div className="arrival-when">
                  <span>{proximity}</span>
                  <time
                    className={isSchedule ? "arrival-time is-scheduled" : `arrival-time delay-${arrival.delayStatus}`}
                    dateTime={new Date(arrival.eventTime * 1_000).toISOString()}
                  >
                    {presented ? `${presented.qualifier === "about" ? "~" : ""}${presented.primary}` : timeFormatter.format(arrival.eventTime * 1_000)}
                  </time>
                  <div className="arrival-annotations">
                    <small>{isSchedule ? arrival.eventKind === "departure" ? "Scheduled departure" : "Scheduled arrival" : fromFeed ? arrival.eventKind === "departure" ? "Departs" : "Arrives" : "Last prediction"}</small>
                    {!isSchedule && <small className={`delay-label delay-${arrival.delayStatus}`}>{semantic?.kind === "estimate" && semantic.toleranceSeconds != null
                      ? uncertaintyLabel(semantic.toleranceSeconds) : arrival.delayLabel}</small>}
                  </div>
                </div>
                {canExpand && <ChevronDown className={expanded ? "arrival-disclosure is-open" : "arrival-disclosure"} size={15} aria-hidden="true" />}
                {canExpand && <span className="sr-only">{expanded ? "Hide" : "Show"} stop-by-stop times</span>}
                </Row>
                {expanded && runtime.loadTripPath && tripQuery && <TripPathPanel panelId={panelId} loadTripPath={runtime.loadTripPath} refreshIntervalMs={runtime.refreshIntervalMs} query={tripQuery} />}
              </li>
            );
          })}
        </ol>
      )}

      <footer className="board-footer">
        <span>{scheduled ? "Last fetched" : `${runtime.feedLabel} age`}</span>
        <strong>{Number.isFinite(feedAge) ? `${Math.floor(feedAge)} sec` : "—"}</strong>
        <span className="footer-divider" aria-hidden="true" />
        <span>Auto-refresh</span>
        <strong>{runtime.refreshIntervalMs / 1_000} sec</strong>
      </footer>
    </section>
  );
}
