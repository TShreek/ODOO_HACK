import uuid
import pytest
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from database import Base
from models import masters
from models.masters import ChartOfAccounts, Contact, Product
from services.posting_service import create_journal_entry, PostingError, post_simple_invoice
from services.inventory_service import record_sale_issue

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
async def test_create_journal_entry_unbalanced(session: AsyncSession):
    tenant = uuid.UUID("00000000-0000-0000-0000-000000000001")
    # Seed two accounts
    a1 = ChartOfAccounts(id=uuid.uuid4(), tenant_id=tenant, account_code="1000", account_name="Cash", account_type="Asset")
    a2 = ChartOfAccounts(id=uuid.uuid4(), tenant_id=tenant, account_code="2000", account_name="AP", account_type="Liability")
    session.add_all([a1, a2])
    await session.commit()
    with pytest.raises(PostingError):
        await create_journal_entry(
            session,
            tenant_id=tenant,
            lines=[{"account_id": a1.id, "debit": Decimal("100")}, {"account_id": a2.id, "credit": Decimal("50")}],
        )


@pytest.mark.asyncio
async def test_create_journal_entry_line_with_both_sides(session: AsyncSession):
    tenant = uuid.UUID("00000000-0000-0000-0000-000000000001")
    a1 = ChartOfAccounts(id=uuid.uuid4(), tenant_id=tenant, account_code="1000", account_name="Cash", account_type="Asset")
    a2 = ChartOfAccounts(id=uuid.uuid4(), tenant_id=tenant, account_code="2000", account_name="AP", account_type="Liability")
    session.add_all([a1, a2])
    await session.commit()
    with pytest.raises(PostingError):
        await create_journal_entry(
            session,
            tenant_id=tenant,
            lines=[{"account_id": a1.id, "debit": Decimal("100"), "credit": Decimal("10")}, {"account_id": a2.id, "credit": Decimal("100")}],
        )


@pytest.mark.asyncio
async def test_record_sale_issue_zero_qty(session: AsyncSession):
    tenant = uuid.UUID("00000000-0000-0000-0000-000000000001")
    prod = Product(id=uuid.uuid4(), tenant_id=tenant, name="Widget", unit_price=Decimal("10"))
    session.add(prod)
    await session.commit()
    with pytest.raises(ValueError):
        await record_sale_issue(session, tenant, prod.id, Decimal("0"), "invoice", None)
