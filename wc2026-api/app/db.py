from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

_client: AsyncIOMotorClient = None


def get_db():
    return _client[settings.db_name]


def users_col():
    return get_db()["users"]


def fixtures_col():
    return get_db()["fixtures"]


def predictions_col():
    return get_db()["predictions"]


async def connect_db():
    global _client
    _client = AsyncIOMotorClient(settings.mongodb_uri)
    try:
        await users_col().create_index("username", unique=True)
        await fixtures_col().create_index("match_id", unique=True)
        await users_col().create_index("account_id", unique=True)
        await predictions_col().create_index(
            [("account_id", 1), ("match_id", 1)], unique=True
        )
        print("MongoDB connected and indexes ensured.")
    except Exception as exc:
        print(f"WARNING: MongoDB not reachable on startup — {exc}")
        print("Update MONGODB_URI in .env and restart.")


async def close_db():
    global _client
    if _client:
        _client.close()
