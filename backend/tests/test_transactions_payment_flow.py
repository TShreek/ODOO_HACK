import os
import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient
from main import app
from database import get_db_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Assumes a test dependency override exists for get_current_user & DB session if used elsewhere.

@pytest.mark.asyncio
async def test_payment_endpoint_flow(async_test_client: AsyncClient, seeded_db_session: AsyncSession, auth_headers):
    # Create a payment (cash receipt)
    payload = {
        "direction": "in",
        "amount": "150.00",
        "payment_date": "2024-01-01T00:00:00Z",
        "party_type": "customer",
        "party_id": str(uuid.uuid4()),
        "meta": {"note": "Test receipt"}
    }
    resp = await async_test_client.post("/transactions/payment", json=payload, headers=auth_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["transaction"]["type"] == "PAYMENT"
    assert data["transaction"]["status"] == "POSTED"
    assert data["dispatch_status"] in ("success", "idempotent")

    # Idempotency check with explicit txn_id
    txn_id = data["transaction"]["txn_id"]
    resp2 = await async_test_client.post("/transactions/payment", json={**payload, "txn_id": txn_id}, headers=auth_headers)
    assert resp2.status_code == 201
    data2 = resp2.json()
    assert data2["dispatch_status"] == "idempotent"
