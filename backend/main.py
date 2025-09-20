from fastapi import FastAPI
from api import auth
from database import create_db_and_tables

app = FastAPI()

# Include API routers
app.include_router(auth.router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup():
    """
    Asynchronously initializes the database and creates tables on startup.
    """
    await create_db_and_tables()


@app.get("/")
def read_root():
    """
    Root endpoint for a basic health check.
    """
    return {"Hello": "World"}

