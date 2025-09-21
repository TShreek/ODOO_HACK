# Define blueprint for the input from Front-end
from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional


class RoleEnum(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"


class UserBase(BaseModel):
    """
    Base schema for user data.
    """
    name: str
    login_id: str
    email_id: EmailStr
    role: RoleEnum
    validation_level: Optional[int] = 1  # Default validation level


class UserCreate(UserBase):
    """
    Schema for user creation requests.
    Includes the password for hashing.
    """
    password: str


class UserLogin(BaseModel):
    """
    Schema for user login requests.
    """
    login_id: str
    password: str


class Token(BaseModel):
    """
    Schema for the JWT token response.
    """
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """
    Schema for token data extracted from JWT.
    """
    login_id: Optional[str] = None
    role: Optional[RoleEnum] = None
