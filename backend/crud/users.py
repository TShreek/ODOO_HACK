# This file handles the database interactions for user-related data.

import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from models.auth import User, Role
from schemas.auth import UserCreate
from services.auth_service import get_hashed_password


async def get_user_by_login_id(db: AsyncSession, login_id: str) -> Optional[User]:
    """
    Fetches a user from the database by their login_id (async).
    """
    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.login_id == login_id)
    )
    return result.scalar_one_or_none()


async def create_user(db: AsyncSession, user_data: UserCreate, role_name: str) -> User:
    """
    Creates a new user with a hashed password and a specific role (async).
    Each user gets their own tenant_id by default.
    """
    # Find the role first, or create a default one if needed
    result = await db.execute(select(Role).where(Role.name == role_name))
    role = result.scalar_one_or_none()
    
    if not role:
        role = Role(name=role_name)
        db.add(role)
        await db.commit()
        await db.refresh(role)

    hashed_password = get_hashed_password(user_data.password)
    
    # Create user with their own tenant_id
    db_user = User(
        name=user_data.name,
        login_id=user_data.login_id,
        email_id=user_data.email_id,
        hashed_password=hashed_password,
        role_id=role.id,
        tenant_id=uuid.uuid4()  # Each user gets their own tenant
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user, ["role"])
    return db_user