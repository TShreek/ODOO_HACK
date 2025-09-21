# Test file for Master Data API
import pytest
import pytest_asyncio
import uuid
from decimal import Decimal
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from database import Base, get_db_session
from models.masters import Contact, Product, Tax, ChartOfAccounts


# Test database setup
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
    echo=True
)

TestAsyncSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest_asyncio.fixture(scope="function")
async def test_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test.
    """
    # Create tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Provide session
    async with TestAsyncSessionLocal() as session:
        yield session
    
    # Clean up
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(test_db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test HTTPX AsyncClient using ASGITransport (httpx>=0.28)."""
    def override_get_db_session():
        return test_db_session

    app.dependency_overrides[get_db_session] = override_get_db_session

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def sample_tenant_id() -> uuid.UUID:
    return uuid.UUID("123e4567-e89b-12d3-a456-426614174000")


@pytest_asyncio.fixture()
async def auth_headers(client: AsyncClient) -> dict:
    """Register a unique user and return Authorization headers."""
    unique = uuid.uuid4().hex[:8]
    user_payload = {
        "name": f"Test User {unique}",
        "login_id": f"user_{unique}",
        "email_id": f"user_{unique}@example.com",
        "password": "password123"
    }
    resp = await client.post("/api/v1/register", json=user_payload)
    assert resp.status_code == 201, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# Contact Tests
