export type Direction = "N" | "S";
export type TimetableDayType = "weekday" | "saturday" | "sunday";

export interface Route {
  id: string;
  name: string;
  color: string;
  textColor: string;
}

export interface StationRoute {
  routeId: string;
  directions: Direction[];
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
}

export interface ArrivalSnapshot {
  arrivals: Arrival[];
  feedTimestamp: number;
  fetchedAt: number;
}

export interface TimetableEvent {
  seconds: number;
  minute: string;
  hasHalfMinute: boolean;
  exactTime: string;
  eventKind: "arrival" | "departure";
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
