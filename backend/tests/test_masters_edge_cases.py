import asyncio
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from main import app
from database import Base, get_db_session
from config import settings


TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db_session():
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db_session] = override_get_db_session
client = TestClient(app)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    async def create_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    loop = asyncio.get_event_loop_policy().new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(create_tables())
    yield
    async def drop_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    loop.run_until_complete(drop_tables())
    loop.close()


def _register_and_get_token(login_id: str = "edgeuser") -> str:
    user_payload = {
        "name": "Edge User",
        "login_id": login_id,
        "email_id": f"{login_id}@example.com",
        "password": "StrongPass123"
    }
    r = client.post("/api/v1/register", json=user_payload)
    assert r.status_code in (201, 400)
    if r.status_code == 400:  # already exists, login
        lr = client.post("/api/v1/login", json={"login_id": login_id, "password": "StrongPass123"})
        assert lr.status_code == 200
        return lr.json()["access_token"]
    return r.json()["access_token"]


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_contacts_pagination_and_404():
    token = _register_and_get_token("contactedge")
    headers = _auth_headers(token)
    # create 3 contacts
    for i in range(3):
        payload = {"name": f"Contact {i}", "email": f"c{i}@ex.com"}
        r = client.post("/api/v1/masters/contacts", json=payload, headers=headers)
        assert r.status_code == 201
    # page 1 per_page 2
    r1 = client.get("/api/v1/masters/contacts?page=1&per_page=2", headers=headers)
    assert r1.status_code == 200
    body1 = r1.json()
    assert body1["page"] == 1 and body1["per_page"] == 2
    assert body1["total"] == 3 and body1["total_pages"] == 2
    assert len(body1["items"]) == 2
    # page 2
    r2 = client.get("/api/v1/masters/contacts?page=2&per_page=2", headers=headers)
    assert r2.status_code == 200
    body2 = r2.json()
    assert body2["page"] == 2
    assert len(body2["items"]) == 1
    # 404 for random UUID
    random_id = str(uuid.uuid4())
    r404 = client.get(f"/api/v1/masters/contacts/{random_id}", headers=headers)
    assert r404.status_code == 404


def test_products_search_and_404():
    token = _register_and_get_token("productedge")
    headers = _auth_headers(token)
    # create products with varied names and hsn
    products = [
        {"name": "Blue Widget", "unit_price": "10.00", "sku": "BW1", "hsn_code": "1001"},
        {"name": "Red Widget", "unit_price": "12.50", "sku": "RW1", "hsn_code": "1002"},
        {"name": "Gadget Pro", "unit_price": "20.00", "sku": "GP1", "hsn_code": "2001"},
    ]
    for p in products:
        r = client.post("/api/v1/masters/products", json=p, headers=headers)
        assert r.status_code == 201
    # search for 'Widget'
    sr = client.get("/api/v1/masters/products?search=Widget", headers=headers)
    assert sr.status_code == 200
    data = sr.json()
    assert data["total"] == 2
    # search for hsn_code fragment
    sr2 = client.get("/api/v1/masters/products?search=2001", headers=headers)
    assert sr2.status_code == 200
    assert sr2.json()["total"] == 1
    # 404
    r404 = client.get(f"/api/v1/masters/products/{uuid.uuid4()}", headers=headers)
    assert r404.status_code == 404


def test_taxes_pagination_and_update_404():
    token = _register_and_get_token("taxedge")
    headers = _auth_headers(token)
    # create 2 taxes
    taxes = [
        {"name": "GST", "tax_type": "GST", "rate": "18.0000"},
        {"name": "VAT", "tax_type": "VAT", "rate": "5.0000"},
    ]
    for t in taxes:
        r = client.post("/api/v1/masters/taxes", json=t, headers=headers)
        assert r.status_code == 201
    rlist = client.get("/api/v1/masters/taxes?page=1&per_page=1", headers=headers)
    assert rlist.status_code == 200
    body = rlist.json()
    assert body["total"] == 2 and body["total_pages"] == 2
    # update non-existent id
    rput = client.put(f"/api/v1/masters/taxes/{uuid.uuid4()}", json={"name": "Updated"}, headers=headers)
    assert rput.status_code == 404


def test_accounts_listing_and_404():
    token = _register_and_get_token("accountedge")
    headers = _auth_headers(token)
    # create accounts
    accounts = [
        {"account_code": "1000", "account_name": "Cash", "account_type": "Asset"},
        {"account_code": "2000", "account_name": "Accounts Payable", "account_type": "Liability"},
    ]
    ids = []
    for a in accounts:
        r = client.post("/api/v1/masters/accounts", json=a, headers=headers)
        assert r.status_code == 201
        ids.append(r.json()["id"])
    rlist = client.get("/api/v1/masters/accounts", headers=headers)
    assert rlist.status_code == 200
    assert rlist.json()["total"] == 2
    r404 = client.get(f"/api/v1/masters/accounts/{uuid.uuid4()}", headers=headers)
    assert r404.status_code == 404
