import uuid
from datetime import date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete

from models.reporting import AccountDailyBalance
from models.ledger import JournalLine


async def rebuild_daily_balances(session: AsyncSession, tenant_id: uuid.UUID, start: date | None = None, end: date | None = None):
    # For simplicity wipe & rebuild range
    q_del = delete(AccountDailyBalance).where(AccountDailyBalance.tenant_id == tenant_id)
    if start:
        q_del = q_del.where(AccountDailyBalance.balance_date >= start)
    if end:
        q_del = q_del.where(AccountDailyBalance.balance_date <= end)
    await session.execute(q_del)

    # Aggregate raw lines by account + date
    date_expr = func.date(JournalLine.created_at)
    stmt = (
        select(
            JournalLine.account_id,
            date_expr.label("d"),
            func.sum(JournalLine.debit).label("debit"),
            func.sum(JournalLine.credit).label("credit"),
        )
        .where(JournalLine.tenant_id == tenant_id)
        .group_by(JournalLine.account_id, date_expr)
    )
    if start:
        stmt = stmt.having(date_expr >= start)
    if end:
        stmt = stmt.having(date_expr <= end)

    rows = (await session.execute(stmt)).all()
    for r in rows:
        net = (r.debit - r.credit) if r.debit and r.credit else (r.debit or Decimal("0")) - (r.credit or Decimal("0"))
        session.add(
            AccountDailyBalance(
                tenant_id=tenant_id,
                account_id=r.account_id,
                balance_date=r.d,
                debit=r.debit or 0,
                credit=r.credit or 0,
                net=net,
            )
        )
    await session.commit()
