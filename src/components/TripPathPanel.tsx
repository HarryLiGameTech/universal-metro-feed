import { useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { presentStrictTime } from "../domain/strict-time";
import type { TripPathLoader, TripPathQuery, TripStopTime } from "../domain/trip-path";
import { useClock } from "../hooks/useClock";
import { useTripPath } from "../hooks/useTripPath";
import type { DelayStatus } from "../types";

function StopTime({ value, label, departureDelayStatus }: {
  value: TripStopTime | null;
  label: "Arr" | "Dep";
  departureDelayStatus: DelayStatus | null;
}) {
  if (!value) return <div className="trip-path-time is-missing"><strong aria-label={`${label} time not supplied`}>—</strong></div>;
  if (value.time.kind === "uninterpreted") {
    return <div className="trip-path-time is-missing" title={value.time.reason}><strong aria-label={`${label} time precision not verified`}>—</strong></div>;
  }
  const presentation = presentStrictTime(value.time);
  const prefix = presentation.qualifier === "about" ? "~" :
    presentation.qualifier === "earliest" ? "≥" :
    presentation.qualifier === "latest" ? "≤" :
    value.source === "schedule" ? "=" : "";
  const accessibleQualifier = presentation.qualifier === "about" ? "about " :
    presentation.qualifier === "earliest" ? "earliest " :
    presentation.qualifier === "latest" ? "latest " : "";
  return (
    <div className={`trip-path-time is-${value.source}${value.source === "prediction" && departureDelayStatus ? ` delay-${departureDelayStatus}` : ""}`}>
      <strong aria-label={`${value.source === "prediction" ? "Live prediction" : "Scheduled"} ${label.toLowerCase()} ${accessibleQualifier}${presentation.primary}`}>
        <span aria-hidden="true">{prefix}</span>{presentation.primary}
      </strong>
    </div>
  );
}

export function TripPathPanel({ query, panelId, loadTripPath, refreshIntervalMs = 5_000 }: {
  query: TripPathQuery;
  panelId: string;
  loadTripPath: TripPathLoader;
  refreshIntervalMs?: number;
}) {
  const result = useTripPath(query, loadTripPath, refreshIntervalMs);
  const nowSeconds = useClock(1_000) / 1_000;
  const path = result.data?.data;
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentStopRef = useRef<HTMLLIElement>(null);
  const hasFocusedRef = useRef(false);
  useEffect(() => {
    if (hasFocusedRef.current || !path?.stops.length || !scrollRef.current || !currentStopRef.current) return;
    const scroll = scrollRef.current;
    const current = currentStopRef.current;
    scroll.scrollLeft = Math.max(0, current.offsetLeft - scroll.clientWidth / 2 + current.clientWidth / 2);
    scroll.focus({ preventScroll: true });
    hasFocusedRef.current = true;
  }, [path]);
  const liveValid = !result.isError && result.data?.freshness === "live" &&
    (result.data.validUntil ?? 0) >= nowSeconds;
  const visibleTime = (value: TripStopTime | null, scheduled: TripStopTime | null) =>
    value?.source === "prediction" && !liveValid ? scheduled : value;
  return (
    <section id={panelId} className="trip-path-panel" aria-label="Trip stop-by-stop times">
      <div className="trip-path-heading">
        <strong>Trip path</strong>
        <span>Scroll to see all stops →</span>
      </div>
      {result.isPending ? (
        <div className="trip-path-message"><RefreshCw className="spin" size={15} aria-hidden="true" /> Loading stop times…</div>
      ) : result.isError && !path ? (
        <div className="trip-path-message is-error"><AlertTriangle size={15} aria-hidden="true" /> Stop times unavailable. <button type="button" onClick={() => result.refetch()}>Retry</button></div>
      ) : !path?.stops.length ? (
        <div className="trip-path-message">This trip has no stop sequence in the available sources.</div>
      ) : (
        <>
          <div ref={scrollRef} className="trip-path-scroll" tabIndex={0} role="region" aria-label="Scrollable trip stops and arrival and departure times">
            <div className="trip-path-content">
              <div className="trip-path-axis" aria-hidden="true"><span>Arr</span><span>Dep</span></div>
            <ol className="trip-path-stops">
              {path.stops.map((stop) => (
                <li key={`${stop.sequence}-${stop.stopId}`} ref={stop.position === "current" ? currentStopRef : undefined} className={`trip-path-stop is-${stop.position}`} aria-current={stop.position === "current" ? "location" : undefined}>
                  <div className="trip-path-rail" aria-hidden="true"><span /></div>
                  <div className="trip-path-stop-name" title={stop.name}>{stop.name}</div>
                  <StopTime value={visibleTime(stop.arrival, stop.scheduledArrival)} label="Arr" departureDelayStatus={stop.departureDelayStatus} />
                  <StopTime value={visibleTime(stop.departure, stop.scheduledDeparture)} label="Dep" departureDelayStatus={stop.departureDelayStatus} />
                </li>
              ))}
            </ol>
            </div>
          </div>
          <div className="trip-path-legend">
            <span><b>~</b> Live prediction · color follows departure delay when comparable</span>
            <span><b>=</b> Scheduled</span>
            <span>— Not supplied</span>
            {path.topology === "partial" && <span>Only stops present in the live feed are shown.</span>}
            {!liveValid && <span>Feed delayed; live times hidden.</span>}
          </div>
        </>
      )}
    </section>
  );
}
