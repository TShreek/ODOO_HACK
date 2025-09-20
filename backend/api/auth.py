# This is the public-facing API for our authentication. We will use FastAPI's APIRouter to define our endpoints.

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from database import get_db_session
from schemas.auth import UserCreate, UserLogin, Token, RefreshRequest
from crud.users import create_user, get_user_by_login_id
from services.auth_service import (
    verify_password,
    create_access_token,
    issue_initial_refresh_token,
    rotate_refresh_token,
    revoke_refresh_token,
)
from config import settings

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: AsyncSession = Depends(get_db_session)):
    """
    Registers a new user and returns a JWT token.
    """
    existing_user = await get_user_by_login_id(db, user_data.login_id)
    if existing_user:
        raise HTTPException(status_code=400, detail="Login ID already registered")
    
    # We will register a new user with the 'invoicing_user' role by default.
    user = await create_user(db, user_data, role_name="invoicing_user")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login_id, "role": user.role.name, "tenant_id": str(user.tenant_id)},
        expires_delta=access_token_expires,
    )
    refresh_token = await issue_initial_refresh_token(db, user.id)
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}


@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: UserLogin, db: AsyncSession = Depends(get_db_session)):
    """
    Authenticates a user and returns a JWT token.
    """
    user = await get_user_by_login_id(db, form_data.login_id)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login_id, "role": user.role.name, "tenant_id": str(user.tenant_id)},
        expires_delta=access_token_expires,
    )
    refresh_token = await issue_initial_refresh_token(db, user.id)
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": refresh_token}


@router.post("/refresh", response_model=Token)
async def refresh_tokens(payload: RefreshRequest, db: AsyncSession = Depends(get_db_session)):
    new_refresh, error = await rotate_refresh_token(db, payload.refresh_token)
    if error is not None:
        raise HTTPException(status_code=401, detail=f"Refresh token {error}")
    # Need user info – find old token record again (after rotation old is revoked). For simplicity, fetch by new token hash impossible; we re-fetch old record first.
    # Since rotate returned new token string only, we derive user_id by reloading old token before rotation – adjust rotate to return user id via existing path.
    # Simpler approach: modify rotate_refresh_token to return (new_raw, user_id). For minimal intrusion we'll re-import get_token and fetch old then parse user.
    from crud.refresh_tokens import get_token as get_refresh_record
    # old token still accessible for user id since we looked it up inside rotate, but we didn't expose user id. We'll look it up again (still present, revoked now).
    old_record = await get_refresh_record(db, payload.refresh_token)
    if not old_record:
        raise HTTPException(status_code=401, detail="Invalid refresh token state")
    # user relationship lazy load via accessing attribute
    user = old_record.user
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login_id, "role": user.role.name, "tenant_id": str(user.tenant_id)},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer", "refresh_token": new_refresh}


@router.post("/logout")
async def logout(payload: RefreshRequest, db: AsyncSession = Depends(get_db_session)):
    success = await revoke_refresh_token(db, payload.refresh_token)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or already revoked refresh token")
    return {"revoked": True}
