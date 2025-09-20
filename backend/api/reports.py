import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db_session
from dependencies import get_current_user, CurrentUser
from models.ledger import JournalLine, StockMove
from models.masters import ChartOfAccounts
from models.reporting import AccountDailyBalance
from services.reporting_service import rebuild_daily_balances

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
async def reports_summary(
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    # Cash balance: sum(debit-credit) for cash/bank accounts
    cash_codes = ["1000", "1010"]
    cash_stmt = (
        select(func.sum(JournalLine.debit - JournalLine.credit))
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id, ChartOfAccounts.account_code.in_(cash_codes))
    )
    cash = (await db.execute(cash_stmt)).scalar() or 0
    # AR & AP
    ar_stmt = (
        select(func.sum(JournalLine.debit - JournalLine.credit))
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id, ChartOfAccounts.account_code == "1100")
    )
    ap_stmt = (
        select(func.sum(JournalLine.credit - JournalLine.debit))
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id, ChartOfAccounts.account_code == "2000")
    )
    ar = (await db.execute(ar_stmt)).scalar() or 0
    ap = (await db.execute(ap_stmt)).scalar() or 0
    # Income & Expense (YTD)
    income_stmt = (
        select(func.sum(JournalLine.credit - JournalLine.debit))
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id, ChartOfAccounts.account_type == "Income")
    )
    expense_stmt = (
        select(func.sum(JournalLine.debit - JournalLine.credit))
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id, ChartOfAccounts.account_type == "Expense")
    )
    income = (await db.execute(income_stmt)).scalar() or 0
    expense = (await db.execute(expense_stmt)).scalar() or 0
    return {
        "cash": cash,
        "accounts_receivable": ar,
        "accounts_payable": ap,
        "income_ytd": income,
        "expense_ytd": expense,
        "net_income_ytd": income - expense,
    }


@router.get("/balance-sheet")
async def balance_sheet(
    as_of: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    # Sum by account type
    stmt = (
        select(
            ChartOfAccounts.account_type,
            func.sum(JournalLine.debit - JournalLine.credit).label("balance")
        )
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id)
        .group_by(ChartOfAccounts.account_type)
    )
    rows = (await db.execute(stmt)).all()
    data: Dict[str, Decimal] = {r.account_type: r.balance for r in rows}
    assets = data.get("Asset", Decimal("0"))
    liabilities = data.get("Liability", Decimal("0"))
    equity = data.get("Equity", Decimal("0"))
    return {
        "as_of": as_of,
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "equation_ok": assets == liabilities + equity,
        "raw": data,
    }


@router.get("/pnl")
async def profit_and_loss(
    start: date = Query(...),
    end: date = Query(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    stmt = (
        select(
            ChartOfAccounts.account_type,
            func.sum(JournalLine.credit - JournalLine.debit).label("net")
        )
        .join(ChartOfAccounts, ChartOfAccounts.id == JournalLine.account_id)
        .where(JournalLine.tenant_id == tenant_id)
        .group_by(ChartOfAccounts.account_type)
    )
    rows = (await db.execute(stmt)).all()
    income = sum([r.net for r in rows if r.account_type == "Income"]) if rows else 0
    expense = sum([-r.net for r in rows if r.account_type == "Expense"]) if rows else 0
    return {"start": start, "end": end, "income": income, "expense": expense, "net_profit": income - expense}


@router.post("/cache/rebuild")
async def rebuild_cache(
    start: date | None = Query(None),
    end: date | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    await rebuild_daily_balances(db, current_user.tenant_id, start, end)
    return {"status": "rebuilt", "start": start, "end": end}


@router.get("/pnl/cached")
async def pnl_cached(
    start: date = Query(...),
    end: date = Query(...),
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    stmt = select(AccountDailyBalance).where(AccountDailyBalance.tenant_id == tenant_id)
    stmt = stmt.where(AccountDailyBalance.balance_date >= start, AccountDailyBalance.balance_date <= end)
    rows = (await db.execute(stmt)).scalars().all()
    # Need account types mapping
    acct_types = {a.id: a.account_type for a in (await db.execute(select(ChartOfAccounts).where(ChartOfAccounts.tenant_id == tenant_id))).scalars().all()}
    income = Decimal("0")
    expense = Decimal("0")
    for r in rows:
        at = acct_types.get(r.account_id)
        if at == "Income":
            income += -r.net  # credit nature
        elif at == "Expense":
            expense += r.net  # debit nature
    return {"start": start, "end": end, "income": income, "expense": expense, "net_profit": income - expense, "cached": True}


@router.get("/stock")
async def stock_report(
    product_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id
    qty_expr = func.sum(StockMove.qty_in - StockMove.qty_out)
    cost_expr = func.sum(StockMove.qty_in * StockMove.unit_cost - StockMove.qty_out * StockMove.unit_cost)
    stmt = select(StockMove.product_id, qty_expr.label("qty"), cost_expr.label("value")).where(StockMove.tenant_id == tenant_id)
    if product_id:
        stmt = stmt.where(StockMove.product_id == product_id)
    stmt = stmt.group_by(StockMove.product_id)
    rows = (await db.execute(stmt)).all()
    return [
        {
            "product_id": r.product_id,
            "quantity_on_hand": r.qty or 0,
            "inventory_value": r.value or 0,
            "avg_cost": (r.value / r.qty) if r.qty else 0,
        }
        for r in rows
    ]
