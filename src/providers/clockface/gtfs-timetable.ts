import { assetUrl } from "../../lib/asset-url";
import {
  availableTimetableDays, dateKeyInTimezone, findTimetableDate, renderTimetable,
  type CalendarPayload, type TimetableShard,
} from "../../lib/timetable";
import { loadProviderCatalog, type ProviderManifest } from "../registry";
import type { TimetableLoader } from "../runtime";
import { clockfaceTime, parseClockfaceRuns, type ClockfaceTime } from "./station-timetable";

interface GtfsCalendar extends CalendarPayload {
  sourceContentHash: string;
  sourceParseRunId: string;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function json(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Clockface could not load ${url} (${response.status}).`);
  return response.json() as Promise<unknown>;
}

// A Clockface run must belong to the requested provider and the exact GTFS
// snapshot used to build the station directory and local service calendar.
async function validateRun(baseUrl: string, runId: string, providerId: string, calendar: GtfsCalendar, signal?: AbortSignal) {
  const [provider, run] = await Promise.all([
    json(`${baseUrl}/v1/providers/${encodeURIComponent(providerId)}`, signal),
    json(`${baseUrl}/v1/runs/${encodeURIComponent(runId)}`, signal),
  ]);
  if (!record(provider) || provider.providerId !== providerId || !Array.isArray(provider.sources) ||
      !record(run) || run.sourceParseRunId !== runId || run.status !== "succeeded") {
    throw new Error(`Clockface ${providerId} provider or parse run does not match this timetable.`);
  }
  const sourceIds = provider.sources.filter(record).map((source) => source.sourceId).filter((id): id is string => typeof id === "string");
  const versionGroups = await Promise.all(sourceIds.map((sourceId) =>
    json(`${baseUrl}/v1/sources/${encodeURIComponent(sourceId)}/versions?limit=500`, signal)));
  if (!versionGroups.some((versions) => Array.isArray(versions) && versions.some((version) =>
    record(version) && version.sourceContentVersionId === run.sourceContentVersionId &&
    version.contentHash === calendar.sourceContentHash))) {
    throw new Error(`Clockface ${providerId} run does not match the published GTFS calendar.`);
  }
}

function scheduleTime(value: ClockfaceTime | null | undefined): string | null {
  if (!value) return null;
  if (value.type === "TimeSpecMinute" || (value.type === "TimeSpecSecond" && value.second === "Unknown")) {
    if (!Number.isSafeInteger(value.hour) || value.hour < 0 || !Number.isInteger(value.minute) ||
        value.minute < 0 || value.minute > 59) throw new Error("Clockface returned an invalid timetable time.");
    return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}`;
  }
  return clockfaceTime(value);
}

export function gtfsClockfaceTimetableLoader(manifest: ProviderManifest, baseUrl: string, runId: string): TimetableLoader {
  if (manifest.topology.kind === "none") throw new Error("This provider has no station catalog.");
  const catalogUrl = manifest.topology.catalogUrl;
  const providerId = manifest.id;
  return async (stationId, routeIds, direction, requestedDayType, signal) => {
    if (!baseUrl || !runId) throw new Error(`Clockface ${providerId} timetable has no completed parse run configured yet.`);
    const catalog = await loadProviderCatalog(catalogUrl, providerId);
    const station = catalog.stations.find((item) => item.id === stationId);
    const routes = routeIds.map((routeId) => station?.routes.find((route) =>
      route.routeId === routeId && route.directions.includes(direction)));
    if (!station || !routes.length || routes.some((route) => !route)) {
      throw new Error("Select a valid station, line, and direction.");
    }
    const stopIds = new Set(routes.flatMap((route) => route!.stopIds?.[direction] ?? []));
    if (!stopIds.size) throw new Error("This station has no boarding stop for the selected line and direction.");
    const root = baseUrl.replace(/\/$/, "");
    const calendarUrl = assetUrl(`/providers/${providerId}/calendar.json`);
    const timetableUrl = `${root}/v1/runs/${encodeURIComponent(runId)}/stations/${encodeURIComponent(stationId)}/timetable`;
    const [calendarValue, timetableValue] = await Promise.all([
      fetch(calendarUrl, { signal }).then(async (response) => {
        if (!response.ok) throw new Error(`Could not load ${providerId} service calendar (${response.status}).`);
        return response.json() as Promise<unknown>;
      }),
      json(timetableUrl, signal),
    ]);
    if (!record(calendarValue) || typeof calendarValue.sourceContentHash !== "string" ||
        (calendarValue.sourceParseRunId !== "" && calendarValue.sourceParseRunId !== runId) ||
        !Array.isArray(calendarValue.calendar) ||
        !Array.isArray(calendarValue.exceptions)) {
      throw new Error(`The ${providerId} service calendar does not match the configured Clockface run.`);
    }
    const calendar = calendarValue as unknown as GtfsCalendar;
    await validateRun(root, runId, providerId, calendar, signal);
    const shard: TimetableShard = { services: {} };
    const selectedRoutes = new Set(routeIds);
    for (const run of parseClockfaceRuns(timetableValue, stationId)) {
      if (!run.routeId || !selectedRoutes.has(run.routeId) || run.directionId !== direction ||
          !run.platformId || !stopIds.has(run.platformId) || !run.filterTags?.length) continue;
      const arrival = scheduleTime(run.arrivalTime);
      const departure = scheduleTime(run.departureTime);
      if (!arrival && !departure) continue;
      for (const tag of run.filterTags) {
        (shard.services[tag] ??= []).push({ routeId: run.routeId, arrival, departure });
      }
    }
    const services = new Set([
      ...calendar.calendar.map((service) => service.serviceId),
      ...calendar.exceptions.map((exception) => exception.serviceId),
    ]);
    if (Object.keys(shard.services).some((serviceId) => !services.has(serviceId))) {
      throw new Error(`Clockface ${providerId} service tags do not match its calendar.`);
    }
    const availableDays = availableTimetableDays(shard, calendar);
    const dayType = availableDays.includes(requestedDayType) ? requestedDayType : availableDays[0] ?? requestedDayType;
    const dateKey = findTimetableDate(shard, calendar, dayType, dateKeyInTimezone(new Date(), manifest.timezone));
    return renderTimetable(shard, calendar, dateKey, dayType, availableDays);
  };
}
