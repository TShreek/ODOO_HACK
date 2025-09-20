from fastapi import APIRouter
from infrastructure.db.connector import ping

router = APIRouter(prefix="/api/v1", tags=["infra"])


@router.get("/healthz")
async def healthz():
    return await ping()
