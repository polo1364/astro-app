"""SQLAlchemy engine and session."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app import config

connect_args = {}
if config.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    config.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    import logging

    from app import config
    from app.db import models  # noqa: F401

    if config.IS_PRODUCTION and config.DATABASE_URL.startswith("sqlite"):
        logging.getLogger(__name__).warning(
            "Production 使用 SQLite，資料會在重新部署後消失；請設定 DATABASE_URL 連接 Postgres 以持久化瀏覽統計。"
        )

    Base.metadata.create_all(bind=engine)
