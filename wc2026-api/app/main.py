from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import connect_db, close_db, get_db
from app.security import get_current_user
from app.models import MeResponse
from app.seed import seed_if_empty
from app.routers import auth, fixtures, predictions, leaderboard, results

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


@app.on_event("shutdown")
async def shutdown():
    await close_db()


app.include_router(auth.router)
app.include_router(fixtures.router)
app.include_router(predictions.router)
app.include_router(leaderboard.router)
app.include_router(results.router)


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}


@app.get("/me", response_model=MeResponse, tags=["auth"])
async def me(username: str = Depends(get_current_user)):
    return MeResponse(username=username)
