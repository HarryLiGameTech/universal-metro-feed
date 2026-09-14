import { useQuery } from "@tanstack/react-query";
import { fetchArrivals } from "../lib/mta";
import type { Direction } from "../types";

export const REFRESH_INTERVAL_MS = 5_000;

export function useArrivals(stationId: string, routeId: string, direction: Direction) {
  return useQuery({
    queryKey: ["mta-arrivals", stationId, routeId, direction],
    queryFn: ({ signal }) => fetchArrivals(stationId, routeId, direction, signal),
    refetchInterval: REFRESH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
    staleTime: 0,
    retry: 2,
  });
}
