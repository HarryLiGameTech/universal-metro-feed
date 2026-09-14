import type { Direction, TimetableDayType, TimetableEvent, TimetableResult } from "../types";

interface RawTimetableEvent {
  arrival: string | null;
  departure: string | null;
}

interface TimetableShard {
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

interface CalendarPayload {
  calendar: CalendarService[];
  exceptions: CalendarException[];
}

const dayIndexes: Record<TimetableDayType, readonly number[]> = {
  weekday: [1, 2, 3, 4, 5],
  saturday: [6],
  sunday: [0],
};

export const timetableDayLabels: Record<TimetableDayType, string> = {
  weekday: "Weekdays",
  saturday: "Saturdays",
  sunday: "Sundays",
};

const newYorkDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function newYorkDateKey(date: Date) {
  const parts = newYorkDateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}`;
}

export function shiftDateKey(dateKey: string, days: number) {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(4, 6));
  const day = Number(dateKey.slice(6, 8));
  const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
  return `${shifted.getUTCFullYear()}${String(shifted.getUTCMonth() + 1).padStart(2, "0")}${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export function timetableDayTypeForDate(dateKey: string): TimetableDayType {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(4, 6));
  const day = Number(dateKey.slice(6, 8));
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
  return weekday === 0 ? "sunday" : weekday === 6 ? "saturday" : "weekday";
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
  const timetablePath = `/timetables/${encodeURIComponent(stationId)}/${encodeURIComponent(routeId)}-${direction}.json`;
  const [shardResponse, calendarResponse] = await Promise.all([
    fetch(timetablePath, { cache: "no-store", signal }),
    fetch("/timetables/calendar.json", { cache: "no-store", signal }),
  ]);

  if (!shardResponse.ok) throw new Error("No static schedule was found for this platform.");
  if (!calendarResponse.ok) throw new Error("The static service calendar could not be loaded.");

  const shard = await shardResponse.json() as TimetableShard;
  const calendar = await calendarResponse.json() as CalendarPayload;
  const availableDays = availableTimetableDays(shard, calendar);
  const dayType = availableDays.includes(requestedDayType) ? requestedDayType : availableDays[0] ?? requestedDayType;
  const dateKey = findTimetableDate(shard, calendar, dayType, newYorkDateKey(new Date()));
  return renderTimetable(shard, calendar, dateKey, dayType, availableDays);
}
