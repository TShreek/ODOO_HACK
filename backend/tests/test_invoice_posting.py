import uuid
import pytest
import pytest_asyncio
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from sqlalchemy import select, func

from main import app
from database import Base, get_db_session
from models import masters, ledger  # ensure tables
from models.masters import Contact, Product, ChartOfAccounts
from services.posting_service import post_simple_invoice


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


@pytest_asyncio.fixture()
async def client(session: AsyncSession):
    def override():
        return session
    app.dependency_overrides[get_db_session] = override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_post_simple_invoice_balanced(session: AsyncSession):
    tenant_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
    # Seed minimal accounts if not present
    existing = await session.scalar(select(func.count()).select_from(ChartOfAccounts).where(ChartOfAccounts.tenant_id == tenant_id))
    if existing == 0:
        accounts = [
            ("1000", "Cash", "Asset"),
            ("1100", "Accounts Receivable", "Asset"),
            ("4000", "Sales Income", "Income"),
            ("4100", "Output Tax", "Liability"),
        ]
        for code, name, t in accounts:
            session.add(ChartOfAccounts(tenant_id=tenant_id, account_code=code, account_name=name, account_type=t))
        await session.flush()

    # Create customer & product
    cust_id = uuid.uuid4()
    prod_id = uuid.uuid4()
    session.add(Contact(id=cust_id, tenant_id=tenant_id, name="Test Customer", contact_type="customer"))
    session.add(Product(id=prod_id, tenant_id=tenant_id, name="Widget", unit_price=Decimal("100.00")))
    await session.commit()

    entry = await post_simple_invoice(
        session=session,
        tenant_id=tenant_id,
        customer_id=cust_id,
        product_id=prod_id,
        quantity=Decimal("2"),
        unit_price=Decimal("50.00"),
        tax_rate=Decimal("10"),
    )

    # Reload lines
    from models.ledger import JournalLine
    lines = (await session.execute(select(JournalLine).where(JournalLine.entry_id == entry.id))).scalars().all()
    total_debit = sum([l.debit for l in lines])
    total_credit = sum([l.credit for l in lines])
    assert total_debit == total_credit, "Ledger not balanced"
    assert len(lines) == 3  # AR, Sales, Tax
    assert float(total_debit) == 110.00
