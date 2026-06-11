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
    member_ids = await _resolve_member_ids(account_id, league_id)

    initial_match: dict = {"points": {"$ne": None}}
    if member_ids is not None:
        initial_match["account_id"] = {"$in": member_ids}

    pipeline = [
        {"$match": initial_match},
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
        {"$set": {"username": {"$ifNull": [{"$first": "$user.username"}, "unknown"]}}},
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
        )
        for r in results
    ]


async def _resolve_member_ids(account_id: str, league_id: Optional[str]) -> Optional[list]:
    """Return the list of account_ids to filter by, or None for no filter."""
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
        return league["member_account_ids"]

    # Default: union of all leagues the user belongs to
    leagues = await leagues_col().find({"member_account_ids": account_id}).to_list(length=None)
    if not leagues:
        return None  # user is in no leagues — show everyone (backwards compat)
    return list({aid for league in leagues for aid in league["member_account_ids"]})
