"""Repository for homepage visitor statistics."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import HomeVisitorLog
from app.services.daily_pipeline import today_taipei


def record_home_visit(visitor_id: str, db: Session) -> dict[str, bool | int]:
    """Record a homepage visit for today; return recorded flag and total count."""
    day = today_taipei()
    recorded = False
    try:
        db.add(HomeVisitorLog(date=day, visitor_id=visitor_id))
        db.commit()
        recorded = True
    except IntegrityError:
        db.rollback()

    total = get_visitor_total(db)
    return {"recorded": recorded, "total_count": total}


def get_visitor_total(db: Session) -> int:
    return int(db.scalar(select(func.count()).select_from(HomeVisitorLog)) or 0)
