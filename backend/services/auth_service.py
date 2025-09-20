# This file is where we handle password hashing and JWT token creation. 
# Core logic that makes our authentication system secure.

import bcrypt
import jwt as pyjwt
import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from schemas.auth import UserLogin, Token
from config import settings
from crud.refresh_tokens import (
    create_refresh_token_record,
    get_token as get_refresh_token_record,
    rotate_token as rotate_refresh_token_record,
    revoke_token as revoke_refresh_token_record,
)


def get_hashed_password(password: str) -> str:
    """
    Hashes a password using bcrypt.
    """
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies a password against its hash.
    Correctly uses bcrypt.checkpw().
    """
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token with an optional expiration time.
    The payload includes the user's login_id, role, and tenant_id.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = pyjwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


async def issue_initial_refresh_token(db: AsyncSession, user_id) -> str:
    raw = generate_refresh_token()
    expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await create_refresh_token_record(db, user_id, raw, expires_at)
    return raw


async def rotate_refresh_token(db: AsyncSession, raw_refresh_token: str):
    record = await get_refresh_token_record(db, raw_refresh_token)
    if not record:
        return None, "invalid"
    if record.revoked_at is not None:
        return None, "revoked"
    if record.expires_at < datetime.utcnow():
        return None, "expired"
    new_raw = generate_refresh_token()
    new_expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    new_record = await rotate_refresh_token_record(db, record, new_raw, new_expires_at)
    return new_raw, None


async def revoke_refresh_token(db: AsyncSession, raw_refresh_token: str) -> bool:
    record = await get_refresh_token_record(db, raw_refresh_token)
    if not record or record.revoked_at is not None:
        return False
    await revoke_refresh_token_record(db, record)
    return True
