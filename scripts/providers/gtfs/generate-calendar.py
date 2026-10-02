"""Extract a Clockface-matched GTFS service calendar from an official snapshot."""

import csv
import hashlib
import json
import sys
import zipfile
from pathlib import Path


def rows(archive, name):
    with archive.open(name) as source:
        import io

        yield from csv.DictReader(io.TextIOWrapper(source, encoding="utf-8-sig", newline=""))


provider_id, zip_name, parse_run_id = sys.argv[1:4]
if provider_id not in {"bart", "cta"}:
    raise SystemExit("Expected provider ID bart or cta")
zip_path = Path(zip_name)
with zipfile.ZipFile(zip_path) as archive:
    calendar = [
        {
            "serviceId": row["service_id"],
            "startDate": row["start_date"],
            "endDate": row["end_date"],
            "days": [row[day] == "1" for day in
                     ("sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday")],
        }
        for row in rows(archive, "calendar.txt")
    ]
    exceptions = [
        {
            "serviceId": row["service_id"],
            "date": row["date"],
            "exceptionType": int(row["exception_type"]),
        }
        for row in rows(archive, "calendar_dates.txt")
    ]

output = Path("public/providers") / provider_id / "calendar.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({
    "sourceContentHash": hashlib.sha256(zip_path.read_bytes()).hexdigest(),
    "sourceParseRunId": parse_run_id,
    "calendar": calendar,
    "exceptions": exceptions,
}, separators=(",", ":")) + "\n")
print(f"Generated {output} with {len(calendar)} services and {len(exceptions)} exceptions")
