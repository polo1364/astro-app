"""Visitor statistics endpoints."""

from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import visitor_repo
from app.db.session import get_db
from app.models.schemas import HomeVisitRequest, HomeVisitResponse, VisitorStatsResponse

router = APIRouter(prefix="/stats")

_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


def _validate_visitor_id(visitor_id: str) -> str:
    normalized = visitor_id.strip()
    if not _UUID_RE.match(normalized):
        raise HTTPException(status_code=400, detail="visitorId 格式不正確")
    try:
        uuid.UUID(normalized)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="visitorId 格式不正確") from exc
    return normalized


@router.post("/home-visit", response_model=HomeVisitResponse)
async def record_home_visit(req: HomeVisitRequest, db: Session = Depends(get_db)):
    visitor_id = _validate_visitor_id(req.visitor_id)
    result = visitor_repo.record_home_visit(visitor_id, db)
    return {
        "recorded": result["recorded"],
        "total_count": result["total_count"],
    }


@router.get("/visitors", response_model=VisitorStatsResponse)
async def get_visitors(db: Session = Depends(get_db)):
    return {"total_count": visitor_repo.get_visitor_total(db)}
