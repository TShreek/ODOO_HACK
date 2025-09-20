# This file is where we handle password hashing and JWT token creation. 
# Core logic that makes our authentication system secure.

import bcrypt
import jwt as pyjwt
from datetime import datetime, timedelta
from typing import Optional

from schemas.auth import UserLogin, Token
from config import settings


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
