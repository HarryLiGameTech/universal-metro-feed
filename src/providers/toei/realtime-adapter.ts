import { mappedGtfsArrivals } from "../gtfs-realtime/mapped-arrivals";
import { fetchGtfsRealtimeFeed } from "../gtfs-realtime/source";
import { loadGtfsTripMap, type GtfsTripMap } from "../gtfs-realtime/trip-map";
import { loadProviderCatalog, type ProviderManifest } from "../registry";
import type { ProviderRuntime } from "../runtime";

export const toeiArrivals = mappedGtfsArrivals;

export function createToeiRuntime(manifest: ProviderManifest): ProviderRuntime {
  if (manifest.predictions.kind !== "gtfs-realtime" || manifest.predictions.adapter !== "toei" ||
      !manifest.predictions.urlTemplate || manifest.topology.kind !== "gtfs-static" ||
      !manifest.topology.tripMapUrl || manifest.schedule.kind !== "none") {
    throw new Error("Toei requires a TripUpdate URL and static station mappings.");
  }
  const url = manifest.predictions.urlTemplate;
  const { catalogUrl, tripMapUrl } = manifest.topology;
  let reference: Promise<GtfsTripMap> | undefined;
  const mapping = () => reference ??= loadGtfsTripMap(tripMapUrl, manifest.id).catch((error: unknown) => {
    reference = undefined;
    throw error;
  });
  return {
    arrivalScope: "platform",
    loadArrivals: async (stationId, routeIds, direction, signal) => {
      const catalog = await loadProviderCatalog(catalogUrl, manifest.id);
      const station = catalog.stations.find((station) => station.id === stationId);
      const routes = routeIds.map((routeId) => station?.routes.find((route) =>
        route.routeId === routeId && route.directions.includes(direction)));
      if (!station || routes.length === 0 || routes.some((route) => !route)) throw new Error("Select a valid station, line, and direction.");
      const stopsByRoute = new Map(routes.map((route) => [route!.routeId, new Set(route!.stopIds?.[direction] ?? [])]));
      signal?.throwIfAborted();
      const [feed, map] = await Promise.all([fetchGtfsRealtimeFeed(url, signal), mapping()]);
      signal?.throwIfAborted();
      const snapshot = mappedGtfsArrivals(feed, manifest.timezone, map);
      return {
        ...snapshot,
        arrivals: snapshot.arrivals.filter((arrival) => arrival.routeId != null && arrival.stopId != null &&
          arrival.direction === direction && stopsByRoute.get(arrival.routeId)?.has(arrival.stopId)),
      };
    },
    loadTripPath: null,
    loadTimetable: null,
    arrivalSource: "prediction",
    feedLabel: "Toei feed",
    refreshIntervalMs: manifest.refreshIntervalMs ?? 10_000,
  };
}
