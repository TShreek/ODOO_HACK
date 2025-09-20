import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_readyz_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as client:
        r = await client.get("/api/v1/readyz")
        assert r.status_code == 200
        data = r.json()
        assert "status" in data
        assert "db" in data
        assert "seed" in data
        assert "fallback" in data