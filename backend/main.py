from fastapi import FastAPI, Request, Response
from infrastructure.observability.request_id_middleware import RequestIDMiddleware
from infrastructure.observability.metrics_middleware import MetricsMiddleware, get_metrics_snapshot
from infrastructure.observability.rate_limit_middleware import RateLimitMiddleware
from infrastructure.observability.security_headers_middleware import SecurityHeadersMiddleware
from infrastructure.observability.logging_config import configure_logging
from contextlib import asynccontextmanager

# Import routers
from api import auth, masters, reports
from api import transaction_events, accounting_reports
from api import transactions  # NEW: transactions router
from api import realtime  # websocket dashboard
from api import healthz  # new live DB health endpoint
from api import readyz   # readiness endpoint
from database import create_db_and_tables, AsyncSessionLocal
from sqlalchemy import select
from models.masters import ChartOfAccounts
import uuid


DEFAULT_ACCOUNTS = [
    ("1000", "Cash", "Asset"),
    ("1010", "Bank", "Asset"),
    ("1100", "Accounts Receivable", "Asset"),
    ("2000", "Accounts Payable", "Liability"),
    ("3000", "Equity", "Equity"),
    ("4000", "Sales Income", "Income"),
    ("5000", "Purchases Expense", "Expense"),
    ("5100", "Cost of Goods Sold", "Expense"),
    ("1200", "Inventory", "Asset"),
    ("2100", "Input Tax", "Asset"),
    ("4100", "Output Tax", "Liability"),
]


async def seed_chart_of_accounts():
    async with AsyncSessionLocal() as session:
        # For hackathon simplicity each user has its own tenant; we seed a global demo tenant
        demo_tenant = uuid.UUID("00000000-0000-0000-0000-000000000001")
        existing = await session.execute(select(ChartOfAccounts).where(ChartOfAccounts.tenant_id == demo_tenant))
        if existing.scalars().first():
            return
        for code, name, acc_type in DEFAULT_ACCOUNTS:
            session.add(ChartOfAccounts(
                tenant_id=demo_tenant,
                account_code=code,
                account_name=name,
                account_type=acc_type,
            ))
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Async context manager for application lifespan events.
    Initializes database on startup.
    """
    # Import all models to ensure they're registered with Base.metadata
    from models import auth, masters  # This ensures all tables are created
    
    # Startup
    await create_db_and_tables()
    from models import ledger  # ensure ledger tables imported
    await seed_chart_of_accounts()
    yield
    # Shutdown (if needed)


configure_logging()

# Create FastAPI app with lifespan
app = FastAPI(
    title="ODOO_HACK Backend API",
    description="Master Data Management API for accounting system",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(RequestIDMiddleware)
app.add_middleware(MetricsMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Include API routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(masters.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(transaction_events.router)
app.include_router(accounting_reports.router)
app.include_router(transactions.router)  # NEW: transactional PO/SO endpoints
app.include_router(healthz.router)
app.include_router(readyz.router)
app.include_router(realtime.router)


@app.get("/", tags=["Health Check"])
def read_root():
    """
    Root endpoint for a basic health check.
    """
    return {
        "message": "ODOO_HACK Backend API",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/v1/register, /api/v1/login",
            "masters": "/api/v1/masters/*"
        }
    }


@app.get("/health", tags=["Health Check"])
def health_check():
    """
    Detailed health check endpoint.
    """
    return {
        "status": "healthy",
        "database": "connected",
        "services": {
            "auth": "available",
            "masters": "available",
            "hsn_api": "available_with_fallback"
        }
    }


@app.get("/metrics", tags=["Observability"])
def metrics(request: Request):
    """Return metrics in JSON (default) or Prometheus text (Accept: text/plain)."""
    accept = request.headers.get("accept", "")
    if "text/plain" in accept:
        body = get_metrics_snapshot(prometheus=True)
        return Response(content=body, media_type="text/plain; version=0.0.4")
    return get_metrics_snapshot()
