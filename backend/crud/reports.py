from datetime import date
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

async def get_profit_and_loss(session: AsyncSession, tenant_id: str, date_from: date, date_to: date):
    q = text("""
        SELECT
          SUM(CASE WHEN coa.account_type = 'Income'  THEN credit_amount - debit_amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN coa.account_type = 'Expense' THEN debit_amount - credit_amount ELSE 0 END) AS total_expense
        FROM journal_entries je
        JOIN chart_of_accounts coa ON coa.id = je.account_id
        WHERE je.tenant_id = :tenant
          AND je.entry_date >= :fromd
          AND je.entry_date < (CAST(:tod AS date) + INTERVAL '1 day')
    """)
    r = await session.execute(q, {"tenant": tenant_id, "fromd": date_from, "tod": date_to})
    income, expense = r.one()
    income = float(income or 0); expense = float(expense or 0)
    return {"total_income": income, "total_expense": expense, "net_profit": income - expense}

async def get_balance_sheet(session: AsyncSession, tenant_id: str, as_of: date):
    q = text("""
        SELECT
          COALESCE(SUM(CASE WHEN coa.account_type='Asset'     THEN debit_amount - credit_amount END),0) AS assets,
          COALESCE(SUM(CASE WHEN coa.account_type='Liability' THEN credit_amount - debit_amount END),0) AS liabilities,
          COALESCE(SUM(CASE WHEN coa.account_type='Equity'    THEN credit_amount - debit_amount END),0) AS equity
        FROM journal_entries je
        JOIN chart_of_accounts coa ON coa.id = je.account_id
        WHERE je.tenant_id = :tenant
          AND je.entry_date < (CAST(:asof AS date) + INTERVAL '1 day')
    """)
    r = await session.execute(q, {"tenant": tenant_id, "asof": as_of})
    assets, liabilities, equity = r.one()
    assets = float(assets or 0); liabilities = float(liabilities or 0); equity = float(equity or 0)
    return {"assets": assets, "liabilities": liabilities, "equity": equity, "balance_check": assets - liabilities - equity}
