export interface ClockfaceTime {
  type: "TimeSpecMinute" | "TimeSpecSecond";
  hour: number;
  minute: number;
  second?: number | "Unknown";
}

export interface ClockfaceTrainRun {
  tripId?: string | null;
  routeId?: string | null;
  directionId?: string | null;
  platformId?: string | null;
  filterTags?: string[] | null;
  arrivalTime?: ClockfaceTime | null;
  departureTime?: ClockfaceTime | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function clockfaceTime(value: unknown): string | null {
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

export function parseClockfaceRuns(value: unknown, expectedStopId?: string): ClockfaceTrainRun[] {
  if (!Array.isArray(value) || value.some((group) =>
    !isRecord(group) || (expectedStopId != null && group.stop_id !== expectedStopId) ||
    !Array.isArray(group.trainRuns) || group.trainRuns.some((run: unknown) =>
      !isRecord(run) || (run.filterTags != null &&
        (!Array.isArray(run.filterTags) || run.filterTags.some((tag: unknown) => typeof tag !== "string")))))) {
    throw new Error("Clockface returned an invalid station timetable.");
  }
  return value.flatMap((group) => group.trainRuns as ClockfaceTrainRun[]);
}
