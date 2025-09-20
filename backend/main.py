# main application
from fastapi import FastAPI
from .api import auth
from .database import create_db_and_tables

app = FastAPI()

# Include API routers
app.include_router(auth.router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    """
    Initializes the database and creates tables on application startup.
    """
    create_db_and_tables()


@app.get("/")
def read_root():
    """
    Root endpoint for a basic health check.
    """
    return {"Hello": "World"}
