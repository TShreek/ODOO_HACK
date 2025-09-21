from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from api import auth, masters
from api.transactions import router as transactions_router
from api.reports import router as reports_router
from api.health import router as health_router
from api.hsn_api_proxy import router as hsn_router
from database import create_db_and_tables


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
    yield
    # Shutdown (if needed)


# Create FastAPI app with lifespan
app = FastAPI(
    title="ODOO_HACK Backend API",
    description="Master Data Management API for accounting system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for local static demo (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(masters.router, prefix="/api/v1")
app.include_router(transactions_router)
app.include_router(reports_router)
app.include_router(health_router)
app.include_router(hsn_router, prefix="/api/v1")


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
