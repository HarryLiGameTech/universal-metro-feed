import { assetUrl } from "../../lib/asset-url";
import { gtfsClockfaceTimetableLoader } from "../clockface/gtfs-timetable";
import { fetchGtfsRealtimeFeed } from "../gtfs-realtime/source";
import { loadProviderCatalog, type ProviderManifest } from "../registry";
import type { ProviderRuntime } from "../runtime";
import { loadToeiTripMap } from "../toei/trip-map";
import { mappedGtfsArrivals } from "../toei/realtime-adapter";

export function gtfsRailRuntime(manifest: ProviderManifest): ProviderRuntime {
  if ((manifest.id !== "bart" && manifest.id !== "cta") || manifest.topology.kind !== "gtfs-static" ||
      manifest.schedule.kind !== "clockface" || manifest.predictions.kind !== "gtfs-realtime") {
    throw new Error("This rail provider requires a GTFS station catalog and Clockface timetable.");
  }
  const baseUrl = import.meta.env.VITE_CLOCKFACE_BASE_URL || manifest.schedule.baseUrl;
  const runId = manifest.id === "bart"
    ? import.meta.env.VITE_BART_CLOCKFACE_RUN_ID || manifest.schedule.runId
    : import.meta.env.VITE_CTA_CLOCKFACE_RUN_ID || manifest.schedule.runId;
  const configuredAccessUrl = manifest.id === "bart"
    ? import.meta.env.VITE_BART_GTFSRT_ACCESS_URL || manifest.predictions.accessUrl
    : import.meta.env.VITE_CTA_GTFSRT_ACCESS_URL || manifest.predictions.accessUrl;
  // CTA's official GTFS-RT endpoint requires a server-held key. An unconfigured
  // access URL leaves its live panel absent; it never exposes a key in the bundle.
  const accessUrl = configuredAccessUrl ? assetUrl(configuredAccessUrl) : null;
  const { catalogUrl, tripMapUrl } = manifest.topology;
  let mapPromise: ReturnType<typeof loadToeiTripMap> | undefined;
  const map = () => {
    if (!tripMapUrl) throw new Error("GTFS trip mapping is not configured.");
    return mapPromise ??= loadToeiTripMap(tripMapUrl, manifest.id).then((tripMap) => manifest.id === "bart"
      // BART's current ZIP advertises an August feed_end_date while its own
      // service calendar extends through January; retain exact trip IDs here.
      ? { ...tripMap, source: { ...tripMap.source, feedEndDate: null } } : tripMap).catch((error: unknown) => {
      mapPromise = undefined;
      throw error;
    });
  };

  return {
    showRealtime: accessUrl !== null && tripMapUrl !== undefined,
    arrivalScope: "platform",
    loadArrivals: async (stationId, routeIds, direction, signal) => {
      if (!accessUrl) throw new Error(`${manifest.id.toUpperCase()} GTFS-Realtime access is not configured.`);
      const catalog = await loadProviderCatalog(catalogUrl, manifest.id);
      const station = catalog.stations.find((item) => item.id === stationId);
      const routes = routeIds.map((routeId) => station?.routes.find((route) =>
        route.routeId === routeId && route.directions.includes(direction)));
      if (!station || !routes.length || routes.some((route) => !route)) {
        throw new Error("Select a valid station, line, and direction.");
      }
      const stopsByRoute = new Map(routes.map((route) => [route!.routeId, new Set(route!.stopIds?.[direction] ?? [])]));
      const [feed, tripMap] = await Promise.all([fetchGtfsRealtimeFeed(accessUrl, signal), map()]);
      signal?.throwIfAborted();
      const snapshot = mappedGtfsArrivals(feed, manifest.timezone, tripMap);
      return {
        ...snapshot,
        arrivals: snapshot.arrivals.filter((arrival) => arrival.routeId != null && arrival.stopId != null &&
          arrival.direction === direction && stopsByRoute.get(arrival.routeId)?.has(arrival.stopId)),
      };
    },
    loadTripPath: null,
    loadTimetable: gtfsClockfaceTimetableLoader(manifest, baseUrl, runId),
    arrivalSource: "prediction",
    feedLabel: `${manifest.id.toUpperCase()} GTFS-Realtime feed`,
    refreshIntervalMs: manifest.refreshIntervalMs ?? 15_000,
  };
}
