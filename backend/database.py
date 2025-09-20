# Database implementation
from typing import Generator
from sqlmodel import create_engine, Session, SQLModel
from config import settings
from models import auth


engine = create_engine(settings.DATABASE_URL, echo=True)


def create_db_and_tables():
    """
    Creates all tables in the database based on the SQLModel definitions.
    """
    SQLModel.metadata.create_all(engine)


def get_db() -> Generator:
    """
    Dependency to get a database session.
    """
    with Session(engine) as session:
        yield session
