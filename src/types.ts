export type Direction = "N" | "S";
export type TimetableDayType = "weekday" | "saturday" | "sunday";
export type DelayStatus = "early" | "on-time" | "mild" | "noticeable" | "official" | "undetermined";

export interface Route {
  id: string;
  name: string;
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
}

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: StationRoute[];
}

export interface Arrival {
  id: string;
  tripId: string;
  routeId: string;
  stopId: string;
  direction: Direction;
  destinationId: string | null;
  destinationName: string;
  eventTime: number;
  eventKind: "arrival" | "departure";
  scheduledTime: number | null;
  delaySeconds: number | null;
  delayStatus: DelayStatus;
  delayLabel: string;
}

export interface ArrivalSnapshot {
  arrivals: Arrival[];
  feedTimestamp: number;
  fetchedAt: number;
  unavailableRoutes?: string[];
}

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
