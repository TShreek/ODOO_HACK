import uuid
import pytest
import pytest_asyncio
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from sqlalchemy import select
from datetime import date

from main import app
from database import Base, get_db_session
from models import masters, ledger
from models.masters import ChartOfAccounts, Contact, Product
from services.inventory_service import record_purchase_receipt
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
async def test_reports_pnl_and_stock(session: AsyncSession, client: AsyncClient):
    tenant = uuid.UUID("00000000-0000-0000-0000-000000000001")
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
    session.add(Product(id=prod_id, tenant_id=tenant, name="Widget", unit_price=Decimal("150")))
    await session.commit()

    # Purchase 10 units costing 500
    await record_purchase_receipt(session, tenant, prod_id, Decimal("10"), Decimal("500"), "bill")
    await session.commit()

    # Post invoice selling 2 @150
    await post_simple_invoice(
        session,
        tenant_id=tenant,
        customer_id=cust_id,
        product_id=prod_id,
        quantity=Decimal("2"),
        unit_price=Decimal("150"),
        tax_rate=Decimal("0"),
    )
    await session.commit()

    # Mock current user dependency returns tenant id; overriding done via DB session only -> we skip auth specifics
    # P&L
    resp = await client.get(f"/api/v1/reports/pnl?start={date.today()}&end={date.today()}")
    assert resp.status_code == 200, resp.text
    pnl = resp.json()
    assert pnl["income"] > 0
    assert pnl["expense"] > 0
    # Stock
    resp2 = await client.get("/api/v1/reports/stock")
    assert resp2.status_code == 200, resp2.text
    stock = resp2.json()
    assert len(stock) >= 1
    item = next(s for s in stock if s["product_id"] == str(prod_id))
    assert float(item["quantity_on_hand"]) == 8.0
