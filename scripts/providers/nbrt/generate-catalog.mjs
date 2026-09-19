import { readFile, writeFile, mkdir } from "node:fs/promises";

// A station directory only: no ordered line topology or adjacent segments are imported.
const source = JSON.parse(await readFile(new URL("./stations.source.json", import.meta.url), "utf8"));
const directions = JSON.parse(await readFile(new URL("./directions.json", import.meta.url), "utf8"));
const routes = Object.fromEntries(Object.keys(directions).map((id) => [id, {
  id, name: `${id}号线`, label: id, color: "#555555", textColor: "#ffffff",
}]));
const stations = source.map((station) => ({
  id: String(station.id),
  name: station.name,
  latitude: null,
  longitude: null,
  routes: station.lineIds.filter((id) => directions[id]).map((id) => {
    const labels = directions[id];
    // A terminal is an origin only in the direction toward the opposite terminal.
    const originDirections = Object.keys(labels).filter((direction) =>
      station.name === labels[direction === "1" ? "2" : "1"]);
    return {
      routeId: String(id),
      directions: ["1", "2"],
      headsigns: Object.fromEntries(Object.entries(labels).map(([direction, name]) => [direction, [name]])),
      ...(originDirections.length ? { originDirections } : {}),
    };
  }),
}));

const output = new URL("../../../public/providers/nbrt-subway/catalog.json", import.meta.url);
await mkdir(new URL(".", output), { recursive: true });
await writeFile(output, JSON.stringify({
  providerId: "nbrt-subway", timezone: "Asia/Shanghai", routes, stations,
}, null, 2) + "\n");
console.log(`Generated NBRT station directory: ${stations.length} stations, ${Object.keys(routes).length} lines; no line topology.`);
