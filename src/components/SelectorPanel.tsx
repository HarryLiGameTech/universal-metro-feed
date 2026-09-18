import { ChevronDown } from "lucide-react";
import { useCatalog } from "../providers/catalog-context";
import { timetableDayLabels } from "../lib/service-date";
import { directionDisplay, sharedLineGroups } from "../lib/platform-selection";
import type { Direction, Station, TimetableDayType } from "../types";
import { RouteBullet } from "./RouteBullet";

interface SelectorPanelProps {
  idPrefix?: string;
  station: Station;
  routeIds: readonly string[];
  direction: Direction;
  onStationChange(stationId: string): void;
  onRouteChange(routeId: string): void;
  onLineGroupChange(routeIds: string[]): void;
  onDirectionChange(direction: Direction): void;
  timetableDays?: readonly TimetableDayType[];
  timetableDay?: TimetableDayType;
  onTimetableDayChange?(dayType: TimetableDayType): void;
}

export function SelectorPanel({
  idPrefix = "platform",
  station,
  routeIds,
  direction,
  onStationChange,
  onRouteChange,
  onLineGroupChange,
  onDirectionChange,
  timetableDays,
  timetableDay,
  onTimetableDayChange,
}: SelectorPanelProps) {
  const { routes, stations } = useCatalog();
  const selectedRoute = station.routes.find((item) => item.routeId === routeIds[0]) ?? station.routes[0];
  const directions = (selectedRoute?.directions ?? []).filter((value) =>
    routeIds.every((routeId) => station.routes.some((item) => item.routeId === routeId && item.directions.includes(value))));
  const groups = sharedLineGroups(station, direction);

  return (
    <section className="selector-panel" aria-labelledby={`${idPrefix}-selector-title`}>
      <div className="section-kicker">Choose your platform</div>
      <h2 id={`${idPrefix}-selector-title`}>Where are you waiting?</h2>

      <div className="field-group">
        <label htmlFor={`${idPrefix}-station`}>Station</label>
        <div className="select-shell">
          <select
            id={`${idPrefix}-station`}
            value={station.id}
            onChange={(event) => onStationChange(event.target.value)}
          >
            {stations.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} · {option.routes.map((item) => item.routeId).join(" ")}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" size={18} />
        </div>
      </div>

      <fieldset className="field-group">
        <legend>Line</legend>
        <div className="route-options">
          {station.routes.map((item) => (
            <button
              key={item.routeId}
              type="button"
              className={routeIds.length === 1 && item.routeId === routeIds[0] ? "route-option is-selected" : "route-option"}
              onClick={() => onRouteChange(item.routeId)}
              aria-pressed={routeIds.length === 1 && item.routeId === routeIds[0]}
              aria-label={`Line ${item.routeId}`}
              title={routes[item.routeId]?.name}
            >
              <RouteBullet routeId={item.routeId} />
            </button>
          ))}
        </div>
        {groups.length > 0 && (
          <div className="shared-line-options">
            {groups.map((group) => {
              const selected = routeIds.length === group.length && group.every((routeId) => routeIds.includes(routeId));
              return (
                <button
                  key={group.join("-")}
                  type="button"
                  className={selected ? "shared-line-option is-selected" : "shared-line-option"}
                  onClick={() => onLineGroupChange(group)}
                  aria-pressed={selected}
                  title={`GTFS confirms a shared directed segment for ${group.join(" / ")}`}
                >
                  <span>Any line</span>
                  <small>{group.join(" / ")} · shared segment</small>
                </button>
              );
            })}
          </div>
        )}
      </fieldset>

      <fieldset className="field-group">
        <legend>Direction</legend>
        <div className="direction-options">
          {directions.map((value) => {
            const label = directionDisplay(station, routeIds, value);
            return (
              <button
                key={value}
                type="button"
                className={value === direction ? "direction-option is-selected" : "direction-option"}
                onClick={() => onDirectionChange(value)}
                aria-pressed={value === direction}
                title={label.full}
              >
                <span>{label.short}</span>
                  {!selectedRoute?.directionNames?.[value] && <small>{value}</small>}
              </button>
            );
          })}
        </div>
      </fieldset>

      {timetableDays && timetableDay && onTimetableDayChange && (
        <fieldset className="field-group timetable-day-field">
          <legend>Day of week</legend>
          <div className="day-options">
            {timetableDays.map((value) => (
              <button
                key={value}
                type="button"
                className={value === timetableDay ? "day-option is-selected" : "day-option"}
                onClick={() => onTimetableDayChange(value)}
                aria-pressed={value === timetableDay}
              >
                {timetableDayLabels[value]}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </section>
  );
}
