import type { StrictTime } from "./strict-time";
import type { PlatformQuery, Resolved } from "./resolver";
import type { DelayStatus } from "../types";

export interface TripPathQuery extends PlatformQuery {
  tripId: string;
  entityId: string;
  anchorEventTime: number;
  anchorEventKind: "arrival" | "departure";
}

export interface TripStopTime {
  time: StrictTime;
  source: "prediction" | "schedule";
}

export interface TripPathStop {
  stopId: string;
  name: string;
  sequence: number;
  position: "past" | "current" | "ahead";
  arrival: TripStopTime | null;
  departure: TripStopTime | null;
  /** Retained so an expired prediction can fall back without inventing a live time. */
  scheduledArrival: TripStopTime | null;
  scheduledDeparture: TripStopTime | null;
  /** Comparable live-versus-static departure status; also colors a live arrival. */
  departureDelayStatus: DelayStatus | null;
}

export interface TripPath {
  tripId: string;
  topology: "full" | "partial";
  stops: TripPathStop[];
}

export type TripPathLoader = (query: TripPathQuery, signal?: AbortSignal) => Promise<Resolved<TripPath>>;
