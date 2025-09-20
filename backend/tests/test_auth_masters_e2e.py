import uuid
import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_register_login_list_accounts():
    login_id = f"user_{uuid.uuid4().hex[:8]}"
    email = f"{login_id}@example.com"
    password = "Secret123"

    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register
        r = await client.post("/api/v1/register", json={
            "login_id": login_id,
            "email": email,
            "password": password,
            "full_name": "Test User"
        })
        assert r.status_code in (200, 201)
        token = r.json().get("access_token")
        # Some flows may only issue token on login; ensure login works
        if not token:
            r = await client.post("/api/v1/login", json={
                "login_id": login_id,
                "password": password
            })
            assert r.status_code == 200
            token = r.json()["access_token"]

        assert token
        # List accounts
        r = await client.get("/api/v1/masters/accounts", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        accounts = r.json()
        assert isinstance(accounts, list)
        # expect at least seeded accounts
        assert len(accounts) >= 5