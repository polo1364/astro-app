"""Multi-timepoint daily transit ephemeris for personal horoscope."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.services.daily_constants import PLANET_KEYS, REFERENCE_TIMES
from app.services.daily_ephemeris import to_julian_day, _calc_planet_at_jd, _planet_entry


def canonical_transit_hash(data: dict[str, Any]) -> str:
    payload = {k: v for k, v in data.items() if k != "source_hash"}
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_daily_transit_json(date: str, timezone: str) -> dict[str, Any]:
    """Global daily transit positions at 00:00 / 12:00 / 23:59 (local tz)."""
    snapshots: dict[str, dict[str, dict[str, Any]]] = {}

    for ref_time in REFERENCE_TIMES:
        jd, _ = to_julian_day(date, ref_time, timezone)
        snapshots[ref_time] = {}
        for key in PLANET_KEYS:
            lon, retro = _calc_planet_at_jd(key, jd)
            snapshots[ref_time][key] = _planet_entry(lon, retro)

    midday = snapshots["12:00:00"]
    planets: dict[str, Any] = {}
    for key in PLANET_KEYS:
        if key == "moon":
            planets[key] = {
                "start": snapshots["00:00:00"]["moon"],
                "midday": snapshots["12:00:00"]["moon"],
                "end": snapshots["23:59:59"]["moon"],
            }
        else:
            planets[key] = midday[key]

    doc = {
        "date": date,
        "timezone": timezone,
        "type": "daily_transit_multi_time",
        "ephemeris_engine": "swiss_ephemeris",
        "planets": planets,
        "reference_times": list(REFERENCE_TIMES),
    }
    doc["source_hash"] = canonical_transit_hash(doc)
    return doc
