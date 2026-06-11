import logging
import secrets

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import connect_db, close_db, get_db
from pymongo.errors import DuplicateKeyError
from app.db import users_col, fixtures_col
from app.security import get_current_account, create_token
from app.models import MeResponse, ThemeRequest, ProfileUpdateRequest, ProfileResponse
from app.seed import seed_if_empty
from app.routers import auth, fixtures, predictions, leaderboard, results, leagues

logger = logging.getLogger("uvicorn.error")

app = FastAPI(title="WC2026 Prediction API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await connect_db()
    await seed_if_empty(get_db())
    if not settings.admin_key.strip():
        settings.admin_key = secrets.token_urlsafe(24)
        logger.warning(
            "\n%s\n  ADMIN KEY (auto-generated this run): %s\n  Use it as the X-Admin-Key header to set match results.\n%s",
            "=" * 70,
            settings.admin_key,
            "=" * 70,
        )


@app.on_event("shutdown")
async def shutdown():
    await close_db()


app.include_router(auth.router)
app.include_router(fixtures.router)
app.include_router(predictions.router)
app.include_router(leaderboard.router)
app.include_router(results.router)
app.include_router(leagues.router)


@app.api_route("/health", methods=["GET", "HEAD"], tags=["health"])
async def health():
    return {"status": "ok"}


@app.get("/me", response_model=MeResponse, tags=["auth"])
async def me(account_id: str = Depends(get_current_account)):
    user = await users_col().find_one({"account_id": account_id})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return MeResponse(
        username=user["username"],
        theme=user.get("theme", "dark"),
        favorite_team=user.get("favorite_team", ""),
    )


@app.put("/me/theme", response_model=MeResponse, tags=["auth"])
async def set_theme(body: ThemeRequest, account_id: str = Depends(get_current_account)):
    user = await users_col().find_one_and_update(
        {"account_id": account_id}, {"$set": {"theme": body.theme}}
    )
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")
    return MeResponse(
        username=user["username"],
        theme=body.theme,
        favorite_team=user.get("favorite_team", ""),
    )


@app.patch("/me", response_model=ProfileResponse, tags=["auth"])
async def update_profile(body: ProfileUpdateRequest, account_id: str = Depends(get_current_account)):
    user = await users_col().find_one({"account_id": account_id})
    if not user:
        raise HTTPException(status_code=401, detail="Account not found")

    updates = {}

    if body.favorite_team is not None:
        favorite_team = body.favorite_team.strip()
        if not favorite_team:
            raise HTTPException(status_code=400, detail="Please select your team")
        is_real_team = await fixtures_col().find_one(
            {"$or": [{"home_team": favorite_team}, {"away_team": favorite_team}]}
        )
        if not is_real_team:
            raise HTTPException(status_code=400, detail="Unknown team")
        updates["favorite_team"] = favorite_team

    if body.username is not None:
        candidate = body.username.lower().strip()
        if candidate != user["username"]:
            if len(candidate) < 3 or len(candidate) > 20:
                raise HTTPException(status_code=400, detail="Username must be 3–20 characters")
            if await users_col().find_one({"username": candidate}):
                raise HTTPException(status_code=400, detail="Username already taken")
            updates["username"] = candidate

    if updates:
        try:
            # Predictions key off the stable account_id, so a username change
            # needs no cascade — just update the user document.
            await users_col().update_one({"account_id": account_id}, {"$set": updates})
        except DuplicateKeyError:
            raise HTTPException(status_code=400, detail="Username already taken")

    user = await users_col().find_one({"account_id": account_id})
    return ProfileResponse(
        username=user["username"],
        theme=user.get("theme", "dark"),
        favorite_team=user.get("favorite_team", ""),
        access_token=create_token(account_id),
    )
