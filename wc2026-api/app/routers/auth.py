from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.models import RegisterRequest, LoginRequest, TokenResponse
from app.db import users_col, fixtures_col, leagues_col
from app.security import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    username = body.username.lower().strip()
    if len(username) < 3 or len(username) > 20:
        raise HTTPException(status_code=400, detail="Username must be 3–20 characters")

    favorite_team = body.favorite_team.strip()
    if not favorite_team:
        raise HTTPException(status_code=400, detail="Please select your team")
    is_real_team = await fixtures_col().find_one(
        {"$or": [{"home_team": favorite_team}, {"away_team": favorite_team}]}
    )
    if not is_real_team:
        raise HTTPException(status_code=400, detail="Unknown team")

    if await users_col().find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    account_id = uuid4().hex
    await users_col().insert_one(
        {
            "account_id": account_id,
            "username": username,
            "password_hash": hash_password(body.password),
            "theme": "dark",
            "favorite_team": favorite_team,
            "created_at": datetime.now(timezone.utc),
        }
    )
    await leagues_col().update_one(
        {"name": "Stockholm"},
        {"$addToSet": {"member_account_ids": account_id}},
    )
    return TokenResponse(access_token=create_token(account_id), favorite_team=favorite_team)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    username = body.username.lower().strip()
    user = await users_col().find_one({"username": username})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(
        access_token=create_token(user["account_id"]),
        favorite_team=user.get("favorite_team", ""),
    )
