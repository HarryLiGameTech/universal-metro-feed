/** A compact technical identifier; the full source value remains available on hover/focus. */
export function compactTripId(tripId: string): string {
  // MTA's last four characters are a pattern suffix shared by many trains.
  // Retain its six-digit trip prefix so adjacent arrivals stay distinguishable.
  const mtaTrip = tripId.match(/(?:^|_)(\d{6})_[^_]+$/);
  if (mtaTrip) return `${mtaTrip[1]}…${tripId.slice(-4)}`;
  return tripId.length > 12 ? `…${tripId.slice(-4)}` : tripId;
}
