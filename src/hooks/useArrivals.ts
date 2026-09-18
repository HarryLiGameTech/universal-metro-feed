import { useQuery } from "@tanstack/react-query";
import type { ArrivalLoader, Direction } from "../types";

export const REFRESH_INTERVAL_MS = 5_000;

export function useArrivals(providerId: string, stationId: string, routeIds: readonly string[], direction: Direction, load: ArrivalLoader, refreshIntervalMs = REFRESH_INTERVAL_MS) {
  return useQuery({
    queryKey: ["arrivals", providerId, stationId, routeIds, direction],
    queryFn: ({ signal }) => load(stationId, routeIds, direction, signal),
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
    staleTime: 0,
    retry: 2,
  });
}
