import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_healthz_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        resp = await client.get("/api/v1/healthz")
        assert resp.status_code == 200
        data = resp.json()
        assert "ok" in data
        # either primary or fallback path acceptable
        assert "fallback" in data