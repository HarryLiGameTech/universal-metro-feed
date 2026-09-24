import { createInterface } from "node:readline";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const [manifestPath, localZipPath] = process.argv.slice(2);
if (!manifestPath) throw new Error("Usage: generate-catalog.mjs <manifest.json> [GTFS.zip]");
const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
if (manifest.topology?.kind !== "gtfs-static" || !manifest.topology.sourceUrl ||
    !manifest.topology.catalogUrl || !Array.isArray(manifest.topology.routeTypes)) {
  throw new Error("The manifest needs a GTFS topology source, catalog URL, and route types.");
}

let temporary = null;
let zipPath = localZipPath ? resolve(localZipPath) : null;
if (!zipPath) {
  temporary = await mkdtemp(join(tmpdir(), "metro-gtfs-"));
  zipPath = join(temporary, "feed.zip");
  const response = await fetch(manifest.topology.sourceUrl);
  if (!response.ok) throw new Error(`GTFS download failed (${response.status}).`);
  await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
}

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value); value = "";
    } else value += character;
  }
  values.push(value);
  return values;
}

async function forEachCsvRow(fileName, callback) {
  const child = spawn("unzip", ["-p", zipPath, fileName], { stdio: ["ignore", "pipe", "pipe"] });
  const completion = new Promise((fulfill) => child.on("close", fulfill));
  let error = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { error += chunk; });
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  let headers = null;
  let record = "";
  for await (const line of lines) {
    record = record ? `${record}\n${line}` : line;
    // Quoted fields may contain newlines. Doubled quotes do not change parity.
    const quoteCount = [...record].filter((character) => character === '"').length;
    if (quoteCount % 2 !== 0) continue;
    const values = parseCsvLine(record.replace(/\r$/, ""));
    record = "";
    if (!headers) { headers = values.map((value) => value.replace(/^\uFEFF/, "")); continue; }
    callback(Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
  }
  const exitCode = await completion;
  if (exitCode !== 0 || record) throw new Error(`Could not read ${fileName}: ${error.trim()}`);
}

