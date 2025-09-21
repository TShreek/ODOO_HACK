# This file is where we handle password hashing and JWT token creation. 
# Core logic that makes our authentication system secure.

import sys
import os

import bcrypt
import jwt as pyjwt
from datetime import datetime, timedelta
from typing import Optional

from schemas.auth import UserLogin, Token, TokenData
from config import settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Ensure the models directory is in the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.tokens import RefreshToken


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


def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> RefreshToken:
    """
    Creates a refresh token for the user with an optional expiration time.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    token = bcrypt.gensalt().decode('utf-8')  # Generate a unique token
    return RefreshToken(
        token=token,
        user_id=user_id,
        expires_at=expire
    )


async def revoke_refresh_token(session: AsyncSession, token: str) -> bool:
    """
    Revokes a refresh token by marking it as revoked in the database.
    """
    stmt = select(RefreshToken).where(RefreshToken.token == token)
    result = await session.execute(stmt)
    refresh_token = result.scalar_one_or_none()

    if refresh_token:
        refresh_token.is_revoked = True
        await session.commit()
        return True
    return False


async def rotate_refresh_token(session: AsyncSession, old_token: str) -> Optional[RefreshToken]:
    """
    Rotates a refresh token by revoking the old one and creating a new one.
    """
    stmt = select(RefreshToken).where(RefreshToken.token == old_token)
    result = await session.execute(stmt)
    refresh_token = result.scalar_one_or_none()

    if refresh_token and not refresh_token.is_revoked:
        refresh_token.is_revoked = True
        new_token = create_refresh_token(user_id=refresh_token.user_id)
        session.add(new_token)
        await session.commit()
        return new_token
    return None
