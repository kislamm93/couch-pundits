import json
import re
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "2026"


def parse_kickoff_utc(date_str, time_str):
    """Convert '2026-06-11' + '13:00 UTC-6' → '2026-06-11T19:00:00Z'"""
    m = re.match(r"(\d+):(\d+)\s+UTC([+-]\d+)", time_str)
    if not m:
        raise ValueError(f"Cannot parse time: {time_str!r}")
    h, mi, offset = int(m.group(1)), int(m.group(2)), int(m.group(3))
    local_dt = datetime.strptime(f"{date_str} {h:02d}:{mi:02d}", "%Y-%m-%d %H:%M")
    utc_dt = local_dt + timedelta(hours=-offset)
    return utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def build_fixtures():
    """Build the 72 group-stage fixtures from the 2026/ source JSON."""
    with open(DATA_DIR / "worldcup.json") as f:
        wc = json.load(f)
    with open(DATA_DIR / "worldcup.stadiums.json") as f:
        stadiums_data = json.load(f)

    city_to_stadium = {s["city"]: s["name"] for s in stadiums_data["stadiums"]}

    fixtures = []
    match_id = 1
    for match in wc["matches"]:
        if not match.get("group"):
            continue
        group = match["group"].replace("Group ", "")
        city = match["ground"]
        fixtures.append({
            "match_id": match_id,
            "group": group,
            "home_team": match["team1"],
            "away_team": match["team2"],
            "stadium": city_to_stadium.get(city, city),
            "city": city,
            "kickoff_utc": parse_kickoff_utc(match["date"], match["time"]),
            "stage": "group",
            "home_score": None,
            "away_score": None,
            "status": "scheduled",
        })
        match_id += 1
    return fixtures


async def seed_if_empty(db):
    """Seed fixtures only when the collection is empty. Idempotent and
    non-fatal — a failure here logs a warning rather than crashing startup."""
    try:
        col = db["fixtures"]
        existing = await col.count_documents({})
        if existing > 0:
            print(f"Fixtures already present ({existing}) — skipping seed.")
            return

        fixtures = build_fixtures()
        for fixture in fixtures:
            await col.update_one(
                {"match_id": fixture["match_id"]},
                {"$setOnInsert": fixture},
                upsert=True,
            )
        print(f"Seeded {len(fixtures)} fixtures from 2026/worldcup.json")
    except Exception as exc:
        print(f"WARNING: fixture seed skipped — {exc}")
