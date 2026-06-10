import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from jwt import PyJWTError as JWTError
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings

bearer = HTTPBearer()

_ITERATIONS = 260000


def hash_password(password: str) -> str:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return (salt + key).hex()


def verify_password(password: str, stored: str) -> bool:
    try:
        data = bytes.fromhex(stored)
        salt, stored_key = data[:32], data[32:]
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
        return hmac.compare_digest(key, stored_key)
    except Exception:
        return False


def create_token(account_id: str) -> str:
    # Subject is the stable account id, so tokens survive username changes
    payload = {
        "sub": account_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


async def require_admin(x_admin_key: str = Header(...)) -> None:
    if not settings.admin_key:
        raise HTTPException(status_code=503, detail="Admin key not configured on server")
    if not hmac.compare_digest(x_admin_key, settings.admin_key):
        raise HTTPException(status_code=403, detail="Invalid admin key")


async def get_current_account(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    """Return the authenticated user's stable account id (the JWT subject)."""
    try:
        payload = jwt.decode(
            credentials.credentials, settings.jwt_secret, algorithms=["HS256"]
        )
        account_id: str = payload.get("sub")
        if not account_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return account_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
