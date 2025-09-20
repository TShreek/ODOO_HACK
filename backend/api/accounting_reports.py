from fastapi import APIRouter, Depends, Query, HTTPException
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from database import get_db_session
from dependencies import get_current_user, CurrentUser
from crud.reports import get_profit_and_loss, get_balance_sheet

router = APIRouter(prefix="/reports", tags=["Accounting Reports"])


@router.get("/pnl")
async def pnl(
    start: date = Query(...),
    end: date = Query(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    if end < start:
        raise HTTPException(status_code=400, detail="end must be >= start")
    return await get_profit_and_loss(db, current_user.tenant_id, start, end)


@router.get("/balance_sheet")
async def balance_sheet(
    as_of: date = Query(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    return await get_balance_sheet(db, current_user.tenant_id, as_of)
