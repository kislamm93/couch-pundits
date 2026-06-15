from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models import LeaderboardRow
from app.db import predictions_col, leagues_col
from app.security import get_current_account

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=List[LeaderboardRow])
async def leaderboard(
    league_id: Optional[str] = Query(None),
    account_id: str = Depends(get_current_account),
):
    member_ids, start_date = await _resolve_league(account_id, league_id)

    initial_match: dict = {"points": {"$ne": None}}
    if member_ids is not None:
        initial_match["account_id"] = {"$in": member_ids}

    pipeline: list = [{"$match": initial_match}]

    if start_date is not None:
        pipeline += [
            {
                "$lookup": {
                    "from": "fixtures",
                    "localField": "match_id",
                    "foreignField": "match_id",
                    "as": "fixture",
                }
            },
            {"$set": {"kickoff": {"$first": "$fixture.kickoff_utc"}}},
            {"$match": {"$expr": {
                "$gte": [
                    {"$dateFromString": {"dateString": "$kickoff"}},
                    start_date,
                ]
            }}},
        ]

    pipeline += [
        {
            "$group": {
                "_id": "$account_id",
                "total_points": {"$sum": "$points"},
                "exact_count": {"$sum": {"$cond": [{"$eq": ["$points", 5]}, 1, 0]}},
                "diff_count": {"$sum": {"$cond": [{"$eq": ["$points", 3]}, 1, 0]}},
                "correct_count": {"$sum": {"$cond": [{"$eq": ["$points", 2]}, 1, 0]}},
                "played": {"$sum": 1},
            }
        },
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "account_id",
                "as": "user",
            }
        },
        {"$set": {
            "username": {"$ifNull": [{"$first": "$user.username"}, "unknown"]},
            "favorite_team": {"$ifNull": [{"$first": "$user.favorite_team"}, ""]},
        }},
        {"$sort": {"total_points": -1, "username": 1}},
    ]

    results = await predictions_col().aggregate(pipeline).to_list(length=None)
    return [
        LeaderboardRow(
            username=r["username"],
            total_points=r["total_points"],
            exact_count=r["exact_count"],
            diff_count=r["diff_count"],
            correct_count=r["correct_count"],
            played=r["played"],
            favorite_team=r.get("favorite_team", ""),
        )
        for r in results
    ]


async def _resolve_league(account_id: str, league_id: Optional[str]):
    """Return (member_ids, start_date). member_ids=None means no filter."""
    if league_id:
        try:
            oid = ObjectId(league_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid league id")
        league = await leagues_col().find_one({"_id": oid})
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        if account_id not in league["member_account_ids"]:
            raise HTTPException(status_code=403, detail="You are not in this league")
        return league["member_account_ids"], league.get("start_date")

    # No league selected: global leaderboard (everyone, all history). Only reached
    # by users in no league — the FE always sends a league_id when the user has
    # groups, so cross-group point leakage is no longer possible here.
    return None, None
