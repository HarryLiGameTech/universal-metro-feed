import { useEffect, useMemo, useState } from "react";
import { CalendarClock, RefreshCw } from "lucide-react";
import { useCatalog } from "../providers/catalog-context";
import { fetchTimetableForRoutes, newYorkDateKey, timetableDayLabels, timetableDayTypeForDate } from "../lib/timetable";
import { directionDisplay, isSharedLineGroup } from "../lib/platform-selection";
import type { Direction, TimetableDayType, TimetableResult } from "../types";
import { RouteBullet } from "./RouteBullet";
import { SelectorPanel } from "./SelectorPanel";

export function StaticTimetableSection() {
  const { stations } = useCatalog();
  const firstStation = stations[0] ?? (() => {
    throw new Error("The provider station catalog is empty.");
  })();
  const defaultStationId = stations.some((station) => station.id === "127") ? "127" : firstStation.id;
  const [stationId, setStationId] = useState(defaultStationId);
  const station = useMemo(
    () => stations.find((item) => item.id === stationId) ?? firstStation,
    [stationId],
  );
  const initialRoute = station.routes[0] ?? (() => {
    throw new Error(`No routes found for station ${station.id}.`);
  })();
  const [routeIds, setRouteIds] = useState<string[]>([initialRoute.routeId]);
  const [direction, setDirection] = useState<Direction>(initialRoute.directions[0] ?? "N");
  const [dayType, setDayType] = useState<TimetableDayType>(() => timetableDayTypeForDate(newYorkDateKey(new Date())));
  const [availableDays, setAvailableDays] = useState<TimetableDayType[]>(["weekday", "saturday", "sunday"]);
  const [timetable, setTimetable] = useState<TimetableResult | null>(null);
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [error, setError] = useState("");

  function selectStation(nextStationId: string) {
    const nextStation = stations.find((item) => item.id === nextStationId);
    const nextRoute = nextStation?.routes[0];
    if (!nextStation || !nextRoute) return;
    setStationId(nextStationId);
    setRouteIds([nextRoute.routeId]);
    setDirection(nextRoute.directions[0] ?? "N");
  }

  function selectRoute(nextRouteId: string) {
    const nextRoute = station.routes.find((item) => item.routeId === nextRouteId);
    if (!nextRoute) return;
    setRouteIds([nextRouteId]);
    setDirection(nextRoute.directions.includes(direction) ? direction : nextRoute.directions[0] ?? "N");
  }

  function selectLineGroup(nextRouteIds: string[]) {
    if (isSharedLineGroup(station, direction, nextRouteIds)) setRouteIds(nextRouteIds);
  }

  function selectDirection(nextDirection: Direction) {
    if (routeIds.length > 1 && !isSharedLineGroup(station, nextDirection, routeIds)) {
      const fallbackRoute = station.routes.find((item) => routeIds.includes(item.routeId) && item.directions.includes(nextDirection));
      if (!fallbackRoute) return;
      setRouteIds([fallbackRoute.routeId]);
    }
    setDirection(nextDirection);
  }

  useEffect(() => {
    const controller = new AbortController();
    setTimetable(null);
    setStatus("loading");
    setError("");

    void fetchTimetableForRoutes(station.id, routeIds, direction, dayType, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setAvailableDays(result.availableDays);
          setTimetable(result);
          if (result.dayType !== dayType) setDayType(result.dayType);
        }
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) {
          setStatus("error");
          setError(caught instanceof Error ? caught.message : "Unable to load this timetable.");
        }
      });

    return () => {
      controller.abort();
    };
  }, [station.id, routeIds, direction, dayType]);

  return (
    <section className="timetable-section" aria-labelledby="timetable-section-title">
      <header className="timetable-intro">
        <div>
          <p className="section-kicker">Scheduled service</p>
          <h2 id="timetable-section-title">Static timetable</h2>
        </div>
        <p>A full-day, platform-specific view inspired by Japanese station timetables.</p>
      </header>

      <div className="workspace timetable-workspace">
        <SelectorPanel
          idPrefix="timetable"
          station={station}
          routeIds={routeIds}
          direction={direction}
          onStationChange={selectStation}
          onRouteChange={selectRoute}
          onLineGroupChange={selectLineGroup}
          onDirectionChange={selectDirection}
          timetableDays={availableDays}
          timetableDay={dayType}
          onTimetableDayChange={setDayType}
        />

        <div className="timetable-board">
          <header className="timetable-board-header">
            <div className="board-eyebrow">
              <div className="route-bullet-group">
                {routeIds.map((routeId) => <RouteBullet key={routeId} routeId={routeId} size={routeIds.length > 1 ? "small" : "large"} />)}
              </div>
              <span title={directionDisplay(station, routeIds, direction).full}>
                {directionDisplay(station, routeIds, direction).short}
              </span>
            </div>
            <h3>{station.name}</h3>
            {timetable && (
              <p>{timetableDayLabels[timetable.dayType]} · {timetable.scheduledTrainCount} scheduled departures</p>
            )}
          </header>

          {!timetable ? (
            <div className={status === "error" ? "timetable-prompt is-error" : "timetable-prompt"}>
              {status === "loading" ? <RefreshCw className="spin" aria-hidden="true" /> : <CalendarClock aria-hidden="true" />}
              <strong>{status === "loading" ? "Loading schedule…" : "Couldn’t load the timetable"}</strong>
              <span>{status === "error" ? error : "Fetching the selected platform timetable."}</span>
            </div>
          ) : timetable.hours.length === 0 ? (
            <div className="timetable-prompt">
              <CalendarClock aria-hidden="true" />
              <strong>No scheduled trains today</strong>
              <span>The static GTFS calendar has no service for this selection.</span>
            </div>
          ) : (
            <div className="timetable-grid" aria-label={`Static timetable for ${station.name}`}>
              {timetable.hours.map((row) => (
                <div className="timetable-row" key={row.hour}>
                  <div className="timetable-hour" aria-label={`${row.hour}:00 hour`}>{row.hour}</div>
                  <div className="timetable-minutes">
                    {row.events.map((event, eventIndex) => (
                      <span
                        className={event.hasHalfMinute ? "timetable-minute has-half-minute" : "timetable-minute"}
                        key={`${event.seconds}-${event.eventKind}-${eventIndex}`}
                        title={`${event.routeId ? `Line ${event.routeId} · ` : ""}${event.eventKind === "departure" ? "Departs" : "Arrives"} ${event.exactTime}`}
                        aria-label={`${event.routeId ? `Line ${event.routeId} ` : ""}${event.eventKind === "departure" ? "Departs" : "Arrives"} at ${event.exactTime}`}
                      >
                        <span>{event.minute}</span>
                        {event.hasHalfMinute && <sup aria-hidden="true">+</sup>}
                        {event.routeId && <span className="timetable-route-tag">{event.routeId}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <footer className="timetable-footer">
            <span>Hours</span><strong>New York local time</strong>
          </footer>
        </div>
      </div>
    </section>
  );
}
