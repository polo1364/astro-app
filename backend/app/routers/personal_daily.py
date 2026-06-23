"""Personal daily horoscope API routes."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.personal_daily_repo import get_personal_report, get_personal_transit
from app.db.session import get_db
from app.models.schemas import PersonalDailyRequest, PersonalDailyResponse
from app.services.daily_pipeline import today_taipei
from app.services.personal_daily_pipeline import run_personal_daily_pipeline

router = APIRouter(prefix="/daily", tags=["daily"])


def _birth_data_dict(req) -> dict:
    b = req.birth_data
    return {
        "name": b.name,
        "date": b.date,
        "time": None if b.birth_time_unknown else b.time,
        "timezone": b.timezone,
        "latitude": b.latitude,
        "longitude": b.longitude,
        "house_system": b.house_system,
        "location": b.location or b.name,
        "birth_time_unknown": b.birth_time_unknown,
    }


@router.post("/personal", response_model=PersonalDailyResponse)
async def post_personal_daily(
    body: PersonalDailyRequest,
    db: Session = Depends(get_db),
):
    result = await run_personal_daily_pipeline(
        db,
        profile_id=body.profile_id,
        birth_data=_birth_data_dict(body),
        transit_date=body.date,
        timezone=body.timezone,
        force=body.force,
    )
    return result


@router.get("/personal/{profile_id}", response_model=PersonalDailyResponse)
async def get_personal_daily(
    profile_id: str,
    date: str | None = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    d = date or today_taipei().isoformat()
    report = get_personal_report(db, profile_id, d)
    if not report or report.validation_status != "passed":
        raise HTTPException(
            status_code=404,
            detail="尚無個人每日行運快取，請先 POST /daily/personal 生成",
        )
    content = json.loads(report.content_json)
    pt = get_personal_transit(db, profile_id, d)
    dv = json.loads(pt.source_json).get("data_validity", {}) if pt else {}
    return {
        "profile_id": profile_id,
        "date": d,
        "status": "ready",
        "data_validity": dv,
        "sections": content.get("sections", {}),
        "validation_status": report.validation_status,
        "cached": True,
        "model_name": report.model_name,
    }
