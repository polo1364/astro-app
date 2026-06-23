"""Assemble full daily_horoscope_json source document."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.services.daily_aspects import attach_aspects_to_daily_sky
from app.services.daily_ephemeris import compute_daily_sky
from app.services.daily_sign_houses import compute_sign_sources


def canonical_json_hash(data: dict[str, Any]) -> str:
    raw = json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_daily_horoscope_source(
    date: str,
    timezone: str = "Asia/Taipei",
) -> dict[str, Any]:
    sky_raw = compute_daily_sky(date, timezone)
    daily_sky = attach_aspects_to_daily_sky(sky_raw)
    sign_sources = compute_sign_sources(daily_sky)

    doc = {
        "date": date,
        "timezone": timezone,
        "type": "public_12_sign_daily_horoscope",
        "ephemeris_engine": "swiss_ephemeris",
        "zodiac_mode": "tropical",
        "house_method": "whole_sign_solar_houses",
        "daily_sky": {
            "planets": daily_sky["planets"],
            "major_aspects": daily_sky["major_aspects"],
            "moon_events": daily_sky["moon_events"],
        },
        "sign_horoscopes_source": sign_sources,
    }
    doc["source_json_hash"] = canonical_json_hash(doc)
    return doc


def sky_summary_from_source(source: dict[str, Any]) -> dict[str, Any]:
    sky = source["daily_sky"]
    planets = sky["planets"]
    return {
        "sun_sign": planets["sun"]["sign"],
        "moon_sign": planets["moon"]["sign"],
        "moon_events": sky.get("moon_events", []),
        "major_aspects_count": len(sky.get("major_aspects", [])),
    }
