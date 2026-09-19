import { nbrtScheduleAdapter } from "../nbrt/schedule-adapter";
import type { HttpScheduleAdapter } from "./proprietary-http-resolver";

const adapters: Record<string, HttpScheduleAdapter> = {
  "nbrt-schedule-time": nbrtScheduleAdapter,
};

export function scheduleAdapter(id: string): HttpScheduleAdapter {
  const adapter = adapters[id];
  if (!adapter) throw new Error(`Unsupported HTTP schedule format: ${id}`);
  return adapter;
}
