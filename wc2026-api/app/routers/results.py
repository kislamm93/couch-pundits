import logging
from fastapi import APIRouter, HTTPException, Depends
from app.models import ResultRequest, FixtureResponse
from app.db import fixtures_col, predictions_col
from app.security import require_admin

router = APIRouter(prefix="/fixtures", tags=["results"])
logger = logging.getLogger("uvicorn.error")


def _outcome(home: int, away: int) -> str:
    if home > away:
        return "home"
    if away > home:
        return "away"
    return "draw"


def _compute_points(
    pred_home: int, pred_away: int, home_score: int, away_score: int,
    pred_penalty_winner: str = None, penalty_winner: str = None,
) -> int:
    if pred_home == home_score and pred_away == away_score:
        points = 5
    # Correct signed goal difference on a decisive result (1-0 ≠ 0-1).
    # Draws (pred_home == pred_away) are excluded — they fall through to the
    # outcome tier below and score 2, since every draw shares a 0 difference.
    elif pred_home != pred_away and (pred_home - pred_away) == (home_score - away_score):
        points = 3
    elif _outcome(pred_home, pred_away) == _outcome(home_score, away_score):
        points = 2
    else:
        points = 0
    # Knockout penalty-shootout bonus — only ever applies on top of the exact (5)
    # or correct-draw (2) tiers above, since both predicted and actual scores
    # have to be level for a penalty_winner to exist at all.
    if penalty_winner and pred_penalty_winner and pred_penalty_winner == penalty_winner:
        points += 2
    return points


@router.put("/{match_id}/result", response_model=FixtureResponse, dependencies=[Depends(require_admin)])
async def set_result(match_id: int, body: ResultRequest):
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    is_draw = body.home_score == body.away_score
    if body.penalty_winner and not is_draw:
        raise HTTPException(status_code=400, detail="Tie breaker winner only applies to a drawn result")
    penalty_winner = body.penalty_winner if (is_draw and fixture.get("stage") == "knockout") else None

    await fixtures_col().update_one(
        {"match_id": match_id},
        {"$set": {
            "home_score": body.home_score,
            "away_score": body.away_score,
            "status": "finished",
            "penalty_winner": penalty_winner,
        }},
    )

    # Score every prediction for this match immediately
    preds = await predictions_col().find({"match_id": match_id}).to_list(length=None)
    for pred in preds:
        pts = _compute_points(
            pred["pred_home"], pred["pred_away"],
            body.home_score, body.away_score,
            pred.get("pred_penalty_winner"), penalty_winner,
        )
        await predictions_col().update_one(
            {"_id": pred["_id"]}, {"$set": {"points": pts}}
        )

    updated = await fixtures_col().find_one({"match_id": match_id}, {"_id": 0})
    return updated


@router.delete("/{match_id}/result", response_model=FixtureResponse, dependencies=[Depends(require_admin)])
async def reset_result(match_id: int):
    """Clear a match's score and un-score every prediction for it.

    The leaderboard is computed live from prediction points, so resetting
    those points to None recalculates the standings automatically.
    """
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    await fixtures_col().update_one(
        {"match_id": match_id},
        {"$set": {
            "home_score": None,
            "away_score": None,
            "penalty_winner": None,
            "status": "scheduled",
        }},
    )

    result = await predictions_col().update_many(
        {"match_id": match_id}, {"$set": {"points": None}}
    )
    logger.warning(
        "RESULT RESET match=%s — cleared score, reset %s prediction(s)",
        match_id,
        result.modified_count,
    )

    updated = await fixtures_col().find_one({"match_id": match_id}, {"_id": 0})
    return updated
