import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import PredictionRequest, PredictionResponse
from app.db import fixtures_col, predictions_col, users_col
from app.security import get_current_account

router = APIRouter(prefix="/predictions", tags=["predictions"])
logger = logging.getLogger("uvicorn.error")


@router.get("/me", response_model=List[PredictionResponse])
async def my_predictions(account_id: str = Depends(get_current_account)):
    cursor = predictions_col().find({"account_id": account_id}, {"_id": 0})
    return await cursor.to_list(length=None)


@router.put("/{match_id}", response_model=PredictionResponse)
async def upsert_prediction(
    match_id: int,
    body: PredictionRequest,
    account_id: str = Depends(get_current_account),
):
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    kickoff = datetime.fromisoformat(fixture["kickoff_utc"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) >= kickoff:
        raise HTTPException(status_code=409, detail="Prediction locked — match has kicked off")

    now = datetime.now(timezone.utc)
    await predictions_col().update_one(
        {"account_id": account_id, "match_id": match_id},
        {
            "$set": {
                "account_id": account_id,
                "match_id": match_id,
                "pred_home": body.pred_home,
                "pred_away": body.pred_away,
                "points": None,
                "updated_at": now,
            },
            # Set only on first insert so it records when the pick was first made
            "$setOnInsert": {"predicted_at": now},
        },
        upsert=True,
    )

    user = await users_col().find_one({"account_id": account_id})
    username = (user or {}).get("username", account_id)
    logger.info(
        "PREDICTION user=%s match=%s (%s vs %s) pick=%s-%s",
        username,
        match_id,
        fixture["home_team"],
        fixture["away_team"],
        body.pred_home,
        body.pred_away,
    )

    return PredictionResponse(
        match_id=match_id, pred_home=body.pred_home, pred_away=body.pred_away
    )
