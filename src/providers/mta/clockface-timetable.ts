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
import { clockfaceTime, parseClockfaceRuns, type ClockfaceTrainRun } from "../clockface/station-timetable";

interface ClockfaceSchedule {
  kind: "clockface";
  baseUrl: string;
  runId: string;
}

function addRuns(shard: TimetableShard, runs: ClockfaceTrainRun[], routeId: string, platformId: string) {
  for (const run of runs) {
    if (run.routeId !== routeId || run.platformId !== platformId) continue;
    const arrival = clockfaceTime(run.arrivalTime);
    const departure = clockfaceTime(run.departureTime);
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
      return parseClockfaceRuns(await response.json(), stationId);
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
