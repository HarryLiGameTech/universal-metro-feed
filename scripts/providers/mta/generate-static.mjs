import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";

const DATA_DIR = new URL("../../../gtfs_subway/", import.meta.url);
const OUTPUT = new URL("../../../src/data/stations.generated.ts", import.meta.url);
const TIMETABLE_DIR = new URL("../../../public/timetables/", import.meta.url);
const TRIP_PATH_DIR = new URL("../../../public/trip-paths/mta-subway/", import.meta.url);
const CATALOG_OUTPUT = new URL("../../../public/providers/mta-subway/catalog.json", import.meta.url);

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const character = line[i];
    if (character === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += character;
    }
  }

  values.push(value);
  return values;
}

async function forEachCsvRow(fileName, callback) {
  const input = createReadStream(new URL(fileName, DATA_DIR));
  const lines = createInterface({ input, crlfDelay: Infinity });
  let headers;

  for await (const line of lines) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    callback(row);
  }
}

const routes = new Map();
await forEachCsvRow("routes.txt", (row) => {
  routes.set(row.route_id, {
    id: row.route_id,
    name: row.route_long_name,
    color: `#${row.route_color || "555555"}`,
    textColor: `#${row.route_text_color || "ffffff"}`,
  });
});

const trips = new Map();
await forEachCsvRow("trips.txt", (row) => {
  trips.set(row.trip_id, {
    routeId: row.route_id,
    serviceId: row.service_id,
    headsign: row.trip_headsign,
  });
});

const service = new Map();
const timetables = new Map();
const tripStops = new Map();
const headsignCounts = new Map();
await forEachCsvRow("stop_times.txt", (row) => {
  const trip = trips.get(row.trip_id);
  const stopId = row.stop_id;
  if (!trip || !/[NS]$/.test(stopId)) return;

  const parentId = stopId.slice(0, -1);
  const direction = stopId.at(-1);
  const stationService = service.get(parentId) ?? new Map();
  const directions = stationService.get(trip.routeId) ?? new Set();
  directions.add(direction);
  stationService.set(trip.routeId, directions);
  service.set(parentId, stationService);

  const platformRouteKey = `${parentId}/${trip.routeId}-${direction}`;
  const headsign = row.stop_headsign || trip.headsign;
  if (headsign) {
    const counts = headsignCounts.get(platformRouteKey) ?? new Map();
    counts.set(headsign, (counts.get(headsign) ?? 0) + 1);
    headsignCounts.set(platformRouteKey, counts);
  }
  const stops = tripStops.get(row.trip_id) ?? [];
  stops.push({
    stopId,
    sequence: Number(row.stop_sequence),
    arrival: row.arrival_time || null,
    departure: row.departure_time || null,
  });
  tripStops.set(row.trip_id, stops);

  const timetableKey = platformRouteKey;
  const byService = timetables.get(timetableKey) ?? new Map();
  const events = byService.get(trip.serviceId) ?? [];
  events.push({
    tripId: row.trip_id,
    arrival: row.arrival_time || null,
    departure: row.departure_time || null,
  });
  byService.set(trip.serviceId, events);
  timetables.set(timetableKey, byService);
});

// A shared name or parent station is not proof that two lines share a segment.
// Record the actual directed adjacent stop pairs from trip stop sequences.
const adjacentSegments = new Map();
for (const [tripId, stops] of tripStops) {
  const routeId = trips.get(tripId)?.routeId;
  if (!routeId) continue;
  stops.sort((left, right) => left.sequence - right.sequence);
  for (let index = 1; index < stops.length; index += 1) {
    const previous = stops[index - 1].stopId;
    const current = stops[index].stopId;
    if (previous === current) continue;
    const segment = `${previous}>${current}`;
    for (const stopId of [previous, current]) {
      const key = `${stopId.slice(0, -1)}/${routeId}-${stopId.at(-1)}`;
      const segments = adjacentSegments.get(key) ?? new Set();
      segments.add(segment);
      adjacentSegments.set(key, segments);
    }
  }
}

// Click-to-expand topology is kept in small, on-demand shards, never in the
// main application bundle or the station catalog. The backend may later serve
// the same contract without changing the resolver or UI.
function tripBucket(tripId) {
  let hash = 0;
  for (let index = 0; index < tripId.length; index += 1) {
    hash = (Math.imul(hash, 31) + tripId.charCodeAt(index)) >>> 0;
  }
  return (hash % 128).toString(16).padStart(2, "0");
}

