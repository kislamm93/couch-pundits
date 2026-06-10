from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.models import RegisterRequest, LoginRequest, TokenResponse
from app.db import users_col
from app.security import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(body: RegisterRequest):
    username = body.username.lower().strip()
    if len(username) < 3 or len(username) > 20:
        raise HTTPException(status_code=400, detail="Username must be 3–20 characters")
    if await users_col().find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    await users_col().insert_one(
        {
            "username": username,
            "password_hash": hash_password(body.password),
            "created_at": datetime.now(timezone.utc),
        }
    )
    return TokenResponse(access_token=create_token(username))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    username = body.username.lower().strip()
    user = await users_col().find_one({"username": username})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_token(username))
