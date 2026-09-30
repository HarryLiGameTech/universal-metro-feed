import { estimatedTime } from "../../domain/strict-time";
import type { Arrival, ArrivalSnapshot } from "../../types";
import { catalogUrlForProvider, loadProviderCatalog, type ProviderManifest } from "../registry";
import type { ProviderRuntime } from "../runtime";
import { pathClockfaceTimetableLoader } from "./clockface-timetable";

const OFFICIAL_FEED = "https://www.panynj.gov/bin/portauthority/ridepath.json";
const ROUTE_ID = "PATH";

interface PathPrediction {
  stationId: string;
  direction: "ToNJ" | "ToNY";
  target: string | null;
  headsign: string | null;
  arrivalTimeMessage: string | null;
  observedAt: number;
  eventTime: number;
}

function record(value: unknown, description: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid PATH ${description}.`);
  }
  return value as Record<string, unknown>;
}

function nonemptyString(value: unknown, description: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid PATH ${description}.`);
  return value;
}

function optionalString(value: unknown, description: string): string | null {
  if (value == null || value === "") return null;
  return nonemptyString(value, description);
}

/** The source predicts a station arrival, not a uniquely identified trip or platform. */
export function decodeRidePath(value: unknown): PathPrediction[] {
  const root = record(value, "feed");
  if (!Array.isArray(root.results)) throw new Error("Invalid PATH station results.");
  const predictions: PathPrediction[] = [];
  for (const stationValue of root.results) {
    const station = record(stationValue, "station");
    const stationId = nonemptyString(station.consideredStation, "station ID");
    if (!Array.isArray(station.destinations)) throw new Error("Invalid PATH station directions.");
    for (const directionValue of station.destinations) {
      const destination = record(directionValue, "direction");
      if (destination.label !== "ToNJ" && destination.label !== "ToNY") {
        throw new Error("Unknown PATH direction label.");
      }
      if (!Array.isArray(destination.messages)) throw new Error("Invalid PATH arrival messages.");
      for (const messageValue of destination.messages) {
        const message = record(messageValue, "arrival message");
        const secondsText = nonemptyString(message.secondsToArrival, "seconds to arrival");
        if (!/^\d+$/.test(secondsText)) throw new Error("Invalid PATH seconds to arrival.");
        const secondsToArrival = Number(secondsText);
        if (!Number.isSafeInteger(secondsToArrival)) throw new Error("Invalid PATH seconds to arrival.");
        const lastUpdated = nonemptyString(message.lastUpdated, "last updated timestamp");
        if (!/(?:Z|[+-]\d{2}:\d{2})$/.test(lastUpdated)) throw new Error("PATH timestamp has no timezone.");
        const observedAt = Date.parse(lastUpdated) / 1_000;
        if (!Number.isFinite(observedAt)) throw new Error("Invalid PATH last updated timestamp.");
        predictions.push({
          stationId,
          direction: destination.label,
          target: optionalString(message.target, "target"),
          headsign: optionalString(message.headSign, "headsign"),
          arrivalTimeMessage: optionalString(message.arrivalTimeMessage, "arrival status"),
          observedAt,
          eventTime: observedAt + secondsToArrival,
        });
      }
    }
  }
  return predictions;
}

/** Browser access uses a same-origin proxy because the official endpoint has no CORS header. */
export function createPathRuntime(manifest: ProviderManifest): ProviderRuntime {
  if (manifest.id !== "path-rail" || manifest.predictions.kind !== "proprietary-http" ||
      manifest.predictions.adapter !== "path-ridepath" || manifest.predictions.urlTemplate !== OFFICIAL_FEED ||
      manifest.schedule.kind !== "clockface" || manifest.topology.kind !== "station-directory") {
    throw new Error("PATH requires its official RidePATH source and station directory.");
  }
  const accessUrl = import.meta.env.VITE_PATH_ACCESS_URL || manifest.predictions.accessUrl;
  const catalogUrl = catalogUrlForProvider(manifest);
  const loadTimetable = pathClockfaceTimetableLoader({
    baseUrl: import.meta.env.VITE_CLOCKFACE_BASE_URL || manifest.schedule.baseUrl,
    runId: import.meta.env.VITE_PATH_CLOCKFACE_RUN_ID || manifest.schedule.runId,
  });

  async function loadArrivals(stationId: string, routeIds: readonly string[], direction: string, signal?: AbortSignal): Promise<ArrivalSnapshot> {
    if (!accessUrl) throw new Error("The PATH feed proxy has not been configured for this website yet.");
    if (!accessUrl.startsWith("/") || accessUrl.startsWith("//")) throw new Error("The PATH feed proxy must be a same-origin path.");
    if (routeIds.length !== 1 || routeIds[0] !== ROUTE_ID) throw new Error("Select the PATH service.");
    const catalog = await loadProviderCatalog(catalogUrl, manifest.id);
    const station = catalog.stations.find((item) => item.id === stationId);
    if (!station?.routes.some((item) => item.routeId === ROUTE_ID && item.directions.includes(direction))) {
      throw new Error("Select a PATH station and direction from the station directory.");
    }
    signal?.throwIfAborted();
    const response = await fetch(accessUrl, {
      cache: "no-store", signal, headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`PATH live times request failed (${response.status}).`);
    const predictions = decodeRidePath(await response.json())
      .filter((row) => row.stationId === stationId && row.direction === direction)
      .sort((left, right) => left.eventTime - right.eventTime);
    signal?.throwIfAborted();
    const arrivals: Arrival[] = predictions.map((row, index) => {
      const delayed = row.arrivalTimeMessage?.toLowerCase() === "delayed";
      return {
        id: `${stationId}:${direction}:${row.target ?? ""}:${row.eventTime}:${index}`,
        tripId: null,
        identityStability: "snapshot-only",
        timeSource: "prediction",
        routeId: ROUTE_ID,
        stopId: stationId,
        direction,
        destinationId: row.target,
        destinationName: row.headsign,
        destinationKind: "destination",
        eventTime: row.eventTime,
        eventKind: "arrival",
        scheduledTime: null,
        delaySeconds: null,
        delayStatus: delayed ? "official" : "undetermined",
        delayLabel: delayed ? "Delayed (PATH)" : "Schedule comparison unavailable",
        displayTime: estimatedTime(row.eventTime, manifest.timezone, "second"),
      };
    });
    return {
      arrivals,
      feedTimestamp: predictions.length ? Math.min(...predictions.map((row) => row.observedAt)) : null,
      fetchedAt: Date.now() / 1_000,
    };
  }

  return {
    loadArrivals,
    loadTripPath: null,
    loadTimetable,
    arrivalSource: "prediction",
    feedLabel: "PATH live times",
    refreshIntervalMs: manifest.refreshIntervalMs ?? 15_000,
    suppressApproximationMark: true,
  };
}
