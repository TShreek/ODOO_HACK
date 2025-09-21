# JWT Authentication Dependencies
import uuid
import jwt
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db_session
from models.auth import User
from crud.users import get_user_by_login_id
from config import settings

# Security scheme
security = HTTPBearer()


class CurrentUser:
    """Current authenticated user with tenant information."""
    def __init__(self, user_id: uuid.UUID, tenant_id: uuid.UUID, login_id: str, role: str):
        self.id = user_id
        self.tenant_id = tenant_id
        self.login_id = login_id
        self.role = role


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> CurrentUser:
    """
    JWT authentication dependency that returns current user with tenant_id.
    This replaces the dummy implementation in api/masters.py.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT token
        payload = jwt.decode(
            credentials.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        login_id: str = payload.get("sub")
        role: str = payload.get("role")
        tenant_id_str: str = payload.get("tenant_id")
        
        if login_id is None or tenant_id_str is None:
            raise credentials_exception
            
        tenant_id = uuid.UUID(tenant_id_str)
        
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception

    # Get user from database
    user = await get_user_by_login_id(db, login_id)
    if user is None:
        raise credentials_exception
    
    return CurrentUser(
        user_id=user.id,
        tenant_id=tenant_id,
        login_id=login_id,
        role=role
    )


# Optional: Role-based access control
def require_role(required_role: str):
    """
    Dependency factory for role-based access control.
    Usage: @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
    """
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return current_user
    return role_checker