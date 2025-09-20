import hashlib
from datetime import datetime, timedelta
from typing import Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from models.auth import RefreshToken
from config import settings


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode('utf-8')).hexdigest()


async def create_refresh_token_record(db: AsyncSession, user_id: uuid.UUID, raw_token: str, expires_at: datetime) -> RefreshToken:
    db_obj = RefreshToken(
        user_id=user_id,
        token_hash=_hash(raw_token),
        expires_at=expires_at,
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


async def get_token(db: AsyncSession, raw_token: str) -> Optional[RefreshToken]:
    stmt = select(RefreshToken).where(RefreshToken.token_hash == _hash(raw_token))
    res = await db.execute(stmt)
    return res.scalar_one_or_none()


async def revoke_token(db: AsyncSession, token: RefreshToken):
    token.revoked_at = datetime.utcnow()
    await db.commit()


async def revoke_all_user_tokens(db: AsyncSession, user_id: uuid.UUID):
    stmt = select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
    res = await db.execute(stmt)
    tokens = res.scalars().all()
    updated = False
    for t in tokens:
        t.revoked_at = datetime.utcnow()
        updated = True
    if updated:
        await db.commit()


async def rotate_token(db: AsyncSession, old_token: RefreshToken, new_raw_token: str, new_expires_at: datetime) -> RefreshToken:
    old_token.revoked_at = datetime.utcnow()
    new_token = RefreshToken(
        user_id=old_token.user_id,
        token_hash=_hash(new_raw_token),
        expires_at=new_expires_at,
    )
    db.add(new_token)
    await db.commit()
    await db.refresh(new_token)
    # set replacement pointer
    old_token.replaced_by = new_token.id
    await db.commit()
    return new_token
