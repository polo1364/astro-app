"""Distributed lock for daily generation (PostgreSQL advisory / thread fallback)."""

from __future__ import annotations

import threading
from contextlib import contextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app import config

_local_lock = threading.Lock()
LOCK_KEY = 83927421


@contextmanager
def daily_generation_lock(db: Session):
    is_pg = config.DATABASE_URL.startswith("postgresql")
    acquired = False
    if is_pg:
        row = db.execute(
            text("SELECT pg_try_advisory_lock(:k)"),
            {"k": LOCK_KEY},
        ).scalar()
        acquired = bool(row)
        if not acquired:
            yield False
            return
        try:
            yield True
        finally:
            db.execute(text("SELECT pg_advisory_unlock(:k)"), {"k": LOCK_KEY})
    else:
        acquired = _local_lock.acquire(blocking=False)
        if not acquired:
            yield False
            return
        try:
            yield True
        finally:
            _local_lock.release()
