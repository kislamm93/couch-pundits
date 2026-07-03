"""Background live-score poller (additive feature).

Polls TheSportsDB for World Cup matches and keeps Mongo fixtures in sync:

  * in-progress match  -> live score + recompute points live (status untouched;
                          the UI decides "live" from kickoff time). Points are
                          provisional and follow the running score.
  * finished match     -> status "finished" + final score + recompute points,
                          exactly as the admin PUT /result endpoint does

Fixtures are matched by the backfilled `sportsdb_event_id` field. Nothing here
overrides a fixture that is already "finished" — admin-entered finals stay put.

Enabled by default; set LIVE_POLL_ENABLED=false to turn it off. The loop is
fully guarded so a feed/network hiccup can never crash the service.
"""
import asyncio
import json
import logging
import os
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen

from app.db import fixtures_col, predictions_col
from app.routers.results import _compute_points

class _PollerLog(logging.LoggerAdapter):
    """Prefixes every poller line with [poller] so they're easy to grep/filter."""
    def process(self, msg, kwargs):
        return f"[poller] {msg}", kwargs


logger = _PollerLog(logging.getLogger("uvicorn.error"), {})

ENABLED = os.getenv("LIVE_POLL_ENABLED", "true").lower() in ("1", "true", "yes")
POLL_SECONDS = int(os.getenv("LIVE_POLL_SECONDS", "60"))
SPORTSDB_KEY = os.getenv("SPORTSDB_KEY", "3")
# Debug heartbeat: log every cycle (incl. idle "0 active") with what the feed
# returned. Off by default so prod stays quiet; enable locally to watch it tick.
DEBUG = os.getenv("LIVE_POLL_DEBUG", "false").lower() in ("1", "true", "yes")
# How long after kickoff a fixture stays "active" (checked each cycle) before we
# give up waiting for the feed to finalize it. Default 16h so a match kicked off
# anywhere in the daily WC window (~14:00–06:00 UTC) keeps being checked until
# the end of it, even when the free feed is slow to report FT.
ACTIVE_WINDOW_HOURS = float(os.getenv("LIVE_ACTIVE_WINDOW_HOURS", "16"))

# TheSportsDB status codes (mirror API-Football).
LIVE_STATUSES = {"1H", "HT", "2H", "ET", "BT", "P", "LIVE"}
FINISHED_STATUSES = {"FT", "AET", "PEN", "AP"}

_LOOKUP = f"https://www.thesportsdb.com/api/v1/json/{SPORTSDB_KEY}/lookupevent.php"


def _to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _lookup_event(event_id):
    """Blocking lookup of one event by id. Reliable per-id (unlike eventsday,
    which omits events on the free key). Runs in a worker thread."""
    req = Request(f"{_LOOKUP}?id={event_id}", headers={"User-Agent": "wc2026-live/1.0"})
    with urlopen(req, timeout=20) as resp:
        events = json.load(resp).get("events") or []
    return events[0] if events else None


