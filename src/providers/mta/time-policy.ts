import { estimatedTime, exactTime } from "../../domain/strict-time";

export const MTA_TIMEZONE = "America/New_York";

/** MTA-subway policy only: static GTFS stop_time seconds are meaningful schedule seconds. */
export function mtaScheduledTime(epochSeconds: number) {
  return exactTime(epochSeconds, MTA_TIMEZONE);
}

/** A realtime timestamp identifies a prediction to the second, not an observed fact. */
export function mtaPredictedTime(epochSeconds: number) {
  return estimatedTime(epochSeconds, MTA_TIMEZONE, "second");
}
