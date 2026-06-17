"""Idempotent event-ID backfill — runs at startup, migration-style.

Links each fixture to its TheSportsDB event by writing `sportsdb_event_id`,
queried per fixture via searchevents.php (reliable on the free key, unlike
eventsday.php). Only fixtures missing the field are looked up, so it is safe to
run on every boot: once everything is mapped it does nothing. It is also
throttle-aware — the free key rate-limits after ~30 calls, so it pauses on a run
of empty responses and resumes on the next boot.

Name aliases live here, in this one-time controlled mapping — never in the live
poller, which keys strictly off the stored id (see livescores.py).

Run automatically from the app startup hook, or standalone as a migration:

    python -m app.backfill_event_ids
"""
import asyncio
import json
import logging
import os
import unicodedata
from urllib.parse import quote
from urllib.request import Request, urlopen

from app.db import connect_db, close_db, fixtures_col

logger = logging.getLogger("uvicorn.error")

SPORTSDB_KEY = os.getenv("SPORTSDB_KEY", "3")
LEAGUE_FILTER = os.getenv("LIVE_LEAGUE_FILTER", "World Cup").lower()
SLEEP_SECONDS = float(os.getenv("BACKFILL_SLEEP_SECONDS", "2.0"))
# Consecutive empty responses that almost certainly mean "rate-limited", not
# "genuinely absent" — at which point we pause and resume on the next boot.
THROTTLE_STREAK = int(os.getenv("BACKFILL_THROTTLE_STREAK", "6"))

# Our normalised name -> their normalised name, for the few that differ.
ALIASES = {
    "united states": "usa",
    "bosnia & herzegovina": "bosnia-herzegovina",
}


def _canonical(name):
    """Lower-case, strip accents (Curaçao -> curacao), collapse whitespace."""
    decomposed = unicodedata.normalize("NFKD", name or "")
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.lower().split())


def _normalize(name):
    canonical = _canonical(name)
    return ALIASES.get(canonical, canonical)


def _search(home, away, kickoff_date=None):
    """Blocking lookup. Returns (idEvent | None, empty_response: bool).

    kickoff_date, if provided, is a "YYYY-MM-DD" string used to disambiguate
    when TheSportsDB returns multiple WC fixtures for the same pair of teams
    (e.g. historical + current tournament).
    """
    query = f"{_normalize(home)}_vs_{_normalize(away)}"
    url = (f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_KEY}"
           f"/searchevents.php?e={quote(query)}")
    req = Request(url, headers={"User-Agent": "wc2026-backfill/1.0"})
    with urlopen(req, timeout=20) as resp:
        events = json.load(resp).get("event") or []
    if not events:
        return None, True  # nothing back — genuinely absent OR rate-limited
    candidates = [
        e for e in events
        if (LEAGUE_FILTER in (e.get("strLeague") or "").lower()
            and _normalize(e.get("strHomeTeam")) == _normalize(home)
            and _normalize(e.get("strAwayTeam")) == _normalize(away))
    ]
    if not candidates:
        return None, False  # results returned but none were our match
    if kickoff_date:
        # When we know the expected date, require an exact match — never fall
        # back to a different-dated candidate (e.g. a historical WC result).
        for e in candidates:
            if (e.get("dateEvent") or "") == kickoff_date:
                return e.get("idEvent"), False
        return None, False  # candidates exist but none are on our date
    return candidates[0].get("idEvent"), False


async def backfill_event_ids():
    """Map any fixtures still missing `sportsdb_event_id`. Idempotent."""
    col = fixtures_col()
    todo = await col.find({"sportsdb_event_id": {"$exists": False}}).to_list(length=None)
    if not todo:
        logger.info("Event-ID backfill: all fixtures already mapped.")
        return

    logger.info("Event-ID backfill: %d fixture(s) to map...", len(todo))
    mapped = 0
    empty_streak = 0
    for fixture in sorted(todo, key=lambda f: f.get("kickoff_utc", "")):
        kickoff_date = (fixture.get("kickoff_utc") or "")[:10] or None
        try:
            eid, empty = await asyncio.to_thread(_search, fixture["home_team"], fixture["away_team"], kickoff_date)
        except Exception as exc:
            logger.warning("Event-ID backfill: lookup failed for match %s — %s",
                           fixture["match_id"], exc)
            eid, empty = None, True

        if eid:
            empty_streak = 0
            await col.update_one({"match_id": fixture["match_id"]},
                                 {"$set": {"sportsdb_event_id": eid}})
            mapped += 1
        elif empty:
            empty_streak += 1
            if empty_streak >= THROTTLE_STREAK:
                logger.warning("Event-ID backfill: paused (likely rate-limited) — "
                               "mapped %d this run, resumes next boot.", mapped)
                return
        await asyncio.sleep(SLEEP_SECONDS)

    logger.info("Event-ID backfill: mapped %d fixture(s) this run.", mapped)


async def _main():
    await connect_db()
    try:
        await backfill_event_ids()
    finally:
        await close_db()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(_main())
