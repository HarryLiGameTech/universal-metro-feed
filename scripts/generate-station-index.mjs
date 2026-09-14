import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createInterface } from "node:readline";

const DATA_DIR = new URL("../gtfs_subway/", import.meta.url);
const OUTPUT = new URL("../src/data/stations.generated.ts", import.meta.url);

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

const tripRoutes = new Map();
await forEachCsvRow("trips.txt", (row) => {
  tripRoutes.set(row.trip_id, row.route_id);
});

const service = new Map();
await forEachCsvRow("stop_times.txt", (row) => {
  const routeId = tripRoutes.get(row.trip_id);
  const stopId = row.stop_id;
  if (!routeId || !/[NS]$/.test(stopId)) return;

  const parentId = stopId.slice(0, -1);
  const direction = stopId.at(-1);
  const stationService = service.get(parentId) ?? new Map();
  const directions = stationService.get(routeId) ?? new Set();
  directions.add(direction);
  stationService.set(routeId, directions);
  service.set(parentId, stationService);
});

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
      }))
      .sort((a, b) => a.routeId.localeCompare(b.routeId, undefined, { numeric: true })),
  });
});

stations.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

await mkdir(new URL("../src/data/", import.meta.url), { recursive: true });
const source = `// Generated from the official MTA static GTFS files. Do not edit by hand.\n` +
  `import type { Route, Station } from "../types";\n\n` +
  `export const routes: Record<string, Route> = ${JSON.stringify(Object.fromEntries(routes), null, 2)};\n\n` +
  `export const stations: readonly Station[] = ${JSON.stringify(stations, null, 2)};\n`;

writeFileSync(OUTPUT, source);

const feedInfo = readFileSync(new URL("feed_info.txt", DATA_DIR), "utf8").trim().split("\n")[1];
console.log(`Generated ${stations.length} stations from GTFS (${feedInfo ?? "unknown version"}).`);
