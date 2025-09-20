import os
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from database import get_db_session
from models.masters import ChartOfAccounts
from infrastructure.db.connector import ping as db_ping

router = APIRouter(prefix="/api/v1", tags=["infra"])

SEED_TENANT = uuid.UUID("00000000-0000-0000-0000-000000000001")


@router.get("/readyz")
async def readyz(db: AsyncSession = Depends(get_db_session)):
    db_status = await db_ping()
    db_ok = db_status.get("ok") is True

    # Seed check: at least one chart of account row for seed tenant
    seed_count = 0
    if db_ok:
        seed_count = await db.scalar(
            select(ChartOfAccounts).where(ChartOfAccounts.tenant_id == SEED_TENANT).limit(1)
        )
    seed_ready = bool(seed_count)

    overall_ready = db_ok and seed_ready

    return {
        "status": "ready" if overall_ready else "not-ready",
        "db": "ok" if db_ok else "fail",
        "seed": seed_ready,
        "fallback": db_status.get("fallback"),
        "version": os.getenv("GIT_SHA", "unknown"),
    }
