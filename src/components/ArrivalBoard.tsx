import { AlertTriangle, Radio, RefreshCw } from "lucide-react";
import { useArrivals } from "../hooks/useArrivals";
import { useClock } from "../hooks/useClock";
import { directionDisplay } from "../lib/platform-selection";
import { compactTripId } from "../lib/trip-label";
import type { Direction, Station } from "../types";
import { RouteBullet } from "./RouteBullet";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

interface ArrivalBoardProps {
  station: Station;
  routeIds: readonly string[];
  direction: Direction;
}

export function ArrivalBoard({ station, routeIds, direction }: ArrivalBoardProps) {
  const now = useClock();
  const query = useArrivals(station.id, routeIds, direction);
  const heading = directionDisplay(station, routeIds, direction);
  const nowSeconds = now / 1_000;
  const arrivals = (query.data?.arrivals ?? [])
    .filter((arrival) => arrival.eventTime >= nowSeconds - 5)
    .slice(0, 4);
  const feedAge = query.data ? Math.max(0, nowSeconds - query.data.feedTimestamp) : Infinity;
  const isStale = feedAge > 90;

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

      {query.isPending ? (
        <div className="board-message">
          <RefreshCw className="spin" aria-hidden="true" />
          <strong>Reading the MTA feed…</strong>
          <span>Decoding the latest train positions.</span>
        </div>
      ) : query.isError ? (
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
          {arrivals.map((arrival, index) => {
            const secondsAway = Math.max(0, Math.round(arrival.eventTime - nowSeconds));
            const minutesAway = Math.floor(secondsAway / 60);
            const proximity = index === 0 ? "Next" : minutesAway < 1 ? "Due" : `${minutesAway} min`;

            return (
              <li key={`${arrival.tripId}-${arrival.eventTime}`} className="arrival-row">
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
                    {timeFormatter.format(arrival.eventTime * 1_000)}
                  </time>
                  <div className="arrival-annotations">
                    <small>{arrival.eventKind === "departure" ? "Departs" : "Arrives"}</small>
                    <small className={`delay-label delay-${arrival.delayStatus}`}>{arrival.delayLabel}</small>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <footer className="board-footer">
        <span>MTA feed age</span>
        <strong>{Number.isFinite(feedAge) ? `${Math.floor(feedAge)} sec` : "—"}</strong>
        <span className="footer-divider" aria-hidden="true" />
        <span>Auto-refresh</span>
        <strong>5 sec</strong>
      </footer>
    </section>
  );
}
