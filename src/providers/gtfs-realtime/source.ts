import GtfsRealtimeBindings from "gtfs-realtime-bindings";

/** Shared transport and protobuf decoding; provider adapters interpret the feed. */
export async function fetchGtfsRealtimeFeed(url: string, signal?: AbortSignal) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") throw new Error("GTFS-Realtime feeds must use HTTPS.");
  const response = await fetch(parsed, {
    cache: "no-store",
    headers: { Accept: "application/x-protobuf, application/octet-stream" },
    signal,
  });
  if (!response.ok) throw new Error(`GTFS-Realtime source returned ${response.status} ${response.statusText}`);
  return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(await response.arrayBuffer()));
}
