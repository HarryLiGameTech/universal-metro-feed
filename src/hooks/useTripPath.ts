import { useQuery } from "@tanstack/react-query";
import type { TripPathLoader, TripPathQuery } from "../domain/trip-path";

export function useTripPath(query: TripPathQuery, loadTripPath: TripPathLoader) {
  return useQuery({
    queryKey: ["trip-path", query.providerId, query.stationId, query.routeId, query.directionId, query.tripId],
    queryFn: ({ signal }) => loadTripPath(query, signal),
    refetchInterval: 5_000,
    refetchOnWindowFocus: "always",
    retry: 1,
  });
}
