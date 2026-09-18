import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ChevronDown, ExternalLink } from "lucide-react";
import type { Direction } from "./types";
import { isSharedLineGroup } from "./lib/platform-selection";
import { CatalogContext } from "./providers/catalog-context";
import { loadProviderCatalog, loadProviderManifest, loadProviderRegistry, type ProviderCatalog, type ProviderDescriptor, type ProviderManifest } from "./providers/registry";
import { ArrivalBoard } from "./components/ArrivalBoard";
import { SelectorPanel } from "./components/SelectorPanel";
import { StaticTimetableSection } from "./components/StaticTimetableSection";
import { runtimeForProvider, type ProviderRuntime } from "./providers/runtime";
import "./styles.css";

export default function App() {
  const [providerId, setProviderId] = useState("mta-subway");
  const registry = useQuery({
    queryKey: ["provider-registry"],
    queryFn: loadProviderRegistry,
    staleTime: Infinity,
    retry: 1,
  });
  const descriptor = registry.data?.providers.find((provider) => provider.id === providerId);
  const selectedProvider = useQuery({
    queryKey: ["provider", providerId],
    queryFn: async () => {
      if (!descriptor) throw new Error(`Provider ${providerId} is not configured.`);
      const manifest = await loadProviderManifest(descriptor);
      const catalog = await loadProviderCatalog(manifest.topology.catalogUrl, descriptor.id);
      return { catalog, manifest, runtime: await runtimeForProvider(manifest) };
    },
    enabled: descriptor != null,
    staleTime: Infinity,
    retry: 1,
  });

  if (registry.isPending) {
    return <main><div className="board-message">Loading subway stations…</div></main>;
  }
  if (registry.isError) {
    return <main><div className="board-message board-message--error">{registry.error.message}</div></main>;
  }
  if (selectedProvider.isPending || selectedProvider.isError || !descriptor || !selectedProvider.data) {
    return <main>
      <nav className="topbar" aria-label="Primary">
        <a className="brand" href="/"><Activity aria-hidden="true" /><span>On The Platform</span></a>
        <ProviderSelect providers={registry.data.providers} providerId={providerId} onProviderChange={setProviderId} />
      </nav>
      <div className={selectedProvider.isError ? "board-message board-message--error" : "board-message"}>
        {selectedProvider.isError ? selectedProvider.error.message : "Loading subway stations…"}
      </div>
    </main>;
  }

  return (
    <CatalogContext.Provider value={selectedProvider.data.catalog}>
      <ProviderApp
        key={providerId}
        descriptor={descriptor}
        providers={registry.data.providers}
        catalog={selectedProvider.data.catalog}
        manifest={selectedProvider.data.manifest}
        runtime={selectedProvider.data.runtime}
        providerId={providerId}
        onProviderChange={setProviderId}
      />
    </CatalogContext.Provider>
  );
}

