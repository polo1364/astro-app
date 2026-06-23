"""Public daily horoscope API routes."""

from __future__ import annotations

import json
from datetime import date

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import config
from app.db.daily_repo import get_horoscope, get_horoscopes_for_date, get_sky
from app.db.session import get_db
from app.services.daily_constants import SIGN_IDS
from app.services.daily_horoscope_source import sky_summary_from_source
from app.services.daily_pipeline import generate_daily_horoscope, today_taipei

router = APIRouter(prefix="/daily", tags=["daily"])


def _resolve_date(date_param: str | None) -> date:
    if date_param:
        return date.fromisoformat(date_param)
    return today_taipei()


def _batch_response(db: Session, d: date) -> dict:
    sky = get_sky(db, d)
    horoscopes = get_horoscopes_for_date(db, d)
    passed = sum(1 for h in horoscopes if h.validation_status == "passed")

    signs: dict[str, dict] = {}
    for h in horoscopes:
        if h.validation_status == "passed":
            signs[h.sign] = {
                "sections": json.loads(h.content_json).get("sections", {}),
                "validation_status": h.validation_status,
            }

    sky_summary = None
    if sky and sky.source_json:
        try:
            source = json.loads(sky.source_json)
            sky_summary = sky_summary_from_source(source)
        except json.JSONDecodeError:
            pass

    if passed >= 12:
        status = "ready"
        code = 200
    elif passed > 0 or (sky and sky.generation_status == "pending"):
        status = "pending"
        code = 200
    elif sky and sky.generation_status == "failed" and passed == 0:
        status = "failed"
        code = 503
    else:
        status = "pending"
        code = 200

    return {
        "http_status": code,
        "body": {
            "date": d.isoformat(),
            "timezone": config.DAILY_TIMEZONE,
            "status": status,
            "passed_sign_count": passed,
            "sky_summary": sky_summary,
            "signs": signs,
        },
    }


@router.get("/public")
async def get_public_batch(
    date_param: str | None = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    d = _resolve_date(date_param)
    result = _batch_response(db, d)
    if result["http_status"] == 503:
        raise HTTPException(status_code=503, detail=result["body"])
    return result["body"]


@router.get("/public/sign/{sign}")
async def get_public_sign(
    sign: str,
    date_param: str | None = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    if sign not in SIGN_IDS:
        raise HTTPException(status_code=404, detail="未知星座")
    d = _resolve_date(date_param)
    row = get_horoscope(db, d, sign)
    if not row or row.validation_status != "passed":
        raise HTTPException(status_code=404, detail="尚無該日運勢")
    return {
        "date": d.isoformat(),
        "timezone": config.DAILY_TIMEZONE,
        "sign": sign,
        "sections": json.loads(row.content_json).get("sections", {}),
    }


@router.get("/source")
async def get_source(
    date_param: str | None = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    d = _resolve_date(date_param)
    sky = get_sky(db, d)
    if not sky or not sky.source_json:
        raise HTTPException(status_code=404, detail="尚無來源 JSON")
    return json.loads(sky.source_json)


@router.post("/generate")
async def post_generate(
    background_tasks: BackgroundTasks,
    date_param: str | None = Query(None, alias="date"),
    force: bool = Query(False),
    sync: bool = Query(False, description="同步執行（開發用）"),
):
    d = date_param or today_taipei().isoformat()
    if sync:
        result = await generate_daily_horoscope(d, force=force)
        return result
    background_tasks.add_task(generate_daily_horoscope, d, force)
    return {"message": "已排入生成佇列", "date": d, "force": force}
