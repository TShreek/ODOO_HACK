from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class Role(SQLModel, table=True):
    """
    Database model for user roles.
    Each user has one role, which determines their permissions.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, nullable=False)

    users: List["User"] = Relationship(back_populates="role")


class User(SQLModel, table=True):
    """
    Database model for users.
    Stores user details and links to a specific role.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, nullable=False)
    login_id: str = Field(index=True, unique=True, nullable=False)
    email_id: str = Field(index=True, unique=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    
    role_id: int = Field(foreign_key="role.id")
    role: Role = Relationship(back_populates="users")
