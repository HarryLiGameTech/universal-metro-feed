/** Date-less rolling snapshots in a provider-confirmed fixed-offset timezone (no DST). */
export function localClockEpoch(value: string, nowSeconds: number, utcOffsetSeconds: number): number {
  const match = /^(\d{2}):([0-5]\d):([0-5]\d)$/.exec(value);
  if (!match || Number(match[1]) > 47) throw new Error(`Invalid schedule clock: ${value}`);
  if (!Number.isFinite(nowSeconds) || !Number.isFinite(utcOffsetSeconds)) throw new Error("Invalid clock reference.");
  const wallMidnight = Math.floor((nowSeconds + utcOffsetSeconds) / 86_400) * 86_400;
  const seconds = Number(match[1]) * 3_600 + Number(match[2]) * 60 + Number(match[3]);
  const today = wallMidnight - utcOffsetSeconds + seconds;
  // These are nearby partial schedules, not a service-day/full-day timetable.
  return [today - 86_400, today, today + 86_400]
    .sort((a, b) => Math.abs(a - nowSeconds) - Math.abs(b - nowSeconds))[0]!;
}
