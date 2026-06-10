import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent.parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "wc2026")


def _outcome(home: int, away: int) -> str:
    if home > away:
        return "home"
    if away > home:
        return "away"
    return "draw"


def compute_points(pred_home: int, pred_away: int, home_score: int, away_score: int) -> int:
    if pred_home == home_score and pred_away == away_score:
        return 5
    if _outcome(pred_home, pred_away) == _outcome(home_score, away_score):
        return 2
    return 0


async def score():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    fixtures_col = db["fixtures"]
    predictions_col = db["predictions"]

    finished = await fixtures_col.find(
        {"status": "finished", "home_score": {"$ne": None}, "away_score": {"$ne": None}}
    ).to_list(length=None)

    matches_scored = 0
    predictions_updated = 0

    for fixture in finished:
        match_id = fixture["match_id"]
        preds = await predictions_col.find({"match_id": match_id}).to_list(length=None)
        for pred in preds:
            pts = compute_points(
                pred["pred_home"], pred["pred_away"],
                fixture["home_score"], fixture["away_score"],
            )
            await predictions_col.update_one(
                {"_id": pred["_id"]}, {"$set": {"points": pts}}
            )
            predictions_updated += 1
        matches_scored += 1

    print(f"Scored {matches_scored} matches, updated {predictions_updated} predictions.")
    client.close()


if __name__ == "__main__":
    asyncio.run(score())
