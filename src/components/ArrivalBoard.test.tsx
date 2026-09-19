import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { exactTime } from "../domain/strict-time";
import { CatalogContext } from "../providers/catalog-context";
import type { ProviderRuntime } from "../providers/runtime";
import type { Arrival, ArrivalSnapshot, Station } from "../types";
import { ArrivalBoard } from "./ArrivalBoard";

const now = Date.parse("2026-09-19T10:30:00Z") / 1_000;
const station: Station = {
  id: "164", name: "学府路", latitude: null, longitude: null,
  routes: [{ routeId: "8", directions: ["1"], headsigns: { "1": ["开元路"] } }],
};
const runtime: ProviderRuntime = {
  loadArrivals: vi.fn(), loadTripPath: null, loadTimetable: null,
  arrivalSource: "schedule", feedLabel: "Partial timetable", refreshIntervalMs: 30_000,
};
const arrival: Arrival = {
  id: "internal-record", tripId: null, routeId: "8", stopId: "164", direction: "1",
  destinationId: null, destinationName: "开元路", destinationKind: "direction", timeSource: "schedule",
  eventTime: now + 250, eventKind: "arrival", scheduledTime: now + 250,
  displayTime: exactTime(now + 250, "Asia/Shanghai"), delaySeconds: null,
  delayStatus: "undetermined", delayLabel: "", identityStability: "snapshot-only",
};
function render(arrivals: Arrival[]) {
  vi.useFakeTimers();
  vi.setSystemTime(now * 1_000);
  const client = new QueryClient();
  const snapshot: ArrivalSnapshot = { arrivals, fetchedAt: now, feedTimestamp: null };
  client.setQueryData(["arrivals", "nbrt-subway", "164", ["8"], "1"], snapshot);
  const html = renderToStaticMarkup(
    <QueryClientProvider client={client}>
      <CatalogContext.Provider value={{ providerId: "nbrt-subway", timezone: "Asia/Shanghai", routes: {}, stations: [station] }}>
        <ArrivalBoard providerId="nbrt-subway" timezone="Asia/Shanghai" runtime={runtime} station={station} routeIds={["8"]} direction="1" />
      </CatalogContext.Provider>
    </QueryClientProvider>,
  );
  client.clear();
  return html;
}
afterEach(() => vi.useRealTimers());

describe("schedule-only arrival board", () => {
  it("renders planned seconds in white without a trip ID, button, disclosure, or live/delay claims", () => {
    const html = render([arrival]);
    expect(html).toContain("18:34:10");
    expect(html).toContain('class="arrival-time is-scheduled"');
    expect(html).toContain("Scheduled arrival");
    expect(html).toContain("Partial timetable");
    expect(html).toContain("Last fetched");
    expect(html).toContain("Toward");
    expect(html).not.toMatch(/<button|aria-expanded|arrival-trip|arrival-disclosure|internal-record|Trip ID|Feed ID|Live|on-time|delay-label|Feed delayed/);
  });

  it("does not claim all-day service has ended when the partial response is empty", () => {
    const html = render([]);
    expect(html).toContain("No upcoming times in this partial timetable");
    expect(html).toContain("This is not a full-day schedule");
    expect(html).not.toMatch(/No more trains today|live feed|Live/);
  });
});
