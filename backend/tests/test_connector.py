import os
import importlib
import pytest
from infrastructure.db import connector


@pytest.mark.asyncio
async def test_ping_primary_or_fallback():
    result = await connector.ping()
    assert "ok" in result
    assert "fallback" in result


@pytest.mark.asyncio
async def test_forced_fallback(monkeypatch):
    # Force an invalid primary URL so init_engine chooses fallback
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://bad:bad@localhost:5432/doesnotexist")
    importlib.reload(connector)
    result = await connector.ping()
    assert result["ok"] is True  # fallback should still respond
    assert result["fallback"] is True