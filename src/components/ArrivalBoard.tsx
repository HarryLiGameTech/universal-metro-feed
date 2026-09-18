import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Radio, RefreshCw } from "lucide-react";
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

interface ArrivalBoardProps {
  providerId: string;
  timezone: string;
  runtime: ProviderRuntime;
  station: Station;
  routeIds: readonly string[];
  direction: Direction;
}

export function ArrivalBoard({ providerId, timezone, runtime, station, routeIds, direction }: ArrivalBoardProps) {
  const [expandedTrip, setExpandedTrip] = useState<{ platformKey: string; arrival: Arrival } | null>(null);
  const now = useClock();
  const query = useArrivals(providerId, station.id, routeIds, direction, runtime.loadArrivals, runtime.refreshIntervalMs);
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const heading = directionDisplay(station, routeIds, direction);
  const nowSeconds = now / 1_000;
  const platformKey = `${providerId}:${station.id}:${direction}:${routeIds.join(",")}`;
  useEffect(() => setExpandedTrip(null), [platformKey]);
  const selectedArrival = expandedTrip?.platformKey === platformKey ? expandedTrip.arrival : null;
  const arrivals = visibleArrivals(query.data?.arrivals ?? [], nowSeconds, selectedArrival);
  const feedAge = query.data ? Math.max(0, nowSeconds - query.data.feedTimestamp) : Infinity;
const isStale = feedAge > 90;

  const uncertaintyLabel = (seconds: number) => seconds >= 60 && seconds % 60 === 0
    ? `±${seconds / 60} min estimate` : `±${seconds} sec estimate`;

  return (
    <section className="board" aria-labelledby="arrivals-title" aria-live="polite">
      <header className="board-header">
        <div>
          <div className="board-eyebrow">
            <div className="route-bullet-group">
              {routeIds.map((routeId) => <RouteBullet key={routeId} routeId={routeId} size={routeIds.length > 1 ? "small" : "large"} />)}
            </div>
            <span title={heading.full}>{heading.short}</span>
          </div>
          <h2 id="arrivals-title">{station.name}</h2>
        </div>

        <div className={isStale ? "live-status is-stale" : "live-status"}>
          {isStale ? <AlertTriangle size={16} /> : <Radio size={16} />}
          <span>{isStale ? "Feed delayed" : query.isFetching ? "Refreshing" : "Live"}</span>
        </div>
      </header>

      {query.data?.unavailableRoutes?.length ? (
        <div className="partial-feed-warning" role="status">
          Live feed unavailable for line {query.data.unavailableRoutes.join(" / ")}; showing the other selected lines.
        </div>
      ) : null}

      {query.isError && query.data ? (
        <div className="partial-feed-warning" role="status">Refresh failed; showing the last available feed.</div>
      ) : null}

      {query.isPending ? (
        <div className="board-message">
          <RefreshCw className="spin" aria-hidden="true" />
          <strong>Reading {runtime.feedLabel}…</strong>
          <span>Decoding the latest train positions.</span>
        </div>
      ) : query.isError && !query.data ? (
        <div className="board-message board-message--error">
          <AlertTriangle aria-hidden="true" />
          <strong>Realtime feed unavailable</strong>
          <span>{query.error.message}</span>
          <button type="button" onClick={() => query.refetch()}>Try again</button>
        </div>
      ) : arrivals.length === 0 ? (
        <div className="board-message">
          <strong>No upcoming trains in the live feed</strong>
          <span>The feed will check again automatically.</span>
        </div>
      ) : (
        <ol className="arrival-list">
          {arrivals.map(({ arrival, retained, fromFeed }, index) => {
            const secondsAway = Math.max(0, Math.round(arrival.eventTime - nowSeconds));
            const minutesAway = Math.floor(secondsAway / 60);
            const proximity = !fromFeed ? "Last seen" : arrival.eventTime < nowSeconds - 5 ? "Passed" :
              index === 0 ? "Next" : minutesAway < 1 ? "Due" : `${minutesAway} min`;
            const tripKey = arrivalIdentity(arrival);
            const expanded = selectedArrival != null && arrivalIdentity(selectedArrival) === tripKey;
            const panelId = `trip-path-${station.id}-${index}`;
            const semantic = arrival.displayTime?.kind === "uninterpreted" ? null : arrival.displayTime;
            const presented = semantic ? presentStrictTime(semantic) : null;

            return (
              <li key={tripKey} className={retained ? "arrival-entry is-retained" : "arrival-entry"}>
                <button
                  type="button"
                  className="arrival-row"
                  aria-expanded={expanded}
                  aria-controls={expanded ? panelId : undefined}
                  onClick={() => setExpandedTrip(expanded ? null : { platformKey, arrival })}
                >
                <div className="arrival-order">{String(index + 1).padStart(2, "0")}</div>
                <div className="arrival-destination">
                  <div className="arrival-destination-meta">
                    {routeIds.length > 1 && <RouteBullet routeId={arrival.routeId} size="small" />}
                    <small>To</small>
                  </div>
                  <strong>{arrival.destinationName}</strong>
                  <small className="arrival-trip" title={`Full source ID: ${arrival.tripId}`}>
                    {arrival.tripId === arrival.id ? "Feed ID" : "Trip ID"} {compactTripId(arrival.tripId)}
                  </small>
                </div>
                <div className="arrival-when">
                  <span>{proximity}</span>
                  <time
                    className={`arrival-time delay-${arrival.delayStatus}`}
                    dateTime={new Date(arrival.eventTime * 1_000).toISOString()}
                  >
                    {presented ? `${presented.qualifier === "about" ? "~" : ""}${presented.primary}` : timeFormatter.format(arrival.eventTime * 1_000)}
                  </time>
                  <div className="arrival-annotations">
                    <small>{fromFeed ? arrival.eventKind === "departure" ? "Departs" : "Arrives" : "Last prediction"}</small>
                    <small className={`delay-label delay-${arrival.delayStatus}`}>{semantic?.kind === "estimate" && semantic.toleranceSeconds != null
                      ? uncertaintyLabel(semantic.toleranceSeconds) : arrival.delayLabel}</small>
                  </div>
                </div>
                <ChevronDown className={expanded ? "arrival-disclosure is-open" : "arrival-disclosure"} size={15} aria-hidden="true" />
                <span className="sr-only">{expanded ? "Hide" : "Show"} stop-by-stop times</span>
                </button>
                {expanded && <TripPathPanel panelId={panelId} loadTripPath={runtime.loadTripPath} refreshIntervalMs={runtime.refreshIntervalMs} query={{
                  providerId,
                  stationId: station.id,
                  routeId: arrival.routeId,
                  directionId: direction,
                  tripId: arrival.tripId,
                  entityId: arrival.id,
                  anchorEventTime: arrival.eventTime,
                  anchorEventKind: arrival.eventKind,
                }} />}
              </li>
            );
          })}
        </ol>
      )}

      <footer className="board-footer">
        <span>{runtime.feedLabel} age</span>
        <strong>{Number.isFinite(feedAge) ? `${Math.floor(feedAge)} sec` : "—"}</strong>
        <span className="footer-divider" aria-hidden="true" />
        <span>Auto-refresh</span>
        <strong>{runtime.refreshIntervalMs / 1_000} sec</strong>
      </footer>
    </section>
  );
}
