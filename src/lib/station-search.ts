import type { Route, Station } from "../types";

function normalize(value: string): string {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function searchStations(stations: readonly Station[], routes: Record<string, Route>, query: string): readonly Station[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return stations;
  return stations.filter((station) => {
    const text = normalize([station.name, station.id, ...station.routes.flatMap(({ routeId }) =>
      [routeId, routes[routeId]?.label ?? "", routes[routeId]?.name ?? ""])].join(" "));
    return terms.every((term) => text.includes(term));
  });
}
