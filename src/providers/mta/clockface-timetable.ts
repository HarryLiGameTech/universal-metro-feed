import { assetUrl } from "../../lib/asset-url";
import {
  availableTimetableDays,
  findTimetableDate,
  newYorkDateKey,
  renderTimetable,
  type CalendarPayload,
  type RawTimetableEvent,
  type TimetableShard,
} from "../../lib/timetable";
import type { Direction } from "../../types";
import type { TimetableLoader } from "../runtime";

interface ClockfaceSchedule {
  kind: "clockface";
  baseUrl: string;
  runId: string;
}

interface ClockfaceTime {
  type: "TimeSpecMinute" | "TimeSpecSecond";
  hour: number;
  minute: number;
  second?: number | "Unknown";
}

interface ClockfaceTrainRun {
  routeId?: string | null;
  platformId?: string | null;
  filterTags?: string[] | null;
  arrivalTime?: ClockfaceTime | null;
  departureTime?: ClockfaceTime | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseTime(value: unknown): string | null {
  if (value == null) return null;
  if (!isRecord(value) || !Number.isSafeInteger(value.hour) || Number(value.hour) < 0 ||
      !Number.isInteger(value.minute) || Number(value.minute) < 0 || Number(value.minute) > 59) {
    throw new Error("Clockface returned an invalid timetable time.");
  }
  if (value.type === "TimeSpecMinute") return null;
  if (value.type !== "TimeSpecSecond" || value.second === "Unknown") return null;
  if (!Number.isInteger(value.second) || Number(value.second) < 0 || Number(value.second) > 59) {
    throw new Error("Clockface returned an invalid timetable second.");
  }
  return `${String(value.hour).padStart(2, "0")}:${String(value.minute).padStart(2, "0")}:${String(value.second).padStart(2, "0")}`;
}

function parseRuns(value: unknown): ClockfaceTrainRun[] {
  if (!Array.isArray(value) || value.some((group) =>
    !isRecord(group) || !Array.isArray(group.trainRuns) || group.trainRuns.some((run: unknown) =>
      !isRecord(run) || (run.filterTags != null &&
        (!Array.isArray(run.filterTags) || run.filterTags.some((tag: unknown) => typeof tag !== "string")))))) {
    throw new Error("Clockface returned an invalid station timetable.");
  }
  return value.flatMap((group) => group.trainRuns as ClockfaceTrainRun[]);
}

function addRuns(shard: TimetableShard, runs: ClockfaceTrainRun[], routeId: string, platformId: string) {
  for (const run of runs) {
    if (run.routeId !== routeId || run.platformId !== platformId) continue;
    const arrival = parseTime(run.arrivalTime);
    const departure = parseTime(run.departureTime);
    if (!arrival && !departure) continue;
    if (!run.filterTags?.length) continue;
    const event: RawTimetableEvent = { routeId, arrival, departure };
    for (const tag of run.filterTags) {
      (shard.services[tag] ??= []).push(event);
    }
  }
}

export function clockfaceTimetableLoader(config: ClockfaceSchedule): TimetableLoader {
  return async (stationId, routeIds, direction: Direction, requestedDayType, signal) => {
    if (!config.baseUrl || !config.runId) {
      throw new Error("Clockface has not been configured for this website yet.");
    }
    if (routeIds.length === 0) throw new Error("Select at least one line.");
    if (direction !== "N" && direction !== "S") throw new Error("Unsupported MTA platform direction.");

    const platformId = `${stationId}${direction}`;
    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const query = new URLSearchParams({
      ...(routeIds.length === 1 ? { routeId: routeIds[0] } : {}),
      platformId,
    });
    const url = `${baseUrl}/v1/runs/${encodeURIComponent(config.runId)}/stations/${encodeURIComponent(stationId)}/timetable?${query}`;
    const runsRequest = fetch(url, { signal }).then(async (response) => {
      if (!response.ok) throw new Error(`Clockface could not load this platform timetable (${response.status}).`);
      return parseRuns(await response.json());
    });
    const calendarRequest = fetch(assetUrl("/timetables/calendar.json"), { signal }).then(async (response) => {
      if (!response.ok) throw new Error("The static service calendar could not be loaded.");
      return response.json() as Promise<CalendarPayload>;
    });
    const [calendar, runs] = await Promise.all([calendarRequest, runsRequest]);
    const shard: TimetableShard = { services: {} };
    routeIds.forEach((routeId) => addRuns(shard, runs, routeId, platformId));

    const calendarServices = new Set([
      ...calendar.calendar.map((service) => service.serviceId),
      ...calendar.exceptions.map((exception) => exception.serviceId),
    ]);
    if (Object.keys(shard.services).some((serviceId) => !calendarServices.has(serviceId))) {
      throw new Error("Clockface service tags do not match this website's service calendar.");
    }
    const availableDays = availableTimetableDays(shard, calendar);
    const dayType = availableDays.includes(requestedDayType) ? requestedDayType : availableDays[0] ?? requestedDayType;
    const dateKey = findTimetableDate(shard, calendar, dayType, newYorkDateKey(new Date()));
    return renderTimetable(shard, calendar, dateKey, dayType, availableDays);
  };
}
