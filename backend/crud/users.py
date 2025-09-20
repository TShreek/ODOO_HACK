# This file handles the database interactions for user-related data.
from sqlmodel import Session, select
from models.auth import User, Role
from schemas.auth import UserCreate
from services.auth_service import get_hashed_password
from sqlalchemy.orm import selectinload


async def get_user_by_login_id(db: Session, login_id: str) -> User | None:
    """
    Fetches a user from the database by their login_id, eagerly loading the role relationship.
    """
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.login_id == login_id)
    )
    return result.scalar_one_or_none()


async def create_user(db: Session, user_data: UserCreate, role_name: str) -> User:
    """
    Asynchronously creates a new user with a hashed password and a specific role.
    """
    # Use await with db.exec()
    role = (await db.exec(select(Role).where(Role.name == role_name))).first()
    if not role:
        role = Role(name=role_name)
        db.add(role)
        await db.commit()
        await db.refresh(role)

    hashed_password = get_hashed_password(user_data.password)
    db_user = User(
        name=user_data.name,
        login_id=user_data.login_id,
        email_id=user_data.email_id,
        hashed_password=hashed_password,
        role_id=role.id
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user