const tripPathBuckets = new Map();
for (const [tripId, stops] of tripStops) {
  const trip = trips.get(tripId);
  if (!trip) continue;
  const bucketId = tripBucket(tripId);
  const bucket = tripPathBuckets.get(bucketId) ?? {};
  bucket[tripId] = {
    routeId: trip.routeId,
    serviceId: trip.serviceId,
    stops,
  };
  tripPathBuckets.set(bucketId, bucket);
}
await mkdir(TRIP_PATH_DIR, { recursive: true });
for (const [bucketId, tripsInBucket] of tripPathBuckets) {
  writeFileSync(new URL(`${bucketId}.json`, TRIP_PATH_DIR), JSON.stringify({ trips: tripsInBucket }));
}
tripStops.clear();

const stations = [];
await forEachCsvRow("stops.txt", (row) => {
  if (row.location_type !== "1") return;
  const stationService = service.get(row.stop_id);
  if (!stationService?.size) return;

  stations.push({
    id: row.stop_id,
    name: row.stop_name,
    latitude: Number(row.stop_lat),
    longitude: Number(row.stop_lon),
    routes: [...stationService.entries()]
      .filter(([routeId]) => routes.has(routeId))
      .map(([routeId, directions]) => ({
        routeId,
        directions: [...directions].sort(),
        headsigns: Object.fromEntries([...directions].map((direction) => {
          const counts = headsignCounts.get(`${row.stop_id}/${routeId}-${direction}`) ?? new Map();
          return [direction, [...counts.entries()]
            .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
            .map(([headsign]) => headsign)];
        })),
        adjacentSegments: Object.fromEntries([...directions].map((direction) => [
          direction,
          [...(adjacentSegments.get(`${row.stop_id}/${routeId}-${direction}`) ?? [])].sort(),
        ])),
      }))
      .sort((a, b) => a.routeId.localeCompare(b.routeId, undefined, { numeric: true })),
  });
});

stations.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

// This TypeScript export remains only for legacy regression tests. Keep its
// historical shape stable; the browser consumes the richer runtime catalog.
const legacyStations = stations.map((station) => ({
  id: station.id,
  name: station.name,
  latitude: station.latitude,
  longitude: station.longitude,
  routes: station.routes.map(({ routeId, directions }) => ({ routeId, directions })),
}));

await mkdir(new URL("../../../src/data/", import.meta.url), { recursive: true });
const source = `// Generated from the official MTA static GTFS files. Do not edit by hand.\n` +
  `import type { Route, Station } from "../types";\n\n` +
  `export const routes: Record<string, Route> = ${JSON.stringify(Object.fromEntries(routes), null, 2)};\n\n` +
  `export const stations: readonly Station[] = ${JSON.stringify(legacyStations, null, 2)};\n`;

writeFileSync(OUTPUT, source);

await mkdir(new URL("./", CATALOG_OUTPUT), { recursive: true });
writeFileSync(CATALOG_OUTPUT, JSON.stringify({
  providerId: "mta-subway",
  timezone: "America/New_York",
  routes: Object.fromEntries(routes),
  stations,
}));

await mkdir(TIMETABLE_DIR, { recursive: true });
let timetableFileCount = 0;
for (const [key, byService] of timetables) {
  const output = new URL(`${key}.json`, TIMETABLE_DIR);
  await mkdir(new URL("./", output), { recursive: true });

  const services = Object.fromEntries(
    [...byService.entries()].map(([serviceId, events]) => [
      serviceId,
      events.sort((left, right) => {
        const leftTime = left.arrival ?? left.departure ?? "";
        const rightTime = right.arrival ?? right.departure ?? "";
        return leftTime.localeCompare(rightTime);
      }),
    ]),
  );

  writeFileSync(output, JSON.stringify({ services }));
  timetableFileCount += 1;
}

const calendar = [];
await forEachCsvRow("calendar.txt", (row) => {
  calendar.push({
    serviceId: row.service_id,
    startDate: row.start_date,
    endDate: row.end_date,
    days: [
      row.sunday === "1",
      row.monday === "1",
      row.tuesday === "1",
      row.wednesday === "1",
      row.thursday === "1",
      row.friday === "1",
      row.saturday === "1",
    ],
  });
});

const exceptions = [];
await forEachCsvRow("calendar_dates.txt", (row) => {
  exceptions.push({
    serviceId: row.service_id,
    date: row.date,
    exceptionType: Number(row.exception_type),
  });
});

writeFileSync(
  new URL("calendar.json", TIMETABLE_DIR),
  JSON.stringify({ calendar, exceptions }),
);

const feedInfo = readFileSync(new URL("feed_info.txt", DATA_DIR), "utf8").trim().split("\n")[1];
console.log(`Generated ${stations.length} stations and ${timetableFileCount} timetable shards from GTFS (${feedInfo ?? "unknown version"}).`);
