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


# Round-of-32 matchups confirmed so far, once final group standings locked the
# teams in. (match_id, date, "HH:MM UTC±N", home, away, ground)
# The rest of the knockout bracket is still undetermined — add later fixtures
# by hand in Mongo once their matchups are confirmed.
KNOCKOUT_R32 = [
    (73, "2026-06-28", "12:00 UTC-7", "South Africa", "Canada", "Los Angeles (Inglewood)"),
    (74, "2026-06-29", "16:30 UTC-4", "Germany", "Paraguay", "Boston (Foxborough)"),
    (75, "2026-06-29", "19:00 UTC-6", "Netherlands", "Morocco", "Monterrey (Guadalupe)"),
    (76, "2026-06-29", "12:00 UTC-5", "Brazil", "Japan", "Houston"),
    (77, "2026-06-30", "17:00 UTC-4", "France", "Sweden", "New York/New Jersey (East Rutherford)"),
    (78, "2026-06-30", "12:00 UTC-5", "Ivory Coast", "Norway", "Dallas (Arlington)"),
    (79, "2026-06-30", "19:00 UTC-6", "Mexico", "Ecuador", "Mexico City"),
    (80, "2026-07-01", "12:00 UTC-4", "Ghana", "Colombia", "Atlanta"),
    (81, "2026-07-01", "17:00 UTC-7", "USA", "Bosnia & Herzegovina", "San Francisco Bay Area (Santa Clara)"),
    (82, "2026-07-01", "13:00 UTC-7", "Belgium", "Senegal", "Seattle"),
    (83, "2026-07-02", "19:00 UTC-4", "Portugal", "Croatia", "Toronto"),
    (84, "2026-07-02", "12:00 UTC-7", "Spain", "Austria", "Los Angeles (Inglewood)"),
    (85, "2026-07-02", "20:00 UTC-7", "Switzerland", "Algeria", "Vancouver"),
    (86, "2026-07-03", "18:00 UTC-4", "Argentina", "Cape Verde", "Miami (Miami Gardens)"),
    (87, "2026-07-03", "20:30 UTC-5", "DR Congo", "England", "Kansas City"),
    (88, "2026-07-03", "13:00 UTC-5", "Australia", "Egypt", "Dallas (Arlington)"),
]


def build_knockout_fixtures():
    """The confirmed Round-of-32 fixtures — see KNOCKOUT_R32 above."""
    with open(DATA_DIR / "worldcup.stadiums.json") as f:
        stadiums_data = json.load(f)
    city_to_stadium = {s["city"]: s["name"] for s in stadiums_data["stadiums"]}

    fixtures = []
    for match_id, date, time_str, home, away, city in KNOCKOUT_R32:
        fixtures.append({
            "match_id": match_id,
            "group": None,
            "round": "Round of 32",
            "home_team": home,
            "away_team": away,
            "stadium": city_to_stadium.get(city, city),
            "city": city,
            "kickoff_utc": parse_kickoff_utc(date, time_str),
            "stage": "knockout",
            "home_score": None,
            "away_score": None,
            "status": "scheduled",
        })
    return fixtures


async def seed_knockout_if_missing(db):
    """Idempotent: inserts the confirmed Round-of-32 fixtures if missing.
    Never touches a fixture that already exists, so manual DB edits (filling
    in later rounds, fixing a name) are always safe."""
    try:
        col = db["fixtures"]
        inserted = 0
        for fixture in build_knockout_fixtures():
            result = await col.update_one(
                {"match_id": fixture["match_id"]},
                {"$setOnInsert": fixture},
                upsert=True,
            )
            if result.upserted_id:
                inserted += 1
        if inserted:
            print(f"Seeded {inserted} knockout fixture(s).")
    except Exception as exc:
        print(f"WARNING: knockout fixture seed skipped — {exc}")
