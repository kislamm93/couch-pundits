"""Standalone CLI to seed fixtures into any MongoDB (e.g. a prod Atlas URI).

Usage:
    MONGODB_URI="<uri>" python scripts/seed_fixtures.py

The API also auto-seeds on startup when the collection is empty (see app/seed.py);
this script is for manual reseeds. It is idempotent ($setOnInsert on match_id)."""
import asyncio
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Make the `app` package importable when run as `python scripts/seed_fixtures.py`
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.seed import build_fixtures  # noqa: E402

load_dotenv(Path(__file__).parent.parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "wc2026")


async def seed():
    client = AsyncIOMotorClient(MONGODB_URI)
    col = client[DB_NAME]["fixtures"]

    fixtures = build_fixtures()
    print(f"Built {len(fixtures)} fixtures from 2026/worldcup.json")

    upserted = 0
    for fixture in fixtures:
        result = await col.update_one(
            {"match_id": fixture["match_id"]},
            {"$setOnInsert": fixture},
            upsert=True,
        )
        if result.upserted_id:
            upserted += 1

    print(f"Done. {upserted} inserted, {len(fixtures) - upserted} already existed.")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
