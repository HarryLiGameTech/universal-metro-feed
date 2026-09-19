import { exactTime } from "../../domain/strict-time";
import { localClockEpoch } from "../http/local-clock";
import type { HttpScheduleAdapter, HttpScheduleRecord } from "../http/proprietary-http-resolver";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid schedule response object.");
  return value as Record<string, unknown>;
}

function id(value: unknown): string {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) throw new Error("Invalid schedule identifier.");
  return String(value);
}

/** NBRT-only wire format and placeholder rules; common schedule policy stays in the resolver. */
export const nbrtScheduleAdapter: HttpScheduleAdapter = {
  decode(value, { nowSeconds, timezone }) {
    const response = object(value);
    if (response.Code !== 200) throw new Error(`Schedule API returned ${String(response.Code)}.`);
    if (!Array.isArray(response.Data)) throw new Error("Invalid schedule response data.");
    const records: HttpScheduleRecord[] = [];
    const time = (value: unknown) => {
      if (value == null || value === "") return null;
      if (typeof value !== "string") throw new Error("Invalid schedule time.");
      // Second precision was explicitly confirmed for this provider's planned times.
      return exactTime(localClockEpoch(value, nowSeconds, 8 * 3_600), timezone);
    };
    for (const value of response.Data) {
      const group = object(value);
      const stationId = id(group.StationId);
      const routeId = id(group.LineId);
      const directionId = id(group.Flag);
      if (!Array.isArray(group.StationRunTimes)) throw new Error("Invalid station schedule rows.");
      // Observed no-service responses have this status and fabricated clock values.
      if (group.StationStatus === 2) continue;
      for (const value of group.StationRunTimes) {
        const row = object(value);
        if (row.IntimeDura === -60 && row.OutTimeDura === -60) continue;
        if (id(row.StationId) !== stationId || id(row.LineId) !== routeId || id(row.Flag) !== directionId) {
          throw new Error("Schedule row does not match its station group.");
        }
        records.push({ stationId, routeId, directionId, arrival: time(row.IntimeStr), departure: time(row.OutTimeStr) });
      }
    }
    // IsShow=0 also occurs on valid rows. Sequence, Key, and Name are not trip IDs.
    return records;
  },
};
