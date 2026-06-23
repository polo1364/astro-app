"""Assemble personalized_daily_transit_json source document."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app import config
from app.data.personal_daily_labels import planet_zh
from app.services.daily_themes import theme_label_zh, themes_for_house
from app.services.personal_daily_filter import filter_personal_aspects
from app.services.personal_daily_natal import build_data_validity, build_natal_summary
from app.services.personal_daily_normalize import aspect_match_key


def build_daily_house_focus(
    transit_planets: list[dict[str, Any]],
    can_use_houses: bool,
) -> list[dict[str, Any]] | None:
    if not can_use_houses:
        return None
    by_house: dict[int, list[str]] = {}
    for p in transit_planets:
        house = p.get("natal_house")
        if not house:
            continue
        key = p.get("name_key") or p.get("name", "")
        if isinstance(key, str) and key not in by_house.get(house, []):
            by_house.setdefault(house, []).append(key)

    focus: list[dict[str, Any]] = []
    for house, triggered in sorted(by_house.items()):
        themes = themes_for_house(house)
        theme_key = themes[0] if themes else "general_aspect"
        focus.append({
            "house": house,
            "theme": theme_key,
            "theme_zh": theme_label_zh(theme_key),
            "triggered_by": triggered,
        })
    return focus or None


def build_long_term_background(transit_chart_json: dict[str, Any]) -> list[dict[str, Any]]:
    periods = transit_chart_json.get("active_periods") or []
    out: list[dict[str, Any]] = []
    for p in periods:
        out.append({
            "transit_planet": p.get("transit_planet"),
            "transit_planet_zh": planet_zh(p.get("transit_planet", "")),
            "natal_point": p.get("natal_point"),
            "natal_point_zh": planet_zh(p.get("natal_point", "")),
            "aspect": p.get("aspect"),
            "start_date": p.get("start_date"),
            "end_date": p.get("end_date"),
            "exact_dates": p.get("exact_dates", []),
        })
    return out


def build_daily_triggers(
    aspects: list[dict[str, Any]],
    long_term: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    triggers: list[dict[str, Any]] = []
    lt_keys = {
        aspect_match_key(
            p.get("transit_planet", ""),
            p.get("natal_point", ""),
            p.get("aspect", ""),
        )
        for p in long_term
    }
    for a in aspects:
        key = aspect_match_key(a["transit_planet"], a["natal_point"], a["aspect"])
        if key in lt_keys:
            triggers.append({
                "daily_aspect": a,
                "matches_long_term": True,
            })
    return triggers


def composite_source_hash(
    natal_hash: str,
    daily_transit_hash: str,
    source_body: dict[str, Any],
) -> str:
    payload = {
        "natal_hash": natal_hash,
        "daily_transit_hash": daily_transit_hash,
        "prompt_version": config.PERSONAL_DAILY_PROMPT_VERSION,
        "body": {k: v for k, v in source_body.items() if k != "source_hash"},
    }
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_personal_daily_source(
    *,
    profile_id: str,
    date: str,
    timezone: str,
    natal: dict[str, Any],
    birth_data: dict[str, Any],
    daily_transit_json: dict[str, Any],
    transit_result: dict[str, Any],
    raw_aspects: list[dict[str, Any]],
) -> dict[str, Any]:
    natal_summary = build_natal_summary(natal, birth_data)
    validity = build_data_validity(natal_summary["chart_validity"])
    filtered_aspects, daily_summary = filter_personal_aspects(raw_aspects)

    tcj = transit_result.get("transit_chart_json") or {}
    transit_planets = transit_result.get("transit_planets") or []
    long_term = build_long_term_background(tcj)
    house_focus = build_daily_house_focus(transit_planets, validity["can_use_houses"])
    if not validity["can_use_houses"]:
        house_focus = None

    doc: dict[str, Any] = {
        "profile_id": profile_id,
        "date": date,
        "timezone": timezone,
        "type": "personal_daily_transit_v1",
        "natal_summary": natal_summary,
        "daily_transit": daily_transit_json,
        "daily_transit_to_natal_aspects": filtered_aspects,
        "daily_summary_source": daily_summary,
        "daily_house_focus": house_focus,
        "long_term_background": long_term,
        "daily_trigger_to_long_term_transit": build_daily_triggers(filtered_aspects, long_term),
        "data_validity": validity,
    }

    natal_hash = hashlib.sha256(
        json.dumps(natal_summary["natal_points"], sort_keys=True, ensure_ascii=False).encode()
    ).hexdigest()
    dt_hash = daily_transit_json.get("source_hash", "")
    doc["source_hash"] = composite_source_hash(natal_hash, dt_hash, doc)
    return doc
