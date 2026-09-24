import type { StrictTime } from "./domain/strict-time";
import type { IdentityStability } from "./domain/resolver";

/** Provider-scoped direction ID (for example MTA N/S or GTFS 0/1). */
export type Direction = string;
export type TimetableDayType = "weekday" | "saturday" | "sunday";
export type DelayStatus = "early" | "on-time" | "mild" | "noticeable" | "official" | "undetermined";

export interface Route {
  id: string;
  name: string;
  label?: string;
  color: string;
  textColor: string;
}

export interface StationRoute {
  routeId: string;
  directions: Direction[];
  /** GTFS trip_headsign values actually serving this stop, by GTFS stop direction. */
  headsigns?: Partial<Record<Direction, string[]>>;
  /** Directed adjacent stop pairs used by this route at this stop. */
  adjacentSegments?: Partial<Record<Direction, string[]>>;
  /** GTFS child boarding stops included in this station/route/direction. */
  stopIds?: Partial<Record<Direction, string[]>>;
  /** Provider-published wayfinding label, if available. */
  directionNames?: Partial<Record<Direction, string>>;
  /** Explicitly configured origins; do not infer a trip path from this metadata. */
  originDirections?: Direction[];
}

export interface Station {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  routes: StationRoute[];
}

export interface Arrival {
  id: string;
  tripId: string | null;
  identityStability?: IdentityStability;
  timeSource?: "schedule" | "prediction";
  /** A direction label must not claim to be this particular train's destination. */
  destinationKind?: "destination" | "direction";
  routeId: string | null;
  stopId: string | null;
  stopSequence?: number | null;
  direction: Direction | null;
  destinationId: string | null;
  destinationName: string | null;
  eventTime: number;
  eventKind: "arrival" | "departure";
  scheduledTime: number | null;
  delaySeconds: number | null;
  delayStatus: DelayStatus;
  delayLabel: string;
  /** Optional semantic time; legacy MTA projection still uses eventTime. */
  displayTime?: StrictTime;
}

export interface ArrivalSnapshot {
  arrivals: Arrival[];
  /** Null when the source does not publish its own generation timestamp. */
  feedTimestamp: number | null;
  fetchedAt: number;
  unavailableRoutes?: string[];
}

export type ArrivalLoader = (
  stationId: string,
  routeIds: readonly string[],
  direction: Direction,
  signal?: AbortSignal,
) => Promise<ArrivalSnapshot>;

export interface TimetableEvent {
  seconds: number;
  minute: string;
  hasHalfMinute: boolean;
  exactTime: string;
  eventKind: "arrival" | "departure";
  routeId?: string;
}

export interface TimetableHour {
  hour: number;
  events: TimetableEvent[];
}

export interface TimetableResult {
  dateKey: string;
  dayType: TimetableDayType;
  availableDays: TimetableDayType[];
  hours: TimetableHour[];
  scheduledTrainCount: number;
}