try {
  const allowedRouteTypes = new Set(manifest.topology.routeTypes.map(String));
  const routes = new Map();
  await forEachCsvRow("routes.txt", (row) => {
    if (!allowedRouteTypes.has(row.route_type)) return;
    const label = row.route_short_name || (row.route_id.startsWith("Green-") ? row.route_id.slice(-1) : row.route_id[0]);
    routes.set(row.route_id, {
      id: row.route_id,
      name: row.route_long_name || row.route_short_name || row.route_id,
      label,
      color: `#${row.route_color || "555555"}`,
      textColor: `#${row.route_text_color || "ffffff"}`,
      sortOrder: Number(row.route_sort_order) || 0,
    });
  });

  const directionNames = new Map();
  try {
    await forEachCsvRow("directions.txt", (row) => {
      if (!routes.has(row.route_id)) return;
      const bearing = row.direction || "";
      const destination = row.direction_destination || "";
      directionNames.set(`${row.route_id}/${row.direction_id}`,
        bearing && destination ? `${bearing} · ${destination}` : destination || bearing);
    });
  } catch (error) {
    if (!String(error).includes("directions.txt")) throw error;
  }

  let feedVersion = null;
  let feedStartDate = null;
  let feedEndDate = null;
  try {
    await forEachCsvRow("feed_info.txt", (row) => {
      feedVersion = row.feed_version || null;
      feedStartDate = row.feed_start_date || null;
      feedEndDate = row.feed_end_date || null;
    });
  } catch (error) {
    if (!String(error).includes("feed_info.txt")) throw error;
  }

  const stops = new Map();
  await forEachCsvRow("stops.txt", (row) => {
    if (row.location_type !== "1" && row.location_type !== "0" && row.location_type !== "") return;
    stops.set(row.stop_id, {
      id: row.stop_id,
      parentId: row.parent_station || row.stop_id,
      name: row.stop_name,
      locationType: row.location_type,
      latitude: Number(row.stop_lat),
      longitude: Number(row.stop_lon),
    });
  });

  const trips = new Map();
  const tripPatternIds = Object.create(null);
  await forEachCsvRow("trips.txt", (row) => {
    if (!routes.has(row.route_id)) {
      // Distinguish out-of-scope trips (e.g. trams) from unknown realtime trip IDs.
      if (manifest.topology.tripMapUrl) tripPatternIds[row.trip_id] = null;
      return;
    }
    trips.set(row.trip_id, {
      routeId: row.route_id,
      direction: row.direction_id,
      headsign: row.trip_headsign,
    });
  });

  const stationRoutes = new Map();
  const tripStops = new Map();
  function routeDirection(stationId, routeId, direction) {
    const key = `${stationId}\0${routeId}\0${direction}`;
    let data = stationRoutes.get(key);
    if (!data) {
      data = { stationId, routeId, direction, stopIds: new Set(), headsigns: new Map(), adjacentSegments: new Set() };
      stationRoutes.set(key, data);
    }
    return data;
  }

  await forEachCsvRow("stop_times.txt", (row) => {
    const trip = trips.get(row.trip_id);
    const stop = stops.get(row.stop_id);
    if (!trip || !stop || !stops.has(stop.parentId)) return;
    const data = routeDirection(stop.parentId, trip.routeId, trip.direction);
    data.stopIds.add(stop.id);
    const headsign = row.stop_headsign || trip.headsign;
    if (headsign) data.headsigns.set(headsign, (data.headsigns.get(headsign) ?? 0) + 1);
    const sequence = tripStops.get(row.trip_id) ?? [];
    sequence.push({ stopId: stop.id, parentId: stop.parentId, sequence: Number(row.stop_sequence) });
    tripStops.set(row.trip_id, sequence);
  });

  for (const [tripId, sequence] of tripStops) {
    const trip = trips.get(tripId);
    sequence.sort((left, right) => left.sequence - right.sequence);
    for (let index = 1; index < sequence.length; index += 1) {
      const previous = sequence[index - 1];
      const current = sequence[index];
      if (previous.parentId === current.parentId) continue;
      const segment = `${previous.parentId}>${current.parentId}`;
      routeDirection(previous.parentId, trip.routeId, trip.direction).adjacentSegments.add(segment);
      routeDirection(current.parentId, trip.routeId, trip.direction).adjacentSegments.add(segment);
    }
  }

  const byStation = new Map();
  for (const item of stationRoutes.values()) {
    const byRoute = byStation.get(item.stationId) ?? new Map();
    const route = byRoute.get(item.routeId) ?? { routeId: item.routeId, directions: [], headsigns: {}, adjacentSegments: {}, stopIds: {}, directionNames: {} };
    route.directions.push(item.direction);
    route.stopIds[item.direction] = [...item.stopIds].sort();
    route.headsigns[item.direction] = [...item.headsigns.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .map(([headsign]) => headsign);
    route.adjacentSegments[item.direction] = [...item.adjacentSegments].sort();
    const published = directionNames.get(`${item.routeId}/${item.direction}`);
    if (published) route.directionNames[item.direction] = published;
    byRoute.set(item.routeId, route);
    byStation.set(item.stationId, byRoute);
  }

  const stations = [...byStation.entries()].map(([stationId, byRoute]) => {
    const stop = stops.get(stationId);
    return {
      id: stationId,
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
      routes: [...byRoute.values()].map((route) => ({ ...route, directions: route.directions.sort() })).sort((left, right) =>
        routes.get(left.routeId).sortOrder - routes.get(right.routeId).sortOrder || left.routeId.localeCompare(right.routeId)),
    };
  }).sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
  const cleanRoutes = Object.fromEntries([...routes].map(([id, { sortOrder: _sortOrder, ...route }]) => [id, route]));
  const source = { url: manifest.topology.sourceUrl, feedVersion, feedStartDate, feedEndDate };
  if (manifest.topology.tripMapUrl) {
    // Many trips share a stopping pattern. Store each pattern once, without clock times.
    const patterns = [];
    const patternIds = new Map();
    for (const [tripId, sequence] of [...tripStops].sort(([left], [right]) => left.localeCompare(right))) {
      const trip = trips.get(tripId);
      const pattern = {
        routeId: trip.routeId,
        direction: trip.direction || null,
        headsign: trip.headsign || null,
        stops: Object.fromEntries(sequence.map((stop) => [stop.sequence, stop.stopId])),
      };
      const key = JSON.stringify(pattern);
      let id = patternIds.get(key);
      if (id === undefined) {
        id = patterns.length;
        patterns.push(pattern);
        patternIds.set(key, id);
      }
      tripPatternIds[tripId] = id;
    }
    const mapOutput = resolve("public", manifest.topology.tripMapUrl.replace(/^\/+/, ""));
    await mkdir(dirname(mapOutput), { recursive: true });
    await writeFile(mapOutput, JSON.stringify({
      schemaVersion: 1, providerId: manifest.id, source, patterns, trips: tripPatternIds,
    }));
    console.log(`Trip map: ${tripStops.size} trips share ${patterns.length} stopping patterns.`);
  }
  const output = resolve("public", manifest.topology.catalogUrl.replace(/^\/+/, ""));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({
    providerId: manifest.id,
    timezone: manifest.timezone,
    source,
    routes: cleanRoutes,
    stations,
  }));
  console.log(`Generated ${manifest.id}: ${stations.length} stations, ${routes.size} routes, ${tripStops.size} trips.`);
} finally {
  if (temporary) await rm(temporary, { recursive: true });
}
