"""Database engine setup and session management."""

from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record) -> None:
    """Enable FK constraint enforcement for every new SQLite connection.

    SQLite disables foreign key constraints by default; this pragma activates
    them so ON DELETE CASCADE and ON DELETE SET NULL behave as expected.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


engine = create_engine(settings.database_url, echo=False)


def create_db_and_tables() -> None:
    """Create all tables defined in SQLModel metadata if they do not exist."""
    import app.models  # noqa: F401 — ensures all models are registered before create
    SQLModel.metadata.create_all(engine)


def get_session():
    """FastAPI dependency that yields a database session per request."""
    with Session(engine) as session:
        yield session
