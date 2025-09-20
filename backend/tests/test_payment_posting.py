import uuid
import pytest
import pytest_asyncio
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from sqlalchemy import select

from database import Base
from models import masters, ledger, payments
from models.masters import ChartOfAccounts, Contact, Product
from services.posting_service import post_simple_invoice, post_payment

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture()
async def session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as s:
        yield s
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio
async def test_payment_balances_receivable(session: AsyncSession):
    tenant = uuid.UUID("00000000-0000-0000-0000-000000000001")
    # Seed accounts subset
    for code, name, t in [
        ("1000", "Cash", "Asset"),
        ("1100", "Accounts Receivable", "Asset"),
        ("4000", "Sales", "Income"),
        ("4100", "Output Tax", "Liability"),
        ("5100", "COGS", "Expense"),
        ("1200", "Inventory", "Asset"),
    ]:
        session.add(ChartOfAccounts(tenant_id=tenant, account_code=code, account_name=name, account_type=t))
    cust_id = uuid.uuid4()
    prod_id = uuid.uuid4()
    session.add(Contact(id=cust_id, tenant_id=tenant, name="Customer", contact_type="customer"))
    session.add(Product(id=prod_id, tenant_id=tenant, name="Item", unit_price=Decimal("100")))
    await session.commit()

    inv_entry = await post_simple_invoice(
        session,
        tenant_id=tenant,
        customer_id=cust_id,
        product_id=prod_id,
        quantity=Decimal("1"),
        unit_price=Decimal("100"),
        tax_rate=Decimal("0"),
    )

    pay = await post_payment(
        session,
        tenant_id=tenant,
        partner_id=cust_id,
        amount=Decimal("100"),
        direction="inbound",
    )

    from models.ledger import JournalLine
    lines = (await session.execute(select(JournalLine))).scalars().all()
    total_debit = sum([l.debit for l in lines])
    total_credit = sum([l.credit for l in lines])
    assert total_debit == total_credit
