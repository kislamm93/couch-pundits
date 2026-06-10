from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import PredictionRequest, PredictionResponse
from app.db import fixtures_col, predictions_col
from app.security import get_current_user

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/me", response_model=List[PredictionResponse])
async def my_predictions(username: str = Depends(get_current_user)):
    cursor = predictions_col().find({"username": username}, {"_id": 0})
    return await cursor.to_list(length=None)


@router.put("/{match_id}", response_model=PredictionResponse)
async def upsert_prediction(
    match_id: int,
    body: PredictionRequest,
    username: str = Depends(get_current_user),
):
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    kickoff = datetime.fromisoformat(fixture["kickoff_utc"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) >= kickoff:
        raise HTTPException(status_code=409, detail="Prediction locked — match has kicked off")

    doc = {
        "username": username,
        "match_id": match_id,
        "pred_home": body.pred_home,
        "pred_away": body.pred_away,
        "points": None,
        "updated_at": datetime.now(timezone.utc),
    }
    await predictions_col().update_one(
        {"username": username, "match_id": match_id},
        {"$set": doc},
        upsert=True,
    )
    return PredictionResponse(
        match_id=match_id, pred_home=body.pred_home, pred_away=body.pred_away
    )
