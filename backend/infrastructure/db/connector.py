"""Unified DB connector with fallback to SQLite.

Primary: DATABASE_URL env (async SQLAlchemy URL)
Fallback: sqlite+aiosqlite:///./dev.db (created automatically)
Non-invasive: Does not alter existing database.py usage; optional import for explicit ping.
"""
import os
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

PRIMARY_URL = os.getenv("DATABASE_URL")
FALLBACK_SQLITE_URL = "sqlite+aiosqlite:///./dev.db"

_engine = None  # lazy
_session_factory: Optional[async_sessionmaker] = None
_using_fallback = False
_primary_error: Optional[str] = None

logger = logging.getLogger("infrastructure.db.connector")


def _build_engine(url: str):
    return create_async_engine(url, echo=False, future=True)


async def init_engine():
    global _engine, _session_factory, _using_fallback, _primary_error
    if _engine is not None:
        return
    try:
        if not PRIMARY_URL:
            raise ValueError("No DATABASE_URL provided")
        _engine = _build_engine(PRIMARY_URL)
        # quick connectivity test
        async with _engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as exc:
        _primary_error = str(exc)
        _engine = _build_engine(FALLBACK_SQLITE_URL)
        _using_fallback = True
        logger.warning(
            "Primary database unavailable, switching to SQLite fallback: %s",
            _primary_error,
        )
    _session_factory = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


async def ping() -> dict:
    await init_engine()
    try:
        async with _engine.begin() as conn:  # type: ignore
            await conn.execute(text("SELECT 1"))
        return {"ok": True, "fallback": _using_fallback, "primary_error": _primary_error if _using_fallback else None}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "fallback": _using_fallback}


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    await init_engine()
    assert _session_factory is not None
    async with _session_factory() as session:  # type: ignore
        yield session


async def ensure_schema(create_fn):
    """Optionally create tables when using fallback SQLite (non-invasive for Postgres)."""
    await init_engine()
    if _using_fallback:
        await create_fn()


if __name__ == "__main__":  # manual quick test
    async def _t():
        print(await ping())
    asyncio.run(_t())
