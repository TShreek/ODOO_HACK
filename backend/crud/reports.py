from datetime import date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, List
import uuid

from models.ledger import JournalLine
from models.masters import ChartOfAccounts

# Sign convention:
# For balance sheet and P&L we treat account natural signs as:
#   Asset & Expense: positive when debits > credits => balance = debit - credit
#   Liability, Equity, Income: positive when credits > debits => balance = credit - debit
# P&L net profit = total_income - total_expense (both positive numbers in that convention)

async def get_profit_and_loss(db: AsyncSession, tenant_id: uuid.UUID, start_date: date, end_date: date) -> dict:
    jl = JournalLine
    coa = ChartOfAccounts
    stmt = (
        select(
            coa.account_type,
            coa.account_code,
            coa.account_name,
            func.sum(jl.debit).label("sum_debit"),
            func.sum(jl.credit).label("sum_credit")
        )
        .join(coa, coa.id == jl.account_id)
        .where(jl.tenant_id == tenant_id)
        .where(jl.created_at >= start_date, jl.created_at <= end_date)
        .group_by(coa.account_type, coa.account_code, coa.account_name)
    )
    rows = (await db.execute(stmt)).all()
    income_breakdown = []
    expense_breakdown = []
    total_income = Decimal("0")
    total_expense = Decimal("0")
    for r in rows:
        debit = r.sum_debit or 0
        credit = r.sum_credit or 0
        if r.account_type == "Income":
            amt = credit - debit
            total_income += amt
            income_breakdown.append({"account_code": r.account_code, "account_name": r.account_name, "amount": amt})
        elif r.account_type == "Expense":
            amt = debit - credit
            total_expense += amt
            expense_breakdown.append({"account_code": r.account_code, "account_name": r.account_name, "amount": amt})
    net_profit = total_income - total_expense
    return {
        "period": {"start": str(start_date), "end": str(end_date)},
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_profit": float(net_profit),
        "income_breakdown": income_breakdown,
        "expense_breakdown": expense_breakdown,
    }


async def get_balance_sheet(db: AsyncSession, tenant_id: uuid.UUID, as_of: date) -> dict:
    jl = JournalLine
    coa = ChartOfAccounts
    stmt = (
        select(
            coa.account_type,
            coa.account_code,
            coa.account_name,
            func.sum(jl.debit).label("sum_debit"),
            func.sum(jl.credit).label("sum_credit")
        )
        .join(coa, coa.id == jl.account_id)
        .where(jl.tenant_id == tenant_id)
        .where(jl.created_at <= as_of)
        .group_by(coa.account_type, coa.account_code, coa.account_name)
    )
    rows = (await db.execute(stmt)).all()
    assets = []
    liabilities = []
    equity = []
    total_assets = Decimal("0")
    total_liabilities = Decimal("0")
    total_equity = Decimal("0")
    for r in rows:
        debit = r.sum_debit or 0
        credit = r.sum_credit or 0
        if r.account_type == "Asset":
            bal = debit - credit
            total_assets += bal
            assets.append({"account_code": r.account_code, "account_name": r.account_name, "balance": float(bal)})
        elif r.account_type == "Liability":
            bal = credit - debit
            total_liabilities += bal
            liabilities.append({"account_code": r.account_code, "account_name": r.account_name, "balance": float(bal)})
        elif r.account_type == "Equity":
            bal = credit - debit
            total_equity += bal
            equity.append({"account_code": r.account_code, "account_name": r.account_name, "balance": float(bal)})
    return {
        "as_of": str(as_of),
        "assets": assets,
        "liabilities": liabilities,
        "equity": equity,
        "totals": {
            "assets": float(total_assets),
            "liabilities": float(total_liabilities),
            "equity": float(total_equity)
        }
    }
