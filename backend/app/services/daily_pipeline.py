"""Orchestrate daily horoscope generation pipeline."""

from __future__ import annotations

import asyncio
import logging
from datetime import date
from typing import Any
from zoneinfo import ZoneInfo

from app import config
from app.db.daily_repo import (
    all_signs_passed,
    get_horoscope,
    update_sky_status,
    upsert_horoscope,
    upsert_source_data,
)
from app.db.session import SessionLocal
from app.services.daily_constants import SIGN_IDS
from app.services.daily_horoscope_ai import generate_horoscope_for_sign
from app.services.daily_horoscope_source import build_daily_horoscope_source
from app.services.daily_horoscope_validate import validate_horoscope_content

logger = logging.getLogger(__name__)
TZ = ZoneInfo(config.DAILY_TIMEZONE)


def today_taipei() -> date:
    from datetime import datetime

    return datetime.now(TZ).date()


async def _generate_one_sign(
    source_doc: dict[str, Any],
    sign_id: str,
) -> tuple[dict[str, Any], str]:
    last_errors: list[str] = []
    content: dict[str, Any] = {}
    for attempt in range(config.DAILY_AI_MAX_RETRIES + 1):
        content = await generate_horoscope_for_sign(source_doc, sign_id)
        errors = validate_horoscope_content(content, source_doc, sign_id)
        if not errors:
            return content, "passed"
        last_errors = errors
        logger.warning("Sign %s validation failed (attempt %s): %s", sign_id, attempt + 1, errors)

    # Last resort: rule-based always passes relaxed validation in dev
    from app.services.daily_horoscope_ai import generate_rule_based_horoscope

    content = generate_rule_based_horoscope(source_doc, sign_id)
    errors = validate_horoscope_content(content, source_doc, sign_id)
    if errors:
        logger.error("Sign %s final validation failed: %s", sign_id, last_errors)
        return content, "failed"
    return content, "passed"


async def generate_daily_horoscope(
    target_date: str | date | None = None,
    force: bool = False,
) -> dict[str, Any]:
    if target_date is None:
        d = today_taipei()
    elif isinstance(target_date, date):
        d = target_date
    else:
        d = date.fromisoformat(target_date)

    date_str = d.isoformat()
    db = SessionLocal()
    try:
        if not force and all_signs_passed(db, d):
            sky = update_sky_status(db, d)
            db.commit()
            return {
                "date": date_str,
                "skipped": True,
                "status": sky.generation_status if sky else "ready",
                "passed_sign_count": 12,
            }

        source_doc = build_daily_horoscope_source(date_str, config.DAILY_TIMEZONE)
        upsert_source_data(db, source_doc)
        db.commit()

        passed = 0
        failed = 0
        for sign_id in SIGN_IDS:
            existing = get_horoscope(db, d, sign_id)
            if not force and existing and existing.validation_status == "passed":
                passed += 1
                continue

            content, status = await _generate_one_sign(source_doc, sign_id)
            upsert_horoscope(
                db,
                d,
                sign_id,
                content,
                model_name=config.DEEPSEEK_MODEL if config.DEEPSEEK_API_KEY else "rule_based",
                prompt_version=config.DAILY_PROMPT_VERSION,
                source_hash=source_doc["source_json_hash"],
                validation_status=status,
            )
            db.commit()
            if status == "passed":
                passed += 1
            else:
                failed += 1

        sky = update_sky_status(db, d)
        db.commit()
        return {
            "date": date_str,
            "skipped": False,
            "status": sky.generation_status if sky else "pending",
            "passed_sign_count": passed,
            "failed_sign_count": failed,
            "source_json_hash": source_doc["source_json_hash"],
        }
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def generate_daily_horoscope_sync(
    target_date: str | date | None = None,
    force: bool = False,
) -> dict[str, Any]:
    return asyncio.run(generate_daily_horoscope(target_date, force))
