import type { Arrival } from "../types";

/** Stable GTFS trip identity; a realtime feed entity ID may rotate on refresh. */
export function arrivalIdentity(arrival: Pick<Arrival, "routeId" | "direction" | "tripId">) {
  return `${arrival.routeId}:${arrival.direction}:${arrival.tripId}`;
}

export interface VisibleArrival {
  arrival: Arrival;
  retained: boolean;
  fromFeed: boolean;
}

/** Keep an expanded train visible even if it leaves the top-four window. */
export function visibleArrivals(
  feedArrivals: readonly Arrival[],
  nowSeconds: number,
  expandedArrival: Arrival | null,
  limit = 4,
): VisibleArrival[] {
  const upcoming = feedArrivals.filter((arrival) => arrival.eventTime >= nowSeconds - 5).slice(0, limit);
  const visible = upcoming.map((arrival) => ({ arrival, retained: false, fromFeed: true }));
  if (!expandedArrival) return visible;
  const identity = arrivalIdentity(expandedArrival);
  if (visible.some((entry) => arrivalIdentity(entry.arrival) === identity)) return visible;
  const refreshed = feedArrivals.find((arrival) => arrivalIdentity(arrival) === identity);
  visible.push({ arrival: refreshed ?? expandedArrival, retained: true, fromFeed: refreshed != null });
  return visible;
}
