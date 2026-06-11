from fastapi import APIRouter
from typing import List
from app.models import LeaderboardRow
from app.db import predictions_col

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


@router.get("", response_model=List[LeaderboardRow])
async def leaderboard():
    pipeline = [
        {"$match": {"points": {"$ne": None}}},
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
        # Resolve the account's current username for display
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "account_id",
                "as": "user",
            }
        },
        {"$set": {"username": {"$ifNull": [{"$first": "$user.username"}, "unknown"]}}},
        {"$sort": {"total_points": -1}},
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
