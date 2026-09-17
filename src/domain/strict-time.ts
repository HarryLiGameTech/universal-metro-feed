/** An instant or range must never imply finer precision than the source supports. */
export type StrictTime =
  | {
      kind: "uninterpreted";
      epochSeconds: number;
      serializedResolution: "second" | "minute";
      timezone: string;
      reason: string;
    }
  | {
      kind: "exact";
      epochSeconds: number;
      resolution: "second" | "millisecond";
      timezone: string;
    }
  | {
      kind: "published-minute";
      minuteStartEpochSeconds: number;
      semantics: "truncated" | "underspecified" | "unknown";
      timezone: string;
    }
  | {
      kind: "estimate";
      epochSeconds: number;
      resolution: "second" | "minute";
      toleranceSeconds: number | null;
      timezone: string;
    }
  | {
      kind: "bound";
      earliestEpochSeconds?: number;
      latestEpochSeconds?: number;
      resolution: "second" | "minute";
      timezone: string;
    };

export interface TimePresentation {
  primary: string;
  qualifier: "none" | "about" | "earliest" | "latest" | "between";
}

function requireFinite(value: number, field: string) {
  if (!Number.isFinite(value)) throw new Error(`${field} must be finite.`);
}

export function exactTime(epochSeconds: number, timezone: string): StrictTime {
  requireFinite(epochSeconds, "epochSeconds");
  return { kind: "exact", epochSeconds, resolution: "second", timezone };
}

/** Quarantine a parsed timestamp until a provider policy establishes its semantics. */
export function uninterpretedTime(
  epochSeconds: number,
  timezone: string,
  serializedResolution: "second" | "minute",
  reason: string,
): StrictTime {
  requireFinite(epochSeconds, "epochSeconds");
  return { kind: "uninterpreted", epochSeconds, serializedResolution, timezone, reason };
}

export function estimatedTime(
  epochSeconds: number,
  timezone: string,
  resolution: "second" | "minute",
  toleranceSeconds: number | null = null,
): StrictTime {
  requireFinite(epochSeconds, "epochSeconds");
  if (toleranceSeconds != null && (!Number.isFinite(toleranceSeconds) || toleranceSeconds < 0)) {
    throw new Error("toleranceSeconds must be a non-negative finite number.");
  }
  return { kind: "estimate", epochSeconds, resolution, toleranceSeconds, timezone };
}

export function publishedMinute(
  minuteStartEpochSeconds: number,
  timezone: string,
  semantics: "truncated" | "underspecified" | "unknown",
): StrictTime {
  requireFinite(minuteStartEpochSeconds, "minuteStartEpochSeconds");
  if (minuteStartEpochSeconds % 60 !== 0) {
    throw new Error("A published-minute bucket must start at the beginning of a minute.");
  }
  return { kind: "published-minute", minuteStartEpochSeconds, semantics, timezone };
}

export function boundedTime(
  bounds: { earliestEpochSeconds?: number; latestEpochSeconds?: number },
  timezone: string,
  resolution: "second" | "minute",
): StrictTime {
  const { earliestEpochSeconds, latestEpochSeconds } = bounds;
  if (earliestEpochSeconds == null && latestEpochSeconds == null) {
    throw new Error("At least one time bound is required.");
  }
  if (earliestEpochSeconds != null) requireFinite(earliestEpochSeconds, "earliestEpochSeconds");
  if (latestEpochSeconds != null) requireFinite(latestEpochSeconds, "latestEpochSeconds");
  if (earliestEpochSeconds != null && latestEpochSeconds != null && earliestEpochSeconds > latestEpochSeconds) {
    throw new Error("The earliest bound cannot be after the latest bound.");
  }
  return { kind: "bound", ...bounds, resolution, timezone };
}

function format(epochSeconds: number, timezone: string, resolution: "second" | "minute") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    ...(resolution === "second" ? { second: "2-digit" } : {}),
    hourCycle: "h23",
  }).format(epochSeconds * 1_000);
}

/** Returns semantic text tokens; localization of the qualifier belongs to the UI. */
export function presentStrictTime(time: StrictTime): TimePresentation {
  if (time.kind === "uninterpreted") {
    throw new Error("An uninterpreted source time cannot be presented as a precise time.");
  }
  if (time.kind === "exact") {
    return { primary: format(time.epochSeconds, time.timezone, "second"), qualifier: "none" };
  }
  if (time.kind === "published-minute") {
    return { primary: format(time.minuteStartEpochSeconds, time.timezone, "minute"), qualifier: "none" };
  }
  if (time.kind === "estimate") {
    return { primary: format(time.epochSeconds, time.timezone, time.resolution), qualifier: "about" };
  }
  if (time.earliestEpochSeconds != null && time.latestEpochSeconds != null) {
    return {
      primary: `${format(time.earliestEpochSeconds, time.timezone, time.resolution)}–${format(time.latestEpochSeconds, time.timezone, time.resolution)}`,
      qualifier: "between",
    };
  }
  if (time.earliestEpochSeconds != null) {
    return { primary: format(time.earliestEpochSeconds, time.timezone, time.resolution), qualifier: "earliest" };
  }
  return { primary: format(time.latestEpochSeconds!, time.timezone, time.resolution), qualifier: "latest" };
}
