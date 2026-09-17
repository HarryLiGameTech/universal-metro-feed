import { useQuery } from "@tanstack/react-query";
import { fetchComposedMtaArrivalsForRoutes } from "../providers/mta/composed-resolver";
import type { Direction } from "../types";

export const REFRESH_INTERVAL_MS = 5_000;

export function useArrivals(stationId: string, routeIds: readonly string[], direction: Direction) {
  return useQuery({
    queryKey: ["mta-arrivals", stationId, routeIds, direction],
    queryFn: ({ signal }) => fetchComposedMtaArrivalsForRoutes(stationId, routeIds, direction, signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
    staleTime: 0,
    retry: 2,
  });
}
