import { useQuery } from "@tanstack/react-query";
import type { TripPathLoader, TripPathQuery } from "../domain/trip-path";

export function useTripPath(query: TripPathQuery, loadTripPath: TripPathLoader, refreshIntervalMs = 5_000) {
  return useQuery({
    queryKey: ["trip-path", query.providerId, query.stationId, query.routeId, query.directionId, query.tripId],
    queryFn: ({ signal }) => loadTripPath(query, signal),
    refetchInterval: refreshIntervalMs,
    refetchOnWindowFocus: "always",
    retry: 1,
  });
}
