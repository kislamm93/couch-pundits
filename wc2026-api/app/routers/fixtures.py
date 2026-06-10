from fastapi import APIRouter, HTTPException
from typing import List
from app.models import FixtureResponse
from app.db import fixtures_col

router = APIRouter(prefix="/fixtures", tags=["fixtures"])


@router.get("", response_model=List[FixtureResponse])
async def list_fixtures():
    cursor = fixtures_col().find({}, {"_id": 0}).sort("kickoff_utc", 1)
    return await cursor.to_list(length=None)


@router.get("/{match_id}", response_model=FixtureResponse)
async def get_fixture(match_id: int):
    fixture = await fixtures_col().find_one({"match_id": match_id}, {"_id": 0})
    if not fixture:
        raise HTTPException(status_code=404, detail="Match not found")
    return fixture
