import logging
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, List, Optional
from app.models import PredictionRequest, PredictionResponse, MatchPredictionRow, AdminMatchPredictionRow, LeaguePicksGroup, UserPredictionDetail
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
            pred_penalty_winner=r.get("pred_penalty_winner"),
            points=r.get("points"),
        )
        for r in rows
    ]


@router.get("/user/{username}/distribution")
async def user_prediction_distribution(
    username: str,
    account_id: str = Depends(get_current_account),
):
    target = await users_col().find_one({"username": username.lower().strip()})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    requester_leagues = await leagues_col().find({"member_account_ids": account_id}).to_list(length=None)
    if requester_leagues:
        requester_ids = {aid for l in requester_leagues for aid in l["member_account_ids"]}
        if target["account_id"] not in requester_ids:
            raise HTTPException(status_code=403, detail="Not in the same league")

    cursor = predictions_col().find(
        {"account_id": target["account_id"], "points": {"$ne": None}},
        {"pred_home": 1, "pred_away": 1, "_id": 0},
    )
    preds = await cursor.to_list(length=None)
    counts: Dict[str, int] = {}
    for p in preds:
        hi, lo = max(p["pred_home"], p["pred_away"]), min(p["pred_home"], p["pred_away"])
        key = f"{hi}-{lo}"
        counts[key] = counts.get(key, 0) + 1
    total = sum(counts.values())
    return {
        score: {"count": count, "pct": round(count / total * 100, 1)}
        for score, count in counts.items()
    }


@router.get("/user/{username}", response_model=List[UserPredictionDetail])
async def user_predictions(
    username: str,
    league_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(5, ge=1, le=50),
    account_id: str = Depends(get_current_account),
):
    """All locked predictions for a given user.

    When a league_id is given, results are scoped to that league: both accounts
    must be members and only picks for fixtures kicking off on/after the
    league's start_date are returned. Otherwise falls back to a shared-league
    check with no date filter.
    """
    target = await users_col().find_one({"username": username.lower().strip()})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    start_date = None
    if league_id:
        try:
            oid = ObjectId(league_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid league id")
        league = await leagues_col().find_one({"_id": oid})
        if not league:
            raise HTTPException(status_code=404, detail="League not found")
        members = league["member_account_ids"]
        if account_id not in members:
            raise HTTPException(status_code=403, detail="You are not in this league")
        if target["account_id"] not in members:
            raise HTTPException(status_code=403, detail="Not in the same league")
        start_date = league.get("start_date")
    else:
        # Verify requester shares a league with the target (or neither is in any league)
        requester_leagues = await leagues_col().find({"member_account_ids": account_id}).to_list(length=None)
        if requester_leagues:
            requester_ids = {aid for l in requester_leagues for aid in l["member_account_ids"]}
            if target["account_id"] not in requester_ids:
                raise HTTPException(status_code=403, detail="Not in the same league")

    pipeline = [
        {"$match": {"account_id": target["account_id"]}},
        {"$lookup": {
            "from": "fixtures",
            "localField": "match_id",
            "foreignField": "match_id",
            "as": "fixture",
        }},
        {"$set": {"fixture": {"$first": "$fixture"}}},
        # Only show picks that have been scored
        {"$match": {"points": {"$ne": None}}},
    ]

    if start_date is not None:
        pipeline.append({"$match": {"$expr": {
            "$gte": [
                {"$dateFromString": {"dateString": "$fixture.kickoff_utc"}},
                start_date,
            ]
        }}})

    pipeline.append({"$sort": {"fixture.kickoff_utc": -1}})
    pipeline.append({"$skip": skip})
    pipeline.append({"$limit": limit})
    rows = await predictions_col().aggregate(pipeline).to_list(length=None)
    return [
        UserPredictionDetail(
            match_id=r["match_id"],
            home_team=r["fixture"]["home_team"],
            away_team=r["fixture"]["away_team"],
            home_score=r["fixture"].get("home_score"),
            away_score=r["fixture"].get("away_score"),
            penalty_winner=r["fixture"].get("penalty_winner"),
            kickoff_utc=r["fixture"]["kickoff_utc"],
            pred_home=r["pred_home"],
            pred_away=r["pred_away"],
            pred_penalty_winner=r.get("pred_penalty_winner"),
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
            pred_penalty_winner=r.get("pred_penalty_winner"),
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

    # Penalty pick is only meaningful when predicting a draw — drop it otherwise
    # rather than rejecting, since it's an optional bonus pick, not a hard rule.
    pred_penalty_winner = body.pred_penalty_winner if body.pred_home == body.pred_away else None

    now = datetime.now(timezone.utc)
    await predictions_col().update_one(
        {"account_id": account_id, "match_id": match_id},
        {
            "$set": {
                "account_id": account_id,
                "match_id": match_id,
                "pred_home": body.pred_home,
                "pred_away": body.pred_away,
                "pred_penalty_winner": pred_penalty_winner,
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
        match_id=match_id, pred_home=body.pred_home, pred_away=body.pred_away,
        pred_penalty_winner=pred_penalty_winner,
    )
