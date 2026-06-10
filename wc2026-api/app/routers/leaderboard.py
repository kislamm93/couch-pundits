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
                "_id": "$username",
                "total_points": {"$sum": "$points"},
                "exact_count": {"$sum": {"$cond": [{"$eq": ["$points", 5]}, 1, 0]}},
                "correct_count": {"$sum": {"$cond": [{"$eq": ["$points", 2]}, 1, 0]}},
                "played": {"$sum": 1},
            }
        },
        {"$sort": {"total_points": -1}},
    ]
    results = await predictions_col().aggregate(pipeline).to_list(length=None)
    return [
        LeaderboardRow(
            username=r["_id"],
            total_points=r["total_points"],
            exact_count=r["exact_count"],
            correct_count=r["correct_count"],
            played=r["played"],
        )
        for r in results
    ]
