import type { Direction, Station } from "../types";

/** Groups are based on one *directed* GTFS stop-to-stop segment, not co-location by name. */
export function sharedLineGroups(station: Station, direction: Direction): string[][] {
  const routesBySegment = new Map<string, Set<string>>();
  for (const route of station.routes) {
    if (!route.directions.includes(direction)) continue;
    for (const segment of route.adjacentSegments?.[direction] ?? []) {
      const routeIds = routesBySegment.get(segment) ?? new Set<string>();
      routeIds.add(route.routeId);
      routesBySegment.set(segment, routeIds);
    }
  }

  const groups = new Map<string, string[]>();
  for (const routeIds of routesBySegment.values()) {
    if (routeIds.size < 2) continue;
    const ordered = station.routes.map(({ routeId }) => routeId).filter((routeId) => routeIds.has(routeId));
    groups.set(ordered.join("\0"), ordered);
  }

  return [...groups.values()]
    .filter((group) => ![...groups.values()].some((other) =>
      other.length > group.length && group.every((routeId) => other.includes(routeId))))
    .sort((left, right) => right.length - left.length || left.join("/").localeCompare(right.join("/")));
}

export function isSharedLineGroup(station: Station, direction: Direction, routeIds: readonly string[]): boolean {
  return sharedLineGroups(station, direction).some((group) =>
    group.length === routeIds.length && group.every((routeId) => routeIds.includes(routeId)));
}

export function directionDestinations(station: Station, routeIds: readonly string[], direction: Direction): string[] {
  const destinations = new Set<string>();
  for (const routeId of routeIds) {
    const route = station.routes.find((item) => item.routeId === routeId);
    for (const headsign of route?.headsigns?.[direction] ?? []) destinations.add(headsign);
  }
  return [...destinations];
}

export function directionDisplay(station: Station, routeIds: readonly string[], direction: Direction) {
  const destinations = directionDestinations(station, routeIds, direction);
  const published = routeIds.length === 1
    ? station.routes.find((route) => route.routeId === routeIds[0])?.directionNames?.[direction]
    : undefined;
  if (published) {
    return {
      short: published,
      full: destinations.length > 0 ? `${published} · Toward ${destinations.join(" / ")}` : published,
    };
  }
  if (destinations.length === 0) {
    return { short: `Direction ${direction}`, full: `Direction ${direction}` };
  }
  const shortNames = destinations.slice(0, 2).join(" / ");
  const extra = destinations.length > 2 ? ` +${destinations.length - 2} more` : "";
  return {
    short: `Toward ${shortNames}${extra}`,
    full: `Toward ${destinations.join(" / ")}`,
  };
}
