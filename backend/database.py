# Database implementation

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine, async_sessionmaker
from sqlmodel import SQLModel
from config import settings
from models import auth

# Create an asynchronous engine
async_engine: AsyncEngine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

# Create an async session maker
async_session = async_sessionmaker(
    bind=async_engine,
    expire_on_commit=False
)


async def create_db_and_tables():
    """
    Asynchronously creates all tables in the database.
    """
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get an async database session.
    """
    async with async_session() as session:
        yield session
