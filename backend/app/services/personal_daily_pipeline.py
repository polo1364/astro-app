"""Orchestrate personal daily horoscope pipeline."""

from __future__ import annotations

import json
import logging
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import config
from app.data.personal_daily_copy import generate_rule_based_personal
from app.db.personal_daily_repo import (
    get_daily_transit,
    get_personal_report,
    get_personal_transit,
    upsert_daily_transit,
    upsert_natal_chart,
    upsert_personal_report,
    upsert_personal_transit,
)
from app.services.daily_pipeline import today_taipei
from app.services.personal_daily_ai import generate_personal_horoscope
from app.services.personal_daily_aspects import build_personal_aspects
from app.services.personal_daily_ephemeris import build_daily_transit_json
from app.services.personal_daily_natal import birth_data_hash, build_natal_points_from_natal
from app.services.personal_daily_source import build_personal_daily_source
from app.services.personal_daily_validate import validate_personal_horoscope

logger = logging.getLogger(__name__)


async def run_personal_daily_pipeline(
    db: Session,
    *,
    profile_id: str,
    birth_data: dict[str, Any],
    transit_date: str | None = None,
    timezone: str | None = None,
    force: bool = False,
) -> dict[str, Any]:
    d = transit_date or today_taipei().isoformat()
    tz = timezone or birth_data.get("timezone", "Asia/Taipei")

    if not force:
        existing = get_personal_report(db, profile_id, d)
        if existing and existing.validation_status == "passed":
            content = json.loads(existing.content_json)
            pt = get_personal_transit(db, profile_id, d)
            dv = {}
            if pt:
                dv = json.loads(pt.source_json).get("data_validity", {})
            return {
                "profile_id": profile_id,
                "date": d,
                "status": "ready",
                "sections": content.get("sections", {}),
                "data_validity": dv,
                "validation_status": existing.validation_status,
                "cached": True,
            }

    dt_row = get_daily_transit(db, d, tz)
    if dt_row and not force:
        daily_transit_json = json.loads(dt_row.transit_json)
    else:
        daily_transit_json = build_daily_transit_json(d, tz)
        dt_row = upsert_daily_transit(
            db,
            d=d,
            timezone=tz,
            transit_json=daily_transit_json,
            source_hash=daily_transit_json["source_hash"],
        )

    birth_time = None if birth_data.get("birth_time_unknown") else birth_data.get("time")
    transit_result, raw_aspects = build_personal_aspects(
        name=birth_data.get("name", ""),
        birth_date=birth_data["date"],
        birth_time=birth_time,
        timezone=birth_data.get("timezone", tz),
        lat=float(birth_data["latitude"]),
        lng=float(birth_data["longitude"]),
        house_system=birth_data.get("house_system", "Placidus"),
        location=birth_data.get("location", ""),
        transit_date=d,
    )
    natal = transit_result["natal"]
    chart_json = natal.get("chart_json") or {}
    natal_points = build_natal_points_from_natal(natal)

    natal_row = upsert_natal_chart(
        db,
        profile_id=profile_id,
        birth_data=birth_data,
        natal_points=natal_points,
        chart_validity=chart_json.get("chart_validity", {}),
        source_hash=birth_data_hash(birth_data),
    )

    source_doc = build_personal_daily_source(
        profile_id=profile_id,
        date=d,
        timezone=tz,
        natal=natal,
        birth_data=birth_data,
        daily_transit_json=daily_transit_json,
        transit_result=transit_result,
        raw_aspects=raw_aspects,
    )

    try:
        upsert_personal_transit(
            db,
            profile_id=profile_id,
            d=d,
            natal_chart_id=natal_row.id,
            daily_transit_id=dt_row.id,
            source_doc=source_doc,
            source_hash=source_doc["source_hash"],
        )
    except IntegrityError:
        db.rollback()
        cached = get_personal_report(db, profile_id, d)
        if cached and cached.validation_status == "passed":
            content = json.loads(cached.content_json)
            return {
                "profile_id": profile_id,
                "date": d,
                "status": "ready",
                "sections": content.get("sections", {}),
                "validation_status": cached.validation_status,
                "cached": True,
            }
        raise

    content: dict[str, Any] = {}
    model_name = "rule_based"
    validation_status = "failed"

    for attempt in range(config.PERSONAL_DAILY_AI_MAX_RETRIES + 1):
        content, model_name = await generate_personal_horoscope(source_doc)
        errors = validate_personal_horoscope(content, source_doc)
        if not errors:
            validation_status = "passed"
            break
        logger.warning("Personal daily validation failed attempt %s: %s", attempt + 1, errors)

    if validation_status != "passed":
        content = generate_rule_based_personal(source_doc)
        fb_errors = validate_personal_horoscope(content, source_doc)
        validation_status = "passed" if not fb_errors else "failed"
        model_name = "rule_based"

    upsert_personal_report(
        db,
        profile_id=profile_id,
        d=d,
        content=content,
        model_name=model_name,
        prompt_version=config.PERSONAL_DAILY_PROMPT_VERSION,
        source_hash=source_doc["source_hash"],
        validation_status=validation_status,
    )
    db.commit()

    return {
        "profile_id": profile_id,
        "date": d,
        "status": "ready" if validation_status == "passed" else "failed",
        "data_validity": source_doc["data_validity"],
        "sections": content.get("sections", {}),
        "validation_status": validation_status,
        "cached": False,
        "model_name": model_name,
    }
