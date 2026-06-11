import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models import PredictionRequest, PredictionResponse, MatchPredictionRow, AdminMatchPredictionRow, LeaguePicksGroup
from app.db import fixtures_col, predictions_col, users_col, leagues_col
from app.security import get_current_account, require_admin

router = APIRouter(prefix="/predictions", tags=["predictions"])
logger = logging.getLogger("uvicorn.error")


@router.get("/me", response_model=List[PredictionResponse])
async def my_predictions(account_id: str = Depends(get_current_account)):
    cursor = predictions_col().find({"account_id": account_id}, {"_id": 0})
    return await cursor.to_list(length=None)


@router.get("/match/{match_id}", response_model=List[LeaguePicksGroup])
async def match_predictions(
    match_id: int, account_id: str = Depends(get_current_account)
):
    """Everyone's picks for a match — only revealed once it has kicked off."""
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")
    kickoff = datetime.fromisoformat(fixture["kickoff_utc"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) < kickoff:
        raise HTTPException(status_code=403, detail="Picks are revealed after kickoff")

    user_leagues = await leagues_col().find({"member_account_ids": account_id}).to_list(length=None)

    if not user_leagues:
        # Not in any league — show everyone in a single unlabelled group
        return [LeaguePicksGroup(league_name="", picks=await _fetch_picks(match_id, None))]

    return [
        LeaguePicksGroup(
            league_name=league["name"],
            picks=await _fetch_picks(match_id, league["member_account_ids"]),
        )
        for league in user_leagues
    ]


async def _fetch_picks(match_id: int, member_ids) -> List[MatchPredictionRow]:
    match_filter: dict = {"match_id": match_id}
    if member_ids is not None:
        match_filter["account_id"] = {"$in": member_ids}
    pipeline = [
        {"$match": match_filter},
        {"$lookup": {"from": "users", "localField": "account_id", "foreignField": "account_id", "as": "user"}},
        {"$set": {"username": {"$ifNull": [{"$first": "$user.username"}, "unknown"]}}},
        {"$sort": {"points": -1, "username": 1}},
    ]
    rows = await predictions_col().aggregate(pipeline).to_list(length=None)
    return [
        MatchPredictionRow(
            username=r["username"],
            pred_home=r["pred_home"],
            pred_away=r["pred_away"],
            points=r.get("points"),
        )
        for r in rows
    ]


@router.get("/admin/match/{match_id}", response_model=List[AdminMatchPredictionRow], dependencies=[Depends(require_admin)])
async def admin_match_predictions(match_id: int):
    """All predictions for a match with full detail — admin only."""
    fixture = await fixtures_col().find_one({"match_id": match_id})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")

    pipeline = [
        {"$match": {"match_id": match_id}},
        {
            "$lookup": {
                "from": "users",
                "localField": "account_id",
                "foreignField": "account_id",
                "as": "user",
            }
        },
        {"$set": {"username": {"$ifNull": [{"$first": "$user.username"}, "unknown"]}}},
        {"$sort": {"points": -1, "username": 1}},
    ]
    rows = await predictions_col().aggregate(pipeline).to_list(length=None)
    return [
        AdminMatchPredictionRow(
            username=r["username"],
            account_id=r["account_id"],
            pred_home=r["pred_home"],
            pred_away=r["pred_away"],
            points=r.get("points"),
            predicted_at=r.get("predicted_at"),
            updated_at=r.get("updated_at"),
        )
        for r in rows
    ]


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
