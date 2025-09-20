import pytest, uuid
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from decimal import Decimal

from main import app
from database import Base, get_db_session

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DB_URL, poolclass=StaticPool, connect_args={"check_same_thread": False})
AsyncSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

@pytest.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with AsyncSessionLocal() as session:
        yield session
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def client(db_session: AsyncSession):
    def override():
        return db_session
    app.dependency_overrides[get_db_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture()
async def auth_headers(client: AsyncClient):
    unique = uuid.uuid4().hex[:6]
    payload = {"name": f"User {unique}", "login_id": f"user_{unique}", "email_id": f"u{unique}@ex.com", "password": "pass12345"}
    r = await client.post("/api/v1/register", json=payload)
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_purchase_order_flow(client: AsyncClient, auth_headers):
    po_payload = {
        "vendor_id": "V1",
        "items": [
            {"product_id": "p1", "qty": "2", "unit_price": "100.00", "tax_percent": "5"},
            {"product_id": "p2", "qty": "1", "unit_price": "50.00", "tax_percent": "5"}
        ],
        "order_date": "2025-09-20T00:00:00Z",
        "expected_receipt_date": "2025-09-25T00:00:00Z",
        "txn_id": "PO-TEST-1"
    }
    r = await client.post("/transactions/purchase_order", json=po_payload, headers=auth_headers)
    assert r.status_code in (200,201)
    data = r.json()
    assert data["transaction"]["txn_id"] == "PO-TEST-1"
    # re-post idempotent
    r2 = await client.post("/transactions/purchase_order", json=po_payload, headers=auth_headers)
    assert r2.status_code in (200,201)
    data2 = r2.json()
    assert data2["dispatch_status"] == "idempotent" or data2.get("dispatch_status", {}).get("status") == "idempotent"

@pytest.mark.asyncio
async def test_sales_order_flow(client: AsyncClient, auth_headers):
    so_payload = {
        "customer_id": "C1",
        "items": [
            {"product_id": "p1", "qty": "3", "unit_price": "19.99", "tax_percent": "10", "discount": "1.00"}
        ],
        "order_date": "2025-09-20T00:00:00Z",
        "txn_id": "SO-TEST-1"
    }
    r = await client.post("/transactions/sales_order", json=so_payload, headers=auth_headers)
    assert r.status_code in (200,201)
    data = r.json()
    assert data["transaction"]["txn_id"] == "SO-TEST-1"
    r2 = await client.post("/transactions/sales_order", json=so_payload, headers=auth_headers)
    assert r2.status_code in (200,201)
    data2 = r2.json()
    assert data2["dispatch_status"] == "idempotent" or data2.get("dispatch_status", {}).get("status") == "idempotent"
