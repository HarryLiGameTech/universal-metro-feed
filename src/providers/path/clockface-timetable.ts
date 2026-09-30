import { assetUrl } from "../../lib/asset-url";
import {
  availableTimetableDays, findTimetableDate, newYorkDateKey, renderTimetable,
  type CalendarPayload, type TimetableShard,
} from "../../lib/timetable";
import type { TimetableLoader } from "../runtime";
import { clockfaceTime, parseClockfaceRuns, type ClockfaceTrainRun } from "../clockface/station-timetable";

interface PathClockfaceSchedule {
  baseUrl: string;
  runId: string;
}

interface PathCalendar extends CalendarPayload {
  sourceParseRunId: string;
}

type PathDirection = "ToNY" | "ToNJ";
type StopSelection = { stopId: string; routes?: readonly string[] };

// The PATH GTFS keeps separate numeric passenger stops; its place_* records
// are not Clockface timetable IDs. These selections were checked against the
// imported GTFS stop sequences. Terminal arrivals are omitted from the
// outward-facing direction (notably JSQ and Hoboken).
const stationStops: Record<string, Partial<Record<PathDirection, readonly StopSelection[]>>> = {
  NWK: { ToNY: [{ stopId: "781718" }] },
  HAR: { ToNY: [{ stopId: "781720" }], ToNJ: [{ stopId: "781721" }] },
  JSQ: { ToNY: [{ stopId: "781722" }, { stopId: "781723" }], ToNJ: [{ stopId: "781725" }] },
  GRV: { ToNY: [{ stopId: "781726" }], ToNJ: [{ stopId: "781727" }] },
  NEW: { ToNY: [{ stopId: "781728" }, { stopId: "781729" }], ToNJ: [{ stopId: "781728" }, { stopId: "781729" }] },
  EXP: { ToNY: [{ stopId: "781730" }], ToNJ: [{ stopId: "781731" }] },
  HOB: {
    ToNY: [{ stopId: "781743" }, { stopId: "781744" }],
    ToNJ: [{ stopId: "781744", routes: ["ATW"] }],
  },
  WTC: { ToNJ: [{ stopId: "781747" }, { stopId: "781750" }] },
  CHR: { ToNY: [{ stopId: "781732" }], ToNJ: [{ stopId: "781733" }] },
  "09S": { ToNY: [{ stopId: "781734" }], ToNJ: [{ stopId: "781735" }] },
  "14S": { ToNY: [{ stopId: "781736" }], ToNJ: [{ stopId: "781737" }] },
  "23S": { ToNY: [{ stopId: "781738" }], ToNJ: [{ stopId: "781739" }] },
  "33S": { ToNJ: [{ stopId: "781740" }, { stopId: "781742" }] },
};

function isPathCalendar(value: unknown): value is PathCalendar {
  return value !== null && typeof value === "object" &&
    typeof (value as PathCalendar).sourceParseRunId === "string" &&
    Array.isArray((value as PathCalendar).calendar) && Array.isArray((value as PathCalendar).exceptions);
}

function addRuns(shard: TimetableShard, runs: ClockfaceTrainRun[], directionId: string, selection: StopSelection) {
  for (const run of runs) {
    if (run.directionId !== directionId || !run.routeId ||
        (selection.routes && !selection.routes.includes(run.routeId)) || !run.filterTags?.length) continue;
    const arrival = clockfaceTime(run.arrivalTime);
    const departure = clockfaceTime(run.departureTime);
    if (!arrival && !departure) continue;
    for (const tag of run.filterTags) {
      (shard.services[tag] ??= []).push({ routeId: run.routeId, arrival, departure });
    }
  }
}

export function pathClockfaceTimetableLoader(config: PathClockfaceSchedule): TimetableLoader {
  return async (stationId, routeIds, direction, requestedDayType, signal) => {
    if (!config.baseUrl || !config.runId) throw new Error("Clockface PATH timetable has not been configured for this website yet.");
    if (routeIds.length !== 1 || routeIds[0] !== "PATH") throw new Error("Select the PATH service.");
    if (direction !== "ToNY" && direction !== "ToNJ") throw new Error("Select a PATH direction.");
    const selections = stationStops[stationId]?.[direction];
    if (!selections?.length) throw new Error("No PATH timetable is mapped for this station and direction.");

    const baseUrl = config.baseUrl.replace(/\/$/, "");
    const requests = selections.map(async (selection) => {
      const url = `${baseUrl}/v1/runs/${encodeURIComponent(config.runId)}/stations/${selection.stopId}/timetable`;
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`Clockface could not load this PATH station timetable (${response.status}).`);
      return parseClockfaceRuns(await response.json(), selection.stopId);
    });
    const calendarRequest = fetch(assetUrl("/providers/path-rail/calendar.json"), { signal }).then(async (response) => {
      if (!response.ok) throw new Error("The PATH service calendar could not be loaded.");
      const value: unknown = await response.json();
      if (!isPathCalendar(value) || value.sourceParseRunId !== config.runId) {
        throw new Error("The PATH service calendar does not match the configured Clockface run.");
      }
      return value;
    });
    const [calendar, ...runGroups] = await Promise.all([calendarRequest, ...requests]);
    const shard: TimetableShard = { services: {} };
    const directionId = direction === "ToNY" ? "0" : "1";
    runGroups.forEach((runs, index) => addRuns(shard, runs, directionId, selections[index]!));

    const calendarServices = new Set([
      ...calendar.calendar.map((service) => service.serviceId),
      ...calendar.exceptions.map((exception) => exception.serviceId),
    ]);
    if (Object.keys(shard.services).some((serviceId) => !calendarServices.has(serviceId))) {
      throw new Error("Clockface PATH service tags do not match the service calendar.");
    }
    const availableDays = availableTimetableDays(shard, calendar);
    const dayType = availableDays.includes(requestedDayType) ? requestedDayType : availableDays[0] ?? requestedDayType;
    const dateKey = findTimetableDate(shard, calendar, dayType, newYorkDateKey(new Date()));
    return renderTimetable(shard, calendar, dateKey, dayType, availableDays);
  };
}
