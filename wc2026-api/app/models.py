from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class RegisterRequest(BaseModel):
    username: str
    password: str
    favorite_team: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    favorite_team: str = ""


class MeResponse(BaseModel):
    username: str
    theme: Literal["light", "dark"] = "dark"
    favorite_team: str = ""


class ThemeRequest(BaseModel):
    theme: Literal["light", "dark"]


class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None
    favorite_team: Optional[str] = None


class ProfileResponse(BaseModel):
    username: str
    theme: Literal["light", "dark"] = "dark"
    favorite_team: str = ""
    # Reissued because the JWT subject (username) may have changed
    access_token: str


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
    predicted_at: Optional[datetime] = None


class MatchPredictionRow(BaseModel):
    username: str
    pred_home: int
    pred_away: int
    points: Optional[int] = None


class LeaguePicksGroup(BaseModel):
    league_name: str
    picks: List[MatchPredictionRow]


class AdminMatchPredictionRow(BaseModel):
    username: str
    account_id: str
    pred_home: int
    pred_away: int
    points: Optional[int] = None
    predicted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class LeagueInfo(BaseModel):
    id: str
    name: str


class CreateLeagueRequest(BaseModel):
    name: str
    usernames: List[str] = []


class UpdateLeagueMembersRequest(BaseModel):
    add: List[str] = []
    remove: List[str] = []


class LeaderboardRow(BaseModel):
    username: str
    total_points: int
    exact_count: int
    diff_count: int
    correct_count: int
    played: int
