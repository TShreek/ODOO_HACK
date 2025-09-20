"""
Phase 1 Integration Tests: Complete Auth + Masters Data Flow
Tests the end-to-end workflow: register → login → create contact → list contacts → verify tenant isolation
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import asyncio
import uuid

from main import app
from database import Base, get_db_session
from config import settings

# Test database URL (use in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine and session
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


async def override_get_db_session():
    """Override database session for testing."""
    async with TestSessionLocal() as session:
        yield session


# Override the dependency
app.dependency_overrides[get_db_session] = override_get_db_session

client = TestClient(app)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create test database tables."""
    async def create_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    
    # Run the async function
    loop = asyncio.get_event_loop_policy().new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(create_tables())
    yield
    
    async def drop_tables():
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
    
    loop.run_until_complete(drop_tables())
    loop.close()


class TestPhase1Integration:
    """Test the complete Phase 1 integration: Auth + Masters Data."""

    def test_full_user_journey(self):
        """
        Complete integration test:
        1. Register user
        2. Login user  
        3. Create contact using JWT token
        4. List contacts and verify the created contact
        5. Verify tenant isolation
        """
        
        # Step 1: Register a new user
        print("🔄 Step 1: Registering user...")
        user_data = {
            "name": "Integration Test User",
            "login_id": "integrationuser",
            "email_id": "integration@example.com",
            "password": "integrationpassword123"
        }
        
        register_response = client.post("/api/v1/register", json=user_data)
        assert register_response.status_code == 201, f"Registration failed: {register_response.json()}"
        
        register_data = register_response.json()
        assert "access_token" in register_data
        token = register_data["access_token"]
        print("✅ Step 1: User registered successfully")
        
        # Step 2: Verify login works
        print("🔄 Step 2: Testing login...")
        login_data = {
            "login_id": "integrationuser",
            "password": "integrationpassword123"
        }
        
        login_response = client.post("/api/v1/login", json=login_data)
        assert login_response.status_code == 200, f"Login failed: {login_response.json()}"
        
        login_token = login_response.json()["access_token"]
        # Use the login token for subsequent requests (tokens may be identical if generated in same second)
        token = login_token
        print("✅ Step 2: Login successful")
        
        # Step 3: Create a contact using the JWT token
        print("🔄 Step 3: Creating contact with JWT token...")
        headers = {"Authorization": f"Bearer {token}"}
        contact_data = {
            "name": "Test Integration Contact",
            "email": "contact@integration.com",
            "phone": "+1234567890",
            "address": "123 Integration Street",
            "gstin": "22AAAAA0000A1Z5",
            "contact_type": "customer"
        }
        
        create_contact_response = client.post(
            "/api/v1/masters/contacts", 
            json=contact_data, 
            headers=headers
        )
        assert create_contact_response.status_code == 201, f"Contact creation failed: {create_contact_response.json()}"
        
        created_contact = create_contact_response.json()
        assert created_contact["name"] == contact_data["name"]
        assert created_contact["email"] == contact_data["email"]
        assert "id" in created_contact
        assert "tenant_id" in created_contact
        contact_id = created_contact["id"]
        print("✅ Step 3: Contact created successfully")
        
        # Step 4: List contacts and verify the created contact exists
        print("🔄 Step 4: Listing contacts to verify creation...")
        list_response = client.get("/api/v1/masters/contacts", headers=headers)
        assert list_response.status_code == 200, f"List contacts failed: {list_response.json()}"
        
        contacts_data = list_response.json()
        assert "items" in contacts_data
        assert "total" in contacts_data
        assert contacts_data["total"] == 1
        assert len(contacts_data["items"]) == 1
        
        listed_contact = contacts_data["items"][0]
        assert listed_contact["id"] == contact_id
        assert listed_contact["name"] == contact_data["name"]
        print("✅ Step 4: Contact listing successful")
        
        # Step 5: Get specific contact by ID
        print("🔄 Step 5: Getting contact by ID...")
        get_response = client.get(f"/api/v1/masters/contacts/{contact_id}", headers=headers)
        assert get_response.status_code == 200, f"Get contact failed: {get_response.json()}"
        
        retrieved_contact = get_response.json()
        assert retrieved_contact["id"] == contact_id
        assert retrieved_contact["name"] == contact_data["name"]
        print("✅ Step 5: Contact retrieval successful")
        
        print("🎉 INTEGRATION TEST PASSED: Full auth→masters workflow working!")

    def test_tenant_isolation(self):
        """
        Test that tenant isolation works properly:
        1. Create two different users
        2. Each creates a contact
        3. Verify each user can only see their own contacts
        """
        
        print("🔄 Testing tenant isolation...")
        
        # Create first user
        user1_data = {
            "name": "Tenant 1 User",
            "login_id": "tenant1user",
            "email_id": "tenant1@example.com",
            "password": "tenant1password"
        }
        
        user1_response = client.post("/api/v1/register", json=user1_data)
        assert user1_response.status_code == 201
        user1_token = user1_response.json()["access_token"]
        user1_headers = {"Authorization": f"Bearer {user1_token}"}
        
        # Create second user
        user2_data = {
            "name": "Tenant 2 User", 
            "login_id": "tenant2user",
            "email_id": "tenant2@example.com",
            "password": "tenant2password"
        }
        
        user2_response = client.post("/api/v1/register", json=user2_data)
        assert user2_response.status_code == 201
        user2_token = user2_response.json()["access_token"]
        user2_headers = {"Authorization": f"Bearer {user2_token}"}
        
        # User 1 creates a contact
        contact1_data = {
            "name": "Tenant 1 Contact",
            "email": "contact1@tenant1.com",
            "contact_type": "customer"
        }
        
        contact1_response = client.post(
            "/api/v1/masters/contacts",
            json=contact1_data,
            headers=user1_headers
        )
        assert contact1_response.status_code == 201
        
        # User 2 creates a contact  
        contact2_data = {
            "name": "Tenant 2 Contact",
            "email": "contact2@tenant2.com", 
            "contact_type": "supplier"
        }
        
        contact2_response = client.post(
            "/api/v1/masters/contacts",
            json=contact2_data,
            headers=user2_headers
        )
        assert contact2_response.status_code == 201
        
        # Verify User 1 can only see their contact
        user1_contacts = client.get("/api/v1/masters/contacts", headers=user1_headers)
        assert user1_contacts.status_code == 200
        user1_data = user1_contacts.json()
        assert user1_data["total"] == 1
        assert user1_data["items"][0]["name"] == "Tenant 1 Contact"
        
        # Verify User 2 can only see their contact
        user2_contacts = client.get("/api/v1/masters/contacts", headers=user2_headers)
        assert user2_contacts.status_code == 200
        user2_data = user2_contacts.json()
        assert user2_data["total"] == 1
        assert user2_data["items"][0]["name"] == "Tenant 2 Contact"
        
        print("✅ Tenant isolation working correctly!")

    def test_auth_required_for_masters(self):
        """Test that all masters endpoints require authentication."""
        
        print("🔄 Testing auth requirements...")
        
        # Test endpoints without token
        endpoints_to_test = [
            ("GET", "/api/v1/masters/contacts"),
            ("POST", "/api/v1/masters/contacts"),
            ("GET", "/api/v1/masters/products"),
            ("POST", "/api/v1/masters/products"),
            ("GET", "/api/v1/masters/taxes"),
            ("POST", "/api/v1/masters/taxes"),
            ("GET", "/api/v1/masters/hsn?q=test")
        ]
        
        for method, endpoint in endpoints_to_test:
            if method == "GET":
                response = client.get(endpoint)
            elif method == "POST":
                response = client.post(endpoint, json={"test": "data"})
            
            assert response.status_code in [401, 403], f"Endpoint {method} {endpoint} should require auth (got {response.status_code})"
        
        print("✅ All masters endpoints properly require authentication!")

    def test_product_and_tax_integration(self):
        """Test product and tax creation with auth."""
        
        print("🔄 Testing product and tax integration...")
        
        # Register user
        user_data = {
            "name": "Product Test User",
            "login_id": "productuser",
            "email_id": "product@example.com", 
            "password": "productpassword"
        }
        
        user_response = client.post("/api/v1/register", json=user_data)
        assert user_response.status_code == 201
        token = user_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a tax
        tax_data = {
            "name": "GST 18%",
            "tax_type": "GST",
            "rate": "18.0000",
            "description": "Standard GST rate"
        }
        
        tax_response = client.post("/api/v1/masters/taxes", json=tax_data, headers=headers)
        assert tax_response.status_code == 201
        created_tax = tax_response.json()
        assert created_tax["name"] == tax_data["name"]
        
        # Create a product
        product_data = {
            "name": "Test Product",
            "sku": "TEST001",
            "description": "A test product",
            "unit_price": "199.99",
            "hsn_code": "94036000",
            "unit_of_measurement": "pcs"
        }
        
        product_response = client.post("/api/v1/masters/products", json=product_data, headers=headers)
        assert product_response.status_code == 201
        created_product = product_response.json()
        assert created_product["name"] == product_data["name"]
        assert float(created_product["unit_price"]) == float(product_data["unit_price"])
        
        # List products and taxes
        products_list = client.get("/api/v1/masters/products", headers=headers)
        assert products_list.status_code == 200
        assert products_list.json()["total"] == 1
        
        taxes_list = client.get("/api/v1/masters/taxes", headers=headers)
        assert taxes_list.status_code == 200
        assert taxes_list.json()["total"] == 1
        
        print("✅ Product and tax integration working!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])