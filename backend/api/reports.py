from datetime import date
from fastapi import APIRouter, Query
from database import AsyncSessionLocal
from crud.reports import get_profit_and_loss, get_balance_sheet
from config import settings

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/pl")
async def profit_and_loss(
    from_date: date = Query(...),
    to_date: date = Query(...),
    tenant_id: str = Query(settings.TEST_TENANT_ID),
):
    async with AsyncSessionLocal() as s:
        return await get_profit_and_loss(s, tenant_id, from_date, to_date)

@router.get("/bs")
async def balance_sheet(
    as_of: date = Query(...),
    tenant_id: str = Query(settings.TEST_TENANT_ID),
):
    async with AsyncSessionLocal() as s:
        return await get_balance_sheet(s, tenant_id, as_of)
