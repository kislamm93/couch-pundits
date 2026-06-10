from pydantic import BaseModel, Field
from typing import Optional


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    username: str


class FixtureResponse(BaseModel):
    match_id: int
    group: str
    home_team: str
    away_team: str
    stadium: str
    city: str
    kickoff_utc: str
    stage: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    status: str


class ResultRequest(BaseModel):
    home_score: int = Field(ge=0)
    away_score: int = Field(ge=0)


class PredictionRequest(BaseModel):
    pred_home: int = Field(ge=0)
    pred_away: int = Field(ge=0)


class PredictionResponse(BaseModel):
    match_id: int
    pred_home: int
    pred_away: int
    points: Optional[int] = None


class LeaderboardRow(BaseModel):
    username: str
    total_points: int
    exact_count: int
    correct_count: int
    played: int
