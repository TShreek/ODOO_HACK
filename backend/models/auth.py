# Define what a user and their role would look like - SQLAlchemy 2.0 with UUID support

import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Role(Base):
    """
    Database model for user roles.
    Each user has one role, which determines their permissions.
    """
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(50), index=True, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        nullable=False
    )

    users: Mapped[List["User"]] = relationship("User", back_populates="role")


class User(Base):
    """
    Database model for users.
    Stores user details and links to a specific role.
    IMPORTANT: Added tenant_id for multi-tenant support.
    """
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        nullable=False,
        default=uuid.uuid4,  # Each user gets their own tenant by default
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    login_id: Mapped[str] = mapped_column(String(100), index=True, unique=True, nullable=False)
    email_id: Mapped[str] = mapped_column(String(255), index=True, unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        nullable=False
    )
    
    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("roles.id"),
        nullable=False
    )
    role: Mapped["Role"] = relationship("Role", back_populates="users")
