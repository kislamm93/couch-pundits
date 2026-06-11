from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.db import leagues_col, users_col
from app.models import LeagueInfo, CreateLeagueRequest, UpdateLeagueMembersRequest
from app.security import get_current_account, require_admin

router = APIRouter(prefix="/leagues", tags=["leagues"])


@router.get("/me", response_model=List[LeagueInfo])
async def my_leagues(account_id: str = Depends(get_current_account)):
    cursor = leagues_col().find({"member_account_ids": account_id})
    leagues = await cursor.to_list(length=None)
    return [LeagueInfo(id=str(l["_id"]), name=l["name"]) for l in leagues]


@router.post("", response_model=LeagueInfo, dependencies=[Depends(require_admin)])
async def create_league(body: CreateLeagueRequest):
    account_ids = await _resolve_usernames(body.usernames)
    result = await leagues_col().insert_one({
        "name": body.name,
        "member_account_ids": account_ids,
    })
    return LeagueInfo(id=str(result.inserted_id), name=body.name)


@router.patch("/{league_id}/members", response_model=LeagueInfo, dependencies=[Depends(require_admin)])
async def update_members(league_id: str, body: UpdateLeagueMembersRequest):
    try:
        oid = ObjectId(league_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid league id")

    league = await leagues_col().find_one({"_id": oid})
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    add_ids = await _resolve_usernames(body.add)
    remove_ids = await _resolve_usernames(body.remove)

    update: dict = {}
    if add_ids:
        update["$addToSet"] = {"member_account_ids": {"$each": add_ids}}
    if remove_ids:
        update["$pull"] = {"member_account_ids": {"$in": remove_ids}}

    if update:
        await leagues_col().update_one({"_id": oid}, update)

    updated = await leagues_col().find_one({"_id": oid})
    return LeagueInfo(id=str(updated["_id"]), name=updated["name"])


async def _resolve_usernames(usernames: list[str]) -> list[str]:
    account_ids = []
    for username in usernames:
        user = await users_col().find_one({"username": username.lower().strip()})
        if not user:
            raise HTTPException(status_code=404, detail=f"User '{username}' not found")
        account_ids.append(user["account_id"])
    return account_ids
