"""Repository for daily horoscope persistence."""

from __future__ import annotations

import json
from datetime import date
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.models import DailyHoroscope, DailySignSource, DailySky


def _parse_date(d: str | date) -> date:
    if isinstance(d, date):
        return d
    return date.fromisoformat(d)


def get_or_create_sky(db: Session, d: str | date) -> DailySky:
    day = _parse_date(d)
    row = db.scalar(select(DailySky).where(DailySky.date == day))
    if row:
        return row
    row = DailySky(date=day, timezone="Asia/Taipei", ephemeris_engine="swiss_ephemeris")
    db.add(row)
    db.flush()
    return row


def upsert_source_data(db: Session, source_doc: dict[str, Any]) -> DailySky:
    day = _parse_date(source_doc["date"])
    sky = get_or_create_sky(db, day)
    daily_sky = source_doc["daily_sky"]

    sky.timezone = source_doc["timezone"]
    sky.planet_positions_json = json.dumps(daily_sky["planets"], ensure_ascii=False)
    sky.major_aspects_json = json.dumps(daily_sky["major_aspects"], ensure_ascii=False)
    sky.moon_events_json = json.dumps(daily_sky["moon_events"], ensure_ascii=False)
    sky.source_json = json.dumps(source_doc, ensure_ascii=False)
    sky.source_json_hash = source_doc.get("source_json_hash", "")
    sky.generation_status = "pending"
    db.flush()

    db.execute(delete(DailySignSource).where(DailySignSource.date == day))
    for sign_id, src in source_doc["sign_horoscopes_source"].items():
        db.add(
            DailySignSource(
                date=day,
                sign=sign_id,
                sun_house=src["sun_house"],
                moon_house=src["moon_house"],
                mercury_house=src["mercury_house"],
                venus_house=src["venus_house"],
                mars_house=src["mars_house"],
                main_houses_json=json.dumps(src["main_houses"], ensure_ascii=False),
                themes_json=json.dumps(src["themes"], ensure_ascii=False),
                source_json=json.dumps(src, ensure_ascii=False),
            )
        )
    db.flush()
    return sky


def upsert_horoscope(
    db: Session,
    day: str | date,
    sign: str,
    content: dict[str, Any],
    *,
    model_name: str,
    prompt_version: str,
    source_hash: str,
    validation_status: str,
) -> DailyHoroscope:
    d = _parse_date(day)
    row = db.scalar(
        select(DailyHoroscope).where(DailyHoroscope.date == d, DailyHoroscope.sign == sign)
    )
    if row is None:
        row = DailyHoroscope(date=d, sign=sign)
        db.add(row)
    row.content_json = json.dumps(content, ensure_ascii=False)
    row.model_name = model_name
    row.prompt_version = prompt_version
    row.source_json_hash = source_hash
    row.validation_status = validation_status
    db.flush()
    return row


def count_passed_signs(db: Session, d: str | date) -> int:
    day = _parse_date(d)
    return db.scalar(
        select(func.count())
        .select_from(DailyHoroscope)
        .where(
            DailyHoroscope.date == day,
            DailyHoroscope.validation_status == "passed",
        )
    ) or 0


def update_sky_status(db: Session, d: str | date) -> DailySky | None:
    day = _parse_date(d)
    sky = db.scalar(select(DailySky).where(DailySky.date == day))
    if not sky:
        return None
    passed = count_passed_signs(db, day)
    sky.passed_sign_count = passed
    if passed >= 12:
        sky.generation_status = "ready"
    elif passed > 0:
        sky.generation_status = "pending"
    else:
        failed = db.scalar(
            select(func.count())
            .select_from(DailyHoroscope)
            .where(DailyHoroscope.date == day, DailyHoroscope.validation_status == "failed")
        ) or 0
        sky.generation_status = "failed" if failed > 0 else "pending"
    db.flush()
    return sky


def get_sky(db: Session, d: str | date) -> DailySky | None:
    return db.scalar(select(DailySky).where(DailySky.date == _parse_date(d)))


def get_horoscopes_for_date(db: Session, d: str | date) -> list[DailyHoroscope]:
    day = _parse_date(d)
    return list(
        db.scalars(select(DailyHoroscope).where(DailyHoroscope.date == day)).all()
    )


def get_horoscope(db: Session, d: str | date, sign: str) -> DailyHoroscope | None:
    day = _parse_date(d)
    return db.scalar(
        select(DailyHoroscope).where(DailyHoroscope.date == day, DailyHoroscope.sign == sign)
    )


def all_signs_passed(db: Session, d: str | date) -> bool:
    return count_passed_signs(db, d) >= 12


def increment_scheduler_retry(db: Session, d: str | date) -> int:
    sky = get_sky(db, d)
    if not sky:
        return 0
    sky.scheduler_retry_count += 1
    db.flush()
    return sky.scheduler_retry_count