function ProviderApp({ descriptor, providers, catalog, manifest, runtime, providerId, onProviderChange }: {
  descriptor: ProviderDescriptor;
  providers: ProviderDescriptor[];
  catalog: ProviderCatalog;
  manifest: ProviderManifest;
  runtime: ProviderRuntime;
  providerId: string;
  onProviderChange(id: string): void;
}) {
  const stations = catalog.stations;
  const firstStation = stations[0] ?? (() => {
    throw new Error("The provider station catalog is empty.");
  })();
  const defaultStationId = manifest.defaultStationId && stations.some((station) => station.id === manifest.defaultStationId)
    ? manifest.defaultStationId : firstStation.id;
  const [stationId, setStationId] = useState(defaultStationId);
  const station = useMemo(
    () => stations.find((item) => item.id === stationId) ?? firstStation,
    [stationId],
  );
  const initialRoute = station.routes[0];
  if (!initialRoute) throw new Error(`No routes found for station ${station.id}.`);
  const [routeIds, setRouteIds] = useState<string[]>([initialRoute.routeId]);
  const [direction, setDirection] = useState<Direction>(initialRoute.directions[0] ?? "");

  const selectPlatform = useCallback((nextStationId: string, nextRouteId?: string, nextDirection?: Direction) => {
    const nextStation = stations.find((item) => item.id === nextStationId);
    if (!nextStation) throw new Error(`Unknown station: ${nextStationId}`);
    const nextRoute = nextStation.routes.find((item) => item.routeId === nextRouteId) ?? nextStation.routes[0];
    if (!nextRoute) throw new Error(`No routes found for station ${nextStationId}`);
    const resolvedDirection = nextDirection ?? nextRoute.directions[0] ?? "";
    if (!nextRoute.directions.includes(resolvedDirection)) {
      throw new Error(`${nextRoute.routeId} does not serve ${nextStation.name} in direction ${resolvedDirection}`);
    }
    setStationId(nextStationId);
    setRouteIds([nextRoute.routeId]);
    setDirection(resolvedDirection);
  }, []);

  const selectStation = useCallback((nextStationId: string) => {
    selectPlatform(nextStationId);
  }, [selectPlatform]);

  function selectRoute(nextRouteId: string) {
    const nextRoute = station.routes.find((item) => item.routeId === nextRouteId);
    if (!nextRoute) return;
    setRouteIds([nextRouteId]);
    if (!nextRoute.directions.includes(direction)) setDirection(nextRoute.directions[0] ?? "");
  }

  function selectLineGroup(nextRouteIds: string[]) {
    if (isSharedLineGroup(station, direction, nextRouteIds)) setRouteIds(nextRouteIds);
  }

  function selectDirection(nextDirection: Direction) {
    if (routeIds.length > 1 && !isSharedLineGroup(station, nextDirection, routeIds)) {
      const fallbackRoute = station.routes.find((item) => routeIds.includes(item.routeId) && item.directions.includes(nextDirection));
      if (!fallbackRoute) return;
      setRouteIds([fallbackRoute.routeId]);
    } else if (!station.routes.some((item) => item.routeId === routeIds[0] && item.directions.includes(nextDirection))) {
      return;
    }
    setDirection(nextDirection);
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
          stationId: { type: "string", description: "A parent station stop ID from the selected provider." },
          routeId: { type: "string", description: "A route ID serving that station." },
          direction: { type: "string", description: "A direction ID supplied by the selected provider." },
        },
        required: ["stationId", "routeId", "direction"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== "object") throw new Error("A platform selection is required.");
        const values = input as Record<string, unknown>;
        if (typeof values.stationId !== "string" || typeof values.routeId !== "string" ||
            typeof values.direction !== "string") {
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
        <div className="topbar-actions">
          <ProviderSelect providers={providers} providerId={providerId} onProviderChange={onProviderChange} />
          {manifest.sourceUrl && <a className="source-link" href={manifest.sourceUrl} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" size={16} />
            Data source
          </a>}
        </div>
      </nav>

      <header className="intro">
        <p className="section-kicker">{descriptor.introduction?.kicker ?? `${descriptor.names.en ?? descriptor.id} · direct from the source`}</p>
        <h1>The next train,<br /><em>without the wait.</em></h1>
        <p>{descriptor.introduction?.description ?? "Live arrival estimates and scheduled service."}</p>
      </header>

      <div className="workspace">
        <SelectorPanel
          idPrefix="realtime"
          station={station}
          routeIds={routeIds}
          direction={direction}
          onStationChange={selectStation}
          onRouteChange={selectRoute}
          onLineGroupChange={selectLineGroup}
          onDirectionChange={selectDirection}
        />
        <ArrivalBoard providerId={catalog.providerId} timezone={manifest.timezone} runtime={runtime} station={station} routeIds={routeIds} direction={direction} />
      </div>

      <StaticTimetableSection key={providerId} timezone={manifest.timezone} locality={descriptor.introduction?.locality ?? manifest.timezone} loadTimetable={runtime.loadTimetable} defaultStationId={defaultStationId} />

      <footer className="page-footer">
        <span>Times shown in {descriptor.introduction?.locality ?? manifest.timezone} local time.</span>
        <span>Not affiliated with {descriptor.introduction?.attribution ?? descriptor.names.en ?? descriptor.id}.</span>
      </footer>
    </main>
  );
}

function ProviderSelect({ providers, providerId, onProviderChange }: {
  providers: ProviderDescriptor[];
  providerId: string;
  onProviderChange(id: string): void;
}) {
  return <label className="provider-select" htmlFor="provider-choice">
    <span>Provider</span>
    <span className="provider-select-shell">
      <select id="provider-choice" value={providerId} onChange={(event) => onProviderChange(event.target.value)}>
        {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.names.en ?? provider.id}</option>)}
      </select>
      <ChevronDown aria-hidden="true" size={15} />
    </span>
  </label>;
}
