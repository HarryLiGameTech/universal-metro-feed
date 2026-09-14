export type Direction = "N" | "S";

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
