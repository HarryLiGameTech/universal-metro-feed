import type { TimetableDayType } from "../types";

export const timetableDayLabels: Record<TimetableDayType, string> = {
  weekday: "Weekdays",
  saturday: "Saturdays",
  sunday: "Sundays",
};

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
