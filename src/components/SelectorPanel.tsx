import { ChevronDown } from "lucide-react";
import { routes, stations } from "../data/stations.generated";
import type { Direction, Station } from "../types";
import { RouteBullet } from "./RouteBullet";

interface SelectorPanelProps {
  station: Station;
  routeId: string;
  direction: Direction;
  onStationChange(stationId: string): void;
  onRouteChange(routeId: string): void;
  onDirectionChange(direction: Direction): void;
}

export function SelectorPanel({
  station,
  routeId,
  direction,
  onStationChange,
  onRouteChange,
  onDirectionChange,
}: SelectorPanelProps) {
  const selectedRoute = station.routes.find((item) => item.routeId === routeId) ?? station.routes[0];
  const directions = selectedRoute?.directions ?? ["N", "S"];

  return (
    <section className="selector-panel" aria-labelledby="selector-title">
      <div className="section-kicker">Choose your platform</div>
      <h2 id="selector-title">Where are you waiting?</h2>

      <div className="field-group">
        <label htmlFor="station">Station</label>
        <div className="select-shell">
          <select
            id="station"
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
              className={item.routeId === routeId ? "route-option is-selected" : "route-option"}
              onClick={() => onRouteChange(item.routeId)}
              aria-pressed={item.routeId === routeId}
              title={routes[item.routeId as keyof typeof routes]?.name}
            >
              <RouteBullet routeId={item.routeId} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="field-group">
        <legend>Direction</legend>
        <div className="direction-options">
          {directions.map((value) => (
            <button
              key={value}
              type="button"
              className={value === direction ? "direction-option is-selected" : "direction-option"}
              onClick={() => onDirectionChange(value)}
              aria-pressed={value === direction}
            >
              <span>{value === "N" ? "Northbound" : "Southbound"}</span>
              <small>{value === "N" ? "Uptown / Bronx" : "Downtown / Brooklyn"}</small>
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
