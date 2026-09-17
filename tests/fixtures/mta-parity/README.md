# Current MTA behavior parity corpus

These fixtures freeze observable behavior **before** the resolver and Clockface refactor. They are synthetic, not a live MTA capture or a claim about current service. All times are fixed to September 2026 in `America/New_York` so tests are deterministic.

## Inputs

- `static/topology.json`: the minimal network identity needed by a future topology source. The current implementation still reads the generated station index; the parity test verifies that its relevant names match this fixture.
- `static/calendar.json`: the response body for `/timetables/calendar.json`, including a removed weekday service on September 14.
- `static/127-1-N.json`: the response body for `/timetables/127/1-N.json`, including a `24:02:30` Sunday trip and an event without a departure time.
- `realtime/*.feed.json`: GTFS-Realtime `FeedMessage` objects. The test protobuf-encodes them and returns the bytes from the mocked MTA endpoint, so the existing decode path is exercised.

## Frozen outputs

The `expected/*.json` files are checked-in golden results from the current code. The tests compare complete `ArrivalSnapshot` and `TimetableResult` values, including ordering, destination labels, delay classifications, feed timestamps, calendar exceptions, and after-midnight service-day matching. A missing static timetable returns live arrivals without schedule-based delay values.

Run `npm test` to verify the baseline without calling the network. Do not regenerate golden results automatically during a refactor. Review every proposed change to them as a product behavior change.

## Using this corpus with the new architecture

Feed the same topology, timetable, calendar, and realtime inputs to the composed resolver. Because the future canonical types will differ from today's `ArrivalSnapshot` and `TimetableResult`, compare a deliberate legacy/UI projection rather than raw object shapes. The projection should preserve current rider-visible behavior unless the team explicitly approves a correction (for example, removing unsupported precision under `StrictTime`). Record such approved deviations in this README and add a separate test for the new intended behavior; do not silently weaken or delete the golden tests.

This corpus is deliberately small. It is a regression gate, not proof that every agency, feed variant, or provider quirk is supported. Add fixtures as each new source shape is integrated.
