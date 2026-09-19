import type { Direction, TimetableDayType, TimetableEvent, TimetableResult } from "../types";
import { assetUrl } from "./asset-url";
import { shiftDateKey, timetableDayTypeForDate } from "./service-date";
export { shiftDateKey, timetableDayTypeForDate, timetableDayLabels } from "./service-date";

export interface RawTimetableEvent {
  tripId?: string;
  routeId?: string;
  arrival: string | null;
  departure: string | null;
}

export interface TimetableShard {
  services: Record<string, RawTimetableEvent[]>;
}

interface CalendarService {
  serviceId: string;
  startDate: string;
  endDate: string;
  days: boolean[];
}

interface CalendarException {
  serviceId: string;
  date: string;
  exceptionType: number;
}

export interface CalendarPayload {
  calendar: CalendarService[];
  exceptions: CalendarException[];
}

export interface TimetableSource {
  shard: TimetableShard;
  calendar: CalendarPayload;
}

const dayIndexes: Record<TimetableDayType, readonly number[]> = {
  weekday: [1, 2, 3, 4, 5],
  saturday: [6],
  sunday: [0],
};

const newYorkDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const newYorkDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function newYorkDateKey(date: Date) {
  const parts = newYorkDateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}`;
}

export function activeServiceIds(payload: CalendarPayload, dateKey: string) {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(4, 6));
  const day = Number(dateKey.slice(6, 8));
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  const active = new Set(
    payload.calendar
      .filter((service) => dateKey >= service.startDate && dateKey <= service.endDate && service.days[weekday])
      .map((service) => service.serviceId),
  );

  for (const exception of payload.exceptions) {
    if (exception.date !== dateKey) continue;
    if (exception.exceptionType === 1) active.add(exception.serviceId);
    if (exception.exceptionType === 2) active.delete(exception.serviceId);
  }

  return active;
}

export function availableTimetableDays(shard: TimetableShard, calendar: CalendarPayload) {
  const shardServiceIds = new Set(Object.keys(shard.services));
  return (Object.keys(dayIndexes) as TimetableDayType[]).filter((dayType) =>
    calendar.calendar.some((service) =>
      shardServiceIds.has(service.serviceId) &&
      dayIndexes[dayType].some((weekday) => service.days[weekday]),
    ),
  );
}

export function findTimetableDate(
  shard: TimetableShard,
  calendar: CalendarPayload,
  dayType: TimetableDayType,
  referenceDateKey: string,
) {
  const shardServiceIds = new Set(Object.keys(shard.services));
  const hasPlatformService = (dateKey: string) =>
    [...activeServiceIds(calendar, dateKey)].some((serviceId) => shardServiceIds.has(serviceId));

  for (let distance = 0; distance <= 370; distance += 1) {
    const candidate = shiftDateKey(referenceDateKey, distance);
    if (timetableDayTypeForDate(candidate) === dayType && hasPlatformService(candidate)) return candidate;
  }

  for (let distance = 1; distance <= 370; distance += 1) {
    const candidate = shiftDateKey(referenceDateKey, -distance);
    if (timetableDayTypeForDate(candidate) === dayType && hasPlatformService(candidate)) return candidate;
  }

  return referenceDateKey;
}

function parseGtfsTime(value: string) {
  const [hour = "0", minute = "0", second = "0"] = value.split(":");
  return Number(hour) * 3_600 + Number(minute) * 60 + Number(second);
}

function newYorkOffsetMilliseconds(epochMilliseconds: number) {
  const parts = newYorkDateTimeFormatter.formatToParts(epochMilliseconds);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const representedAsUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return representedAsUtc - epochMilliseconds;
}

export function newYorkServiceTimeToEpoch(dateKey: string, gtfsTime: string) {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(4, 6));
  const day = Number(dateKey.slice(6, 8));
  const totalSeconds = parseGtfsTime(gtfsTime);
  const dayOffset = Math.floor(totalSeconds / 86_400);
  const secondsInDay = totalSeconds % 86_400;
  const hour = Math.floor(secondsInDay / 3_600);
  const minute = Math.floor((secondsInDay % 3_600) / 60);
  const second = secondsInDay % 60;
  const wallClockAsUtc = Date.UTC(year, month - 1, day + dayOffset, hour, minute, second);
  let epochMilliseconds = wallClockAsUtc;

  // Two passes handle dates where the initial UTC guess has a different DST offset.
  for (let pass = 0; pass < 2; pass += 1) {
    epochMilliseconds = wallClockAsUtc - newYorkOffsetMilliseconds(epochMilliseconds);
  }

  return Math.round(epochMilliseconds / 1_000);
}

export function findScheduledEventTime(
  source: TimetableSource,
  realtimeTripId: string,
  serviceDate: string,
  eventKind: "arrival" | "departure",
  realtimeEventTime: number,
) {
  const candidates = new Set<number>();

  // MTA may label a post-midnight realtime trip with the new calendar date,
  // while static GTFS stores it as a 24:xx trip on the previous service day.
  for (const candidateDate of [serviceDate, shiftDateKey(serviceDate, -1)]) {
    const activeServices = activeServiceIds(source.calendar, candidateDate);
    for (const serviceId of activeServices) {
      for (const event of source.shard.services[serviceId] ?? []) {
        if (!event.tripId) continue;
        if (!matchesStaticTripId(event.tripId, realtimeTripId)) continue;
        const time = eventKind === "arrival"
          ? event.arrival ?? event.departure
          : event.departure ?? event.arrival;
        if (time) candidates.add(newYorkServiceTimeToEpoch(candidateDate, time));
      }
    }
  }

  if (candidates.size === 0) return null;
  return [...candidates].sort(
    (left, right) => Math.abs(left - realtimeEventTime) - Math.abs(right - realtimeEventTime),
  )[0] ?? null;
}

/** MTA realtime IDs sometimes omit the static GTFS service prefix. */
export function matchesStaticTripId(staticTripId: string, realtimeTripId: string) {
  const tripKey = (tripId: string) =>
    tripId.match(/(?:^|_)([+-]?\d{6}_[A-Z0-9]+\.\.[NS])/i)?.[1] ?? null;
  const realtimeKey = tripKey(realtimeTripId);
  return staticTripId === realtimeTripId || staticTripId.endsWith(`_${realtimeTripId}`) ||
    (realtimeKey != null && tripKey(staticTripId) === realtimeKey);
}

export function renderTimetable(
  shard: TimetableShard,
  calendar: CalendarPayload,
  dateKey: string,
  dayType = timetableDayTypeForDate(dateKey),
  availableDays = availableTimetableDays(shard, calendar),
): TimetableResult {
  const todayServices = activeServiceIds(calendar, dateKey);
  const yesterdayServices = activeServiceIds(calendar, shiftDateKey(dateKey, -1));
  const events: TimetableEvent[] = [];

  function collect(serviceIds: Set<string>, isPreviousServiceDay: boolean) {
    for (const serviceId of serviceIds) {
      for (const event of shard.services[serviceId] ?? []) {
        // Platform timetables conventionally show the time a train leaves.
        // Fall back to arrival only for feeds that omit departure_time.
        const gtfsTime = event.departure ?? event.arrival;
        if (!gtfsTime) continue;
        const rawSeconds = parseGtfsTime(gtfsTime);
        if (isPreviousServiceDay ? rawSeconds < 86_400 : rawSeconds >= 86_400) continue;
        const seconds = rawSeconds % 86_400;
        const hour = Math.floor(seconds / 3_600);
        const minute = Math.floor((seconds % 3_600) / 60);
        const second = seconds % 60;
        const eventKind = event.departure == null ? "arrival" : "departure";
        const exactTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
        events.push({
          seconds,
          minute: String(minute).padStart(2, "0"),
          hasHalfMinute: second === 30,
          exactTime,
          eventKind,
          ...(event.routeId ? { routeId: event.routeId } : {}),
        });
      }
    }
  }

  collect(yesterdayServices, true);
  collect(todayServices, false);

  const sorted = events.sort((left, right) => left.seconds - right.seconds);
  const byHour = new Map<number, TimetableEvent[]>();
  for (const event of sorted) {
    const hour = Math.floor(event.seconds / 3_600);
    const hourEvents = byHour.get(hour) ?? [];
    hourEvents.push(event);
    byHour.set(hour, hourEvents);
  }

  return {
    dateKey,
    dayType,
    availableDays,
    hours: [...byHour.entries()].map(([hour, hourEvents]) => ({ hour, events: hourEvents })),
    scheduledTrainCount: sorted.length,
  };
}

export async function fetchTimetable(
  stationId: string,
  routeId: string,
  direction: Direction,
  requestedDayType: TimetableDayType,
  signal?: AbortSignal,
) {
  const { shard, calendar } = await fetchTimetableSource(stationId, routeId, direction, signal);
  const availableDays = availableTimetableDays(shard, calendar);
  const dayType = availableDays.includes(requestedDayType) ? requestedDayType : availableDays[0] ?? requestedDayType;
  const dateKey = findTimetableDate(shard, calendar, dayType, newYorkDateKey(new Date()));
  return renderTimetable(shard, calendar, dateKey, dayType, availableDays);
}

export async function fetchTimetableForRoutes(
  stationId: string,
  routeIds: readonly string[],
  direction: Direction,
  requestedDayType: TimetableDayType,
  signal?: AbortSignal,
): Promise<TimetableResult> {
  if (routeIds.length === 0) throw new Error("Select at least one line.");
  if (routeIds.length === 1) return fetchTimetable(stationId, routeIds[0]!, direction, requestedDayType, signal);

  const sources = await Promise.all(routeIds.map((routeId) => fetchTimetableSource(stationId, routeId, direction, signal)));
  const calendar = sources[0]!.calendar;
  const services: TimetableShard["services"] = {};
  sources.forEach((source, index) => {
    const routeId = routeIds[index]!;
    for (const [serviceId, events] of Object.entries(source.shard.services)) {
      const merged = services[serviceId] ?? [];
      merged.push(...events.map((event) => ({ ...event, routeId })));
      services[serviceId] = merged;
    }
  });
  const shard = { services };
  const availableDays = availableTimetableDays(shard, calendar);
  const dayType = availableDays.includes(requestedDayType) ? requestedDayType : availableDays[0] ?? requestedDayType;
  const dateKey = findTimetableDate(shard, calendar, dayType, newYorkDateKey(new Date()));
  return renderTimetable(shard, calendar, dateKey, dayType, availableDays);
}

export async function fetchTimetableSource(
  stationId: string,
  routeId: string,
  direction: Direction,
  signal?: AbortSignal,
): Promise<TimetableSource> {
  const timetablePath = `/timetables/${encodeURIComponent(stationId)}/${encodeURIComponent(routeId)}-${direction}.json`;
  const [shardResponse, calendarResponse] = await Promise.all([
    fetch(assetUrl(timetablePath), { cache: "no-store", signal }),
    fetch(assetUrl("/timetables/calendar.json"), { cache: "no-store", signal }),
  ]);

  if (!shardResponse.ok) throw new Error("No static schedule was found for this platform.");
  if (!calendarResponse.ok) throw new Error("The static service calendar could not be loaded.");

  const shard = await shardResponse.json() as TimetableShard;
  const calendar = await calendarResponse.json() as CalendarPayload;
  return { shard, calendar };
}
