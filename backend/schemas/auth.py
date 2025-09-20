# Define blueprint for the input from Front-end
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """
    Base schema for user data.
    """
    name: str
    login_id: str
    email_id: EmailStr


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
