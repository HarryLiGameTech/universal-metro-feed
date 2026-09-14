import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ExternalLink } from "lucide-react";
import { stations } from "./data/stations.generated";
import type { Direction } from "./types";
import { ArrivalBoard } from "./components/ArrivalBoard";
import { SelectorPanel } from "./components/SelectorPanel";
import "./styles.css";

const firstStation = stations[0] ?? (() => {
  throw new Error("The generated station index is empty.");
})();
const DEFAULT_STATION_ID = stations.some((station) => station.id === "127") ? "127" : firstStation.id;

export default function App() {
  const [stationId, setStationId] = useState(DEFAULT_STATION_ID);
  const station = useMemo(
    () => stations.find((item) => item.id === stationId) ?? firstStation,
    [stationId],
  );
  const initialRoute = station.routes[0];
  if (!initialRoute) throw new Error(`No routes found for station ${station.id}.`);
  const [routeId, setRouteId] = useState(initialRoute.routeId);
  const [direction, setDirection] = useState<Direction>(initialRoute.directions[0] ?? "N");

  const selectPlatform = useCallback((nextStationId: string, nextRouteId?: string, nextDirection?: Direction) => {
    const nextStation = stations.find((item) => item.id === nextStationId);
    if (!nextStation) throw new Error(`Unknown station: ${nextStationId}`);
    const nextRoute = nextStation.routes.find((item) => item.routeId === nextRouteId) ?? nextStation.routes[0];
    if (!nextRoute) throw new Error(`No routes found for station ${nextStationId}`);
    const resolvedDirection = nextDirection ?? nextRoute.directions[0] ?? "N";
    if (!nextRoute.directions.includes(resolvedDirection)) {
      throw new Error(`${nextRoute.routeId} does not serve ${nextStation.name} in direction ${resolvedDirection}`);
    }
    setStationId(nextStationId);
    setRouteId(nextRoute.routeId);
    setDirection(resolvedDirection);
  }, []);

  const selectStation = useCallback((nextStationId: string) => {
    selectPlatform(nextStationId);
  }, [selectPlatform]);

  function selectRoute(nextRouteId: string) {
    const nextRoute = station.routes.find((item) => item.routeId === nextRouteId);
    if (!nextRoute) return;
    setRouteId(nextRouteId);
    if (!nextRoute.directions.includes(direction)) setDirection(nextRoute.directions[0] ?? "N");
  }

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();

    void Promise.resolve(context.registerTool({
      name: "select_subway_platform",
      title: "Select subway platform",
      description: "Select a station, train line, and direction in the visible realtime arrival board.",
      inputSchema: {
        type: "object",
        properties: {
          stationId: { type: "string", description: "MTA parent station stop ID, for example 127." },
          routeId: { type: "string", description: "Subway route ID, for example 1, A, or N." },
          direction: { type: "string", enum: ["N", "S"] },
        },
        required: ["stationId", "routeId", "direction"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== "object") throw new Error("A platform selection is required.");
        const values = input as Record<string, unknown>;
        if (typeof values.stationId !== "string" || typeof values.routeId !== "string" ||
            (values.direction !== "N" && values.direction !== "S")) {
          throw new Error("stationId, routeId, and direction must be valid strings.");
        }
        selectPlatform(values.stationId, values.routeId, values.direction);
        return { stationId: values.stationId, routeId: values.routeId, direction: values.direction };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);

    return () => lifecycle.abort();
  }, [selectPlatform]);

  return (
    <main>
      <nav className="topbar" aria-label="Primary">
        <a className="brand" href="/">
          <Activity aria-hidden="true" />
          <span>On The Platform</span>
        </a>
        <a className="source-link" href="https://api.mta.info/" target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" size={16} />
          MTA data source
        </a>
      </nav>

      <header className="intro">
        <p className="section-kicker">NYC subway · direct from the source</p>
        <h1>The next train,<br /><em>without the wait.</em></h1>
        <p>Exact arrival and departure times from the MTA feed, refreshed every five seconds.</p>
      </header>

      <div className="workspace">
        <SelectorPanel
          station={station}
          routeId={routeId}
          direction={direction}
          onStationChange={selectStation}
          onRouteChange={selectRoute}
          onDirectionChange={setDirection}
        />
        <ArrivalBoard station={station} routeId={routeId} direction={direction} />
      </div>

      <footer className="page-footer">
        <span>Times shown in New York local time.</span>
        <span>Not affiliated with the MTA.</span>
      </footer>
    </main>
  );
}