@pytest.mark.asyncio
async def test_create_contact(client: AsyncClient, auth_headers: dict):
    """Test creating a new contact."""
    contact_data = {
        "name": "Test Customer",
        "email": "test@example.com",
        "phone": "+1234567890",
        "address": "123 Test Street",
        "gstin": "22AAAAA0000A1Z5",
        "contact_type": "customer"
    }
    
    response = await client.post("/api/v1/masters/contacts", json=contact_data, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == contact_data["name"]
    assert data["email"] == contact_data["email"]
    assert data["phone"] == contact_data["phone"]
    assert "id" in data
    assert "tenant_id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_contact(client: AsyncClient, auth_headers: dict):
    """Test retrieving a contact by ID."""
    # First create a contact
    contact_data = {
        "name": "Test Customer",
        "email": "test@example.com",
        "contact_type": "customer"
    }
    
    create_response = await client.post("/api/v1/masters/contacts", json=contact_data, headers=auth_headers)
    assert create_response.status_code == 201
    contact_id = create_response.json()["id"]
    
    # Then retrieve it
    response = await client.get(f"/api/v1/masters/contacts/{contact_id}", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["id"] == contact_id
    assert data["name"] == contact_data["name"]


@pytest.mark.asyncio
async def test_list_contacts(client: AsyncClient, auth_headers: dict):
    """Test listing contacts with pagination."""
    # Create multiple contacts
    for i in range(3):
        contact_data = {
            "name": f"Test Customer {i}",
            "email": f"test{i}@example.com",
            "contact_type": "customer"
        }
        response = await client.post("/api/v1/masters/contacts", json=contact_data, headers=auth_headers)
        assert response.status_code == 201
    
    # List contacts
    response = await client.get("/api/v1/masters/contacts?page=1&per_page=2", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "per_page" in data
    assert data["total"] == 3
    assert len(data["items"]) == 2  # Due to pagination


@pytest.mark.asyncio
async def test_update_contact(client: AsyncClient, auth_headers: dict):
    """Test updating a contact."""
    # Create a contact
    contact_data = {
        "name": "Test Customer",
        "email": "test@example.com",
        "contact_type": "customer"
    }
    
    create_response = await client.post("/api/v1/masters/contacts", json=contact_data, headers=auth_headers)
    assert create_response.status_code == 201
    contact_id = create_response.json()["id"]
    
    # Update the contact
    update_data = {
        "name": "Updated Customer",
        "phone": "+1234567890"
    }
    
    response = await client.put(f"/api/v1/masters/contacts/{contact_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["phone"] == update_data["phone"]
    assert data["email"] == contact_data["email"]  # Should remain unchanged


# Product Tests
@pytest.mark.asyncio
async def test_create_product(client: AsyncClient, auth_headers: dict):
    """Test creating a new product."""
    product_data = {
        "name": "Test Product",
        "sku": "TEST001",
        "description": "A test product",
        "unit_price": "199.99",
        "hsn_code": "94036000",
        "unit_of_measurement": "pcs"
    }
    
    response = await client.post("/api/v1/masters/products", json=product_data, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == product_data["name"]
    assert data["sku"] == product_data["sku"]
    assert data["hsn_code"] == product_data["hsn_code"]
    assert float(data["unit_price"]) == float(product_data["unit_price"])
    assert "id" in data


@pytest.mark.asyncio
async def test_search_products(client: AsyncClient, auth_headers: dict):
    """Test searching products by name, SKU, or HSN code."""
    # Create test products
    products = [
        {
            "name": "Office Chair",
            "sku": "CHAIR001",
            "unit_price": "299.99",
            "hsn_code": "94036000"
        },
        {
            "name": "Office Table",
            "sku": "TABLE001", 
            "unit_price": "599.99",
            "hsn_code": "94036000"
        },
        {
            "name": "Computer Monitor",
            "sku": "MONITOR001",
            "unit_price": "899.99",
            "hsn_code": "8528"
        }
    ]
    
    for product in products:
        response = await client.post("/api/v1/masters/products", json=product, headers=auth_headers)
        assert response.status_code == 201
    
    # Search by name
    response = await client.get("/api/v1/masters/products?search=chair", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert "Chair" in data["items"][0]["name"]
    
    # Search by HSN code
    response = await client.get("/api/v1/masters/products?search=94036000", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2  # Both chair and table have this HSN
    
    # Search by SKU
    response = await client.get("/api/v1/masters/products?search=MONITOR001", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["sku"] == "MONITOR001"


@pytest.mark.asyncio
async def test_update_product(client: AsyncClient, auth_headers: dict):
    """Test updating a product."""
    # Create a product
    product_data = {
        "name": "Test Product",
        "unit_price": "199.99"
    }
    
    create_response = await client.post("/api/v1/masters/products", json=product_data, headers=auth_headers)
    assert create_response.status_code == 201
    product_id = create_response.json()["id"]
    
    # Update the product
    update_data = {
        "unit_price": "249.99",
        "sku": "UPDATED001"
    }
    
    response = await client.put(f"/api/v1/masters/products/{product_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert float(data["unit_price"]) == float(update_data["unit_price"])
    assert data["sku"] == update_data["sku"]
    assert data["name"] == product_data["name"]  # Should remain unchanged


# Tax Tests
@pytest.mark.asyncio
async def test_create_tax(client: AsyncClient, auth_headers: dict):
    """Test creating a new tax."""
    tax_data = {
        "name": "GST 18%",
        "tax_type": "GST",
        "rate": "18.0000",
        "description": "Standard GST rate"
    }
    
    response = await client.post("/api/v1/masters/taxes", json=tax_data, headers=auth_headers)
    assert response.status_code == 201
    
    data = response.json()
    assert data["name"] == tax_data["name"]
    assert data["tax_type"] == tax_data["tax_type"]
    assert float(data["rate"]) == float(tax_data["rate"])
    assert "id" in data


@pytest.mark.asyncio
async def test_list_taxes(client: AsyncClient, auth_headers: dict):
    """Test listing taxes."""
    # Create multiple taxes
    taxes = [
        {"name": "GST 5%", "tax_type": "GST", "rate": "5.0000"},
        {"name": "GST 12%", "tax_type": "GST", "rate": "12.0000"},
        {"name": "GST 18%", "tax_type": "GST", "rate": "18.0000"}
    ]
    
    for tax in taxes:
        response = await client.post("/api/v1/masters/taxes", json=tax, headers=auth_headers)
        assert response.status_code == 201
    
    # List taxes
    response = await client.get("/api/v1/masters/taxes", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3


# HSN Search Tests
@pytest.mark.asyncio
async def test_hsn_search_fallback(client: AsyncClient, auth_headers: dict):
    """Test HSN search using fallback data."""
    response = await client.get("/api/v1/masters/hsn?q=table", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "query" in data
    assert "items" in data
    assert "source" in data
    assert data["query"] == "table"
    assert data["source"] == "fallback"  # Should use fallback since no external API
    assert len(data["items"]) > 0
    
    # Check that results contain "table" in description
    found_table = False
    for item in data["items"]:
        if "table" in item["description"].lower():
            found_table = True
            break
    assert found_table


@pytest.mark.asyncio
async def test_hsn_search_furniture(client: AsyncClient, auth_headers: dict):
    """Test HSN search for furniture items."""
    response = await client.get("/api/v1/masters/hsn?q=furniture", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["source"] == "fallback"
    assert len(data["items"]) > 0
    
    # Check that all items have required fields
    for item in data["items"]:
        assert "hsn_code" in item
        assert "description" in item
        assert "gst_rate" in item


# Error Handling Tests
@pytest.mark.asyncio
async def test_get_nonexistent_contact(client: AsyncClient, auth_headers: dict):
    """Test getting a contact that doesn't exist."""
    fake_id = uuid.uuid4()
    response = await client.get(f"/api/v1/masters/contacts/{fake_id}", headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_nonexistent_product(client: AsyncClient, auth_headers: dict):
    """Test updating a product that doesn't exist."""
    fake_id = uuid.uuid4()
    update_data = {"name": "Updated Product"}
    
    response = await client.put(f"/api/v1/masters/products/{fake_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_invalid_hsn_query(client: AsyncClient, auth_headers: dict):
    """Test HSN search with very short query."""
    response = await client.get("/api/v1/masters/hsn?q=a", headers=auth_headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["source"] == "fallback"
    # Short queries should still return some fallback data