"""
Integration tests for the authentication system.
Tests the complete flow: register → login → use JWT token.
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


class TestAuthSystem:
    """Test the complete authentication system."""

    def test_user_registration(self):
        """Test user registration endpoint."""
        user_data = {
            "name": "Test User",
            "login_id": "testuser",
            "email_id": "test@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0

    def test_duplicate_registration_fails(self):
        """Test that registering the same login_id twice fails."""
        user_data = {
            "name": "Test User 2",
            "login_id": "testuser",  # Same as previous test
            "email_id": "test2@example.com",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/register", json=user_data)
        
        assert response.status_code == 400
        assert "Login ID already registered" in response.json()["detail"]

    def test_user_login(self):
        """Test user login endpoint."""
        login_data = {
            "login_id": "testuser",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert isinstance(data["access_token"], str)

    def test_login_with_wrong_password_fails(self):
        """Test that login with wrong password fails."""
        login_data = {
            "login_id": "testuser",
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect login ID or password" in response.json()["detail"]

    def test_login_with_nonexistent_user_fails(self):
        """Test that login with nonexistent user fails."""
        login_data = {
            "login_id": "nonexistentuser",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/login", json=login_data)
        
        assert response.status_code == 401
        assert "Incorrect login ID or password" in response.json()["detail"]

    def test_jwt_token_contains_tenant_id(self):
        """Test that JWT token contains tenant_id for multi-tenancy."""
        import jwt
        
        # Login to get token
        login_data = {
            "login_id": "testuser",
            "password": "testpassword123"
        }
        
        response = client.post("/api/v1/login", json=login_data)
        token = response.json()["access_token"]
        
        # Decode token to check contents
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        assert "sub" in decoded  # login_id
        assert "role" in decoded
        assert "tenant_id" in decoded
        assert "exp" in decoded  # expiration
        
        # Verify tenant_id is a valid UUID string
        tenant_id = decoded["tenant_id"]
        uuid.UUID(tenant_id)  # This will raise ValueError if not valid UUID

    def test_protected_endpoint_requires_auth(self):
        """Test that protected endpoints require authentication."""
        # Try to access masters endpoint without token
        response = client.get("/api/v1/masters/contacts")
        
        assert response.status_code == 401

    def test_protected_endpoint_with_valid_token(self):
        """Test that protected endpoints work with valid JWT token."""
        # Login to get token
        login_data = {
            "login_id": "testuser",
            "password": "testpassword123"
        }
        
        login_response = client.post("/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Use token to access protected endpoint
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/v1/masters/contacts", headers=headers)
        
        # Should not be 401 anymore (might be 200 with empty list or other valid response)
        assert response.status_code != 401

    def test_protected_endpoint_with_invalid_token(self):
        """Test that protected endpoints reject invalid JWT tokens."""
        headers = {"Authorization": "Bearer invalid_token_here"}
        response = client.get("/api/v1/masters/contacts", headers=headers)
        
        assert response.status_code == 401

    def test_complete_user_journey(self):
        """Test complete user journey: register → login → use token."""
        # Step 1: Register a new user
        user_data = {
            "name": "Complete Journey User",
            "login_id": "journeyuser",
            "email_id": "journey@example.com",
            "password": "journeypassword123"
        }
        
        register_response = client.post("/api/v1/register", json=user_data)
        assert register_response.status_code == 201
        register_token = register_response.json()["access_token"]
        
        # Step 2: Login with same credentials
        login_data = {
            "login_id": "journeyuser",
            "password": "journeypassword123"
        }
        
        login_response = client.post("/api/v1/login", json=login_data)
        assert login_response.status_code == 200
        login_token = login_response.json()["access_token"]
        
        # Step 3: Use both tokens to access protected endpoint
        for token_name, token in [("register_token", register_token), ("login_token", login_token)]:
            headers = {"Authorization": f"Bearer {token}"}
            response = client.get("/api/v1/masters/contacts", headers=headers)
            assert response.status_code != 401, f"Token {token_name} should be valid"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])