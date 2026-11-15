import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

logger = logging.getLogger("astrohealth.database")

BASE_DIR = Path(__file__).resolve().parent.parent
SQLITE_DB_PATH = BASE_DIR / "astrohealth_demo.db"
SQLITE_URL = f"sqlite:///{SQLITE_DB_PATH.as_posix()}"

ACTIVE_DB_MODE = "sqlite_local"
ACTIVE_DB_DESCRIPTION = "Local SQLite persistence (MySQL-compatible SQLAlchemy schema)"


def _create_resilient_engine():
    """
    Attempts to connect to the configured MySQL database if provided in environment variables.
    If MySQL is not configured or unreachable, safely falls back to a local SQLite database
    so the demonstration prototype always starts cleanly without crashing.
    """
    global ACTIVE_DB_MODE, ACTIVE_DB_DESCRIPTION

    mysql_url = settings.get_mysql_url()
    if mysql_url and mysql_url.startswith("mysql"):
        try:
            candidate_engine = create_engine(
                mysql_url,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 4},
            )
            with candidate_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            ACTIVE_DB_MODE = "mysql"
            ACTIVE_DB_DESCRIPTION = f"MySQL Database ({settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE})"
            logger.info("Connected to MySQL database successfully.")
            return candidate_engine
        except Exception as exc:
            logger.warning(
                "MySQL connection unavailable (%s). Falling back to local SQLite store.",
                exc,
            )
            ACTIVE_DB_MODE = "sqlite_fallback"
            ACTIVE_DB_DESCRIPTION = (
                "SQLite fallback active (MySQL configured in environment but unreachable)"
            )

    return create_engine(
        SQLITE_URL,
        connect_args={"check_same_thread": False},
    )


engine = _create_resilient_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_database_status() -> dict:
    return {
        "mode": ACTIVE_DB_MODE,
        "description": ACTIVE_DB_DESCRIPTION,
        "mysql_configured": bool(settings.get_mysql_url()),
        "orm": "SQLAlchemy 2.x (MySQL & SQLite compatible)",
    }
