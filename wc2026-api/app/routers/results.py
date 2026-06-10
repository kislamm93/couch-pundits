from fastapi import APIRouter, HTTPException, Depends
from app.models import ResultRequest, FixtureResponse
from app.db import fixtures_col, predictions_col
from app.security import require_admin

router = APIRouter(prefix="/fixtures", tags=["results"])


def _outcome(home: int, away: int) -> str:
    if home > away:
        return "home"
    if away > home:
        return "away"
    return "draw"


def _compute_points(pred_home: int, pred_away: int, home_score: int, away_score: int) -> int:
    if pred_home == home_score and pred_away == away_score:
        return 5
    if _outcome(pred_home, pred_away) == _outcome(home_score, away_score):
        return 2
    return 0


@router.put("/{match_id}/result", response_model=FixtureResponse, dependencies=[Depends(require_admin)])
async def set_result(match_id: int, body: ResultRequest):
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    await fixtures_col().update_one(
        {"match_id": match_id},
        {"$set": {
            "home_score": body.home_score,
            "away_score": body.away_score,
            "status": "finished",
        }},
    )

    # Score every prediction for this match immediately
    preds = await predictions_col().find({"match_id": match_id}).to_list(length=None)
    for pred in preds:
        pts = _compute_points(
            pred["pred_home"], pred["pred_away"],
            body.home_score, body.away_score,
        )
        await predictions_col().update_one(
            {"_id": pred["_id"]}, {"$set": {"points": pts}}
        )

    updated = await fixtures_col().find_one({"match_id": match_id}, {"_id": 0})
    return updated
