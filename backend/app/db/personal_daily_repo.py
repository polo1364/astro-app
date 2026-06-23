"""Repository for personal daily horoscope persistence."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import (
    DailyTransit,
    NatalChart,
    PersonalizedDailyReport,
    PersonalizedDailyTransit,
)


def _parse_date(d: str | date) -> date:
    if isinstance(d, date):
        return d
    return date.fromisoformat(d)


def get_natal_chart(db: Session, profile_id: str) -> NatalChart | None:
    return db.scalar(select(NatalChart).where(NatalChart.profile_id == profile_id))


def upsert_natal_chart(
    db: Session,
    *,
    profile_id: str,
    birth_data: dict[str, Any],
    natal_points: dict[str, Any],
    chart_validity: dict[str, Any],
    source_hash: str,
) -> NatalChart:
    row = get_natal_chart(db, profile_id)
    now = datetime.utcnow()
    if row is None:
        row = NatalChart(profile_id=profile_id)
        db.add(row)
    row.birth_data_json = json.dumps(birth_data, ensure_ascii=False)
    row.natal_points_json = json.dumps(natal_points, ensure_ascii=False)
    row.chart_validity_json = json.dumps(chart_validity, ensure_ascii=False)
    row.source_hash = source_hash
    row.updated_at = now
    db.flush()
    return row


def get_daily_transit(db: Session, d: str | date, timezone: str) -> DailyTransit | None:
    day = _parse_date(d)
    return db.scalar(
        select(DailyTransit).where(
            DailyTransit.date == day,
            DailyTransit.timezone == timezone,
        )
    )


def upsert_daily_transit(
    db: Session,
    *,
    d: str | date,
    timezone: str,
    transit_json: dict[str, Any],
    source_hash: str,
) -> DailyTransit:
    day = _parse_date(d)
    row = get_daily_transit(db, day, timezone)
    if row is None:
        row = DailyTransit(date=day, timezone=timezone)
        db.add(row)
    row.transit_json = json.dumps(transit_json, ensure_ascii=False)
    row.source_hash = source_hash
    db.flush()
    return row


def get_personal_transit(
    db: Session, profile_id: str, d: str | date
) -> PersonalizedDailyTransit | None:
    day = _parse_date(d)
    return db.scalar(
        select(PersonalizedDailyTransit).where(
            PersonalizedDailyTransit.profile_id == profile_id,
            PersonalizedDailyTransit.date == day,
        )
    )


def upsert_personal_transit(
    db: Session,
    *,
    profile_id: str,
    d: str | date,
    natal_chart_id: int,
    daily_transit_id: int,
    source_doc: dict[str, Any],
    source_hash: str,
) -> PersonalizedDailyTransit:
    day = _parse_date(d)
    row = get_personal_transit(db, profile_id, day)
    if row is None:
        row = PersonalizedDailyTransit(profile_id=profile_id, date=day)
        db.add(row)
    row.natal_chart_id = natal_chart_id
    row.daily_transit_id = daily_transit_id
    row.source_json = json.dumps(source_doc, ensure_ascii=False)
    row.source_hash = source_hash
    db.flush()
    return row


def get_personal_report(
    db: Session, profile_id: str, d: str | date
) -> PersonalizedDailyReport | None:
    day = _parse_date(d)
    return db.scalar(
        select(PersonalizedDailyReport).where(
            PersonalizedDailyReport.profile_id == profile_id,
            PersonalizedDailyReport.date == day,
        )
    )


def upsert_personal_report(
    db: Session,
    *,
    profile_id: str,
    d: str | date,
    content: dict[str, Any],
    model_name: str,
    prompt_version: str,
    source_hash: str,
    validation_status: str,
) -> PersonalizedDailyReport:
    day = _parse_date(d)
    row = get_personal_report(db, profile_id, day)
    if row is None:
        row = PersonalizedDailyReport(profile_id=profile_id, date=day)
        db.add(row)
    row.content_json = json.dumps(content, ensure_ascii=False)
    row.model_name = model_name
    row.prompt_version = prompt_version
    row.source_hash = source_hash
    row.validation_status = validation_status
    db.flush()
    return row