async def _active_fixtures():
    """Fixtures that have kicked off, aren't finished yet, and are still within
    the active window — i.e. the ones worth checking this cycle. Driven by our
    own kickoff times, so a match never falls out of a day-bucket again."""
    now = datetime.now(timezone.utc)
    floor = (now - timedelta(hours=ACTIVE_WINDOW_HOURS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    ceil = now.strftime("%Y-%m-%dT%H:%M:%SZ")  # ISO-8601 Z strings sort chronologically
    cursor = fixtures_col().find({
        "status": {"$ne": "finished"},
        "sportsdb_event_id": {"$exists": True},
        "kickoff_utc": {"$lte": ceil, "$gte": floor},
    })
    return await cursor.to_list(length=None)


async def _apply_score(fixture, home, away, *, finished):
    """Write the score and recompute every prediction's points for this match.

    finished=True  → set status "finished"
    finished=False → live or FT-draw interim update (ET still to come)
    """
    match_id = fixture["match_id"]
    teams = f"{fixture['home_team']} v {fixture['away_team']}"
    prev_home, prev_away = fixture.get("home_score"), fixture.get("away_score")
    prev = f"{prev_home}-{prev_away}" if prev_home is not None and prev_away is not None else "–"

    update = {"home_score": home, "away_score": away}
    if finished:
        update["status"] = "finished"
    await fixtures_col().update_one({"match_id": match_id}, {"$set": update})

    # The feed doesn't expose shootout winners, so penalty_winner stays whatever's
    # already on the fixture (None unless an admin set it by hand).
    preds = await predictions_col().find({"match_id": match_id}).to_list(length=None)
    for pred in preds:
        pts = _compute_points(
            pred["pred_home"], pred["pred_away"], home, away,
            pred.get("pred_penalty_winner"), fixture.get("penalty_winner"),
        )
        await predictions_col().update_one({"_id": pred["_id"]}, {"$set": {"points": pts}})

    if finished:
        logger.info("⏱  FULL TIME — match %s %s  %d-%d  (rescored %d prediction(s))",
                    match_id, teams, home, away, len(preds))
    else:
        logger.info("⚽ SCORE CHANGE — match %s %s  %s → %d-%d  (rescored %d prediction(s))",
                    match_id, teams, prev, home, away, len(preds))


async def _apply_event(event):
    """Apply one feed event to its fixture. Returns True if it wrote a change."""
    fixture = await fixtures_col().find_one({"sportsdb_event_id": event.get("idEvent")})
    if not fixture or fixture.get("status") == "finished":
        return False  # unmapped, or already terminal — never override a final result

    # Guard against a stale/historical event ID mapping: if the feed's event date
    # doesn't match our fixture's kickoff date, the sportsdb_event_id is wrong.
    feed_date = event.get("dateEvent") or ""  # "YYYY-MM-DD"
    fixture_kickoff = fixture.get("kickoff_utc") or ""  # "YYYY-MM-DDTHH:MM:SSZ"
    if feed_date and fixture_kickoff and not fixture_kickoff.startswith(feed_date):
        logger.warning(
            "BAD MAPPING — match %s %s v %s: sportsdb_event_id %s belongs to %s, not %s — skipping",
            fixture.get("match_id"), fixture.get("home_team"), fixture.get("away_team"),
            event.get("idEvent"), feed_date, fixture_kickoff[:10],
        )
        return False

    status = event.get("strStatus") or ""
    home, away = _to_int(event.get("intHomeScore")), _to_int(event.get("intAwayScore"))
    if home is None or away is None:
        return False  # no usable score yet — wait for the next poll

    if status in FINISHED_STATUSES:
        if status == "FT" and home == away:
            # FT draw → extra time is coming; update score but don't finalise
            await _apply_score(fixture, home, away, finished=False)
        else:
            await _apply_score(fixture, home, away, finished=True)
        return True
    if status in LIVE_STATUSES:
        if (fixture.get("home_score"), fixture.get("away_score")) != (home, away):
            await _apply_score(fixture, home, away, finished=False)
            return True
    return False  # scheduled / postponed / unchanged — left untouched


async def _poll_once():
    fixtures = await _active_fixtures()

    events = []
    for fixture in fixtures:  # empty when idle → no HTTP calls
        try:
            event = await asyncio.to_thread(_lookup_event, fixture["sportsdb_event_id"])
            if event:
                events.append(event)
        except Exception as exc:
            logger.warning("lookup failed for match %s — %s", fixture["match_id"], exc)

    if DEBUG:
        feed = " | ".join(
            f"{e.get('idEvent')} {e.get('strHomeTeam')} {e.get('intHomeScore')}-"
            f"{e.get('intAwayScore')} {e.get('strAwayTeam')} [{e.get('strStatus')}]"
            for e in events
        )
        logger.info("%d active fixture(s)%s",
                    len(fixtures), f" — {feed}" if feed else "")

    for event in events:
        try:
            await _apply_event(event)
        except Exception as exc:
            logger.warning("apply failed for %s — %s", event.get("idEvent"), exc)


async def run_poller():
    """Long-lived loop, started as a background task on app startup."""
    if not ENABLED:
        logger.info("disabled (LIVE_POLL_ENABLED=false).")
        return
    logger.info("started — every %ss (active window %sh, debug=%s).",
                POLL_SECONDS, ACTIVE_WINDOW_HOURS, DEBUG)
    while True:
        await _poll_once()
        await asyncio.sleep(POLL_SECONDS)
