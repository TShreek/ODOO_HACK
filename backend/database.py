# Database implementation

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel
from config import settings
from models import auth

# Use create_async_engine for async database operations
engine = create_async_engine(settings.DATABASE_URL, echo=True)


async def create_db_and_tables():
    """
    Asynchronously creates all tables in the database.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get an async database session.
    """
    async with AsyncSession(engine) as session:
        yield session
