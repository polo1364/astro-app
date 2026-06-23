"""Wrapper around calculate_transit for personal daily aspects + moon triple scan."""

from __future__ import annotations

from typing import Any

import swisseph as swe

from app.services.daily_ephemeris import to_julian_day
from app.services.ephemeris import ASPECTS, HOUSE_SYSTEMS, PLANETS, _angular_distance, _to_jd, calculate_transit
from app.services.personal_daily_normalize import normalize_aspect_record
from app.services.personal_daily_orb_profiles import (
    passes_personal_orb,
    personal_priority,
    priority_rank_personal,
)

MOON_TIME_LABELS = {
    "00:00:00": "00:00",
    "12:00:00": "12:00",
    "23:59:59": "23:59",
}

NATAL_TARGETS_WITH_TIME = ("太陽", "月亮", "水星", "金星", "火星", "上升", "中天")
NATAL_TARGETS_NO_TIME = ("太陽", "月亮", "水星", "金星", "火星")


def _orb_str_to_deg(orb: str | float) -> float:
    if isinstance(orb, (int, float)):
        return float(orb)
    s = str(orb).replace("′", "'").replace("°", " ")
    parts = s.split()
    d = float(parts[0]) if parts else 0.0
    if len(parts) > 1:
        d += float(parts[1].replace("'", "")) / 60
    return round(d, 2)


def _moon_aspects_at_time(
    *,
    transit_date: str,
    ref_time: str,
    timezone: str,
    natal_lons: dict[str, float],
    has_birth_time: bool,
) -> list[dict[str, Any]]:
    jd, _ = to_julian_day(transit_date, ref_time, timezone)
    pos, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH | swe.FLG_SPEED)
    moon_lon = pos[0] % 360
    targets = NATAL_TARGETS_WITH_TIME if has_birth_time else NATAL_TARGETS_NO_TIME
    results: list[dict[str, Any]] = []
    for n_name in targets:
        if n_name not in natal_lons:
            continue
        n_lon = natal_lons[n_name]
        for asp_name, angle, _ in ASPECTS:
            orb = abs(_angular_distance(moon_lon, n_lon) - angle)
            if not passes_personal_orb("月亮", n_name, orb):
                continue
            rec = normalize_aspect_record(
                transit_planet="月亮",
                natal_point=n_name,
                aspect=asp_name,
                orb=orb,
                exact_time=MOON_TIME_LABELS.get(ref_time),
                priority=personal_priority("月亮", n_name, orb),
            )
            results.append(rec)
    return results


def build_personal_aspects(
    *,
    name: str,
    birth_date: str,
    birth_time: str | None,
    timezone: str,
    lat: float,
    lng: float,
    house_system: str,
    location: str,
    transit_date: str,
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Call calculate_transit once at 12:00; refine moon with triple timepoints."""
    transit = calculate_transit(
        name=name,
        date=birth_date,
        time=birth_time,
        tz_name=timezone,
        lat=lat,
        lng=lng,
        house_system=house_system,
        transit_date=transit_date,
        location=location,
        transit_time="12:00",
    )
    has_birth_time = bool(birth_time and str(birth_time).strip())
    natal_lons: dict[str, float] = {}
    jd_n, _, _, _ = _to_jd(birth_date, birth_time if has_birth_time else "12:00", timezone)
    for pid, pname in PLANETS:
        pos, _ = swe.calc_ut(jd_n, pid, swe.FLG_SWIEPH)
        natal_lons[pname] = pos[0] % 360
    if has_birth_time:
        hs = HOUSE_SYSTEMS.get(house_system, b"P")
        cusps, ascmc = swe.houses(jd_n, lat, lng, hs)
        natal_lons["上升"] = ascmc[0] % 360
        natal_lons["中天"] = ascmc[1] % 360

    moon_by_target: dict[tuple, dict] = {}
    for ref_time in ("00:00:00", "12:00:00", "23:59:59"):
        for rec in _moon_aspects_at_time(
            transit_date=transit_date,
            ref_time=ref_time,
            timezone=timezone,
            natal_lons=natal_lons,
            has_birth_time=has_birth_time,
        ):
            key = (rec["transit_planet"], rec["natal_point"], rec["aspect"])
            prev = moon_by_target.get(key)
            if prev is None or rec["orb"] < prev["orb"]:
                moon_by_target[key] = rec

    aspects: list[dict[str, Any]] = []
    for a in transit.get("transit_aspects") or []:
        t_name = a.get("transit_planet", "")
        if t_name == "月亮":
            continue
        n_name = a.get("natal_planet") or a.get("natal_point", "")
        orb_deg = a.get("orb_deg")
        if orb_deg is None:
            orb_deg = _orb_str_to_deg(a.get("orb", "0"))
        if not passes_personal_orb(t_name, n_name, orb_deg):
            continue
        aspects.append(
            normalize_aspect_record(
                transit_planet=t_name,
                natal_point=n_name,
                aspect=a.get("type", ""),
                orb=orb_deg,
                exact_time=None,
                priority=a.get("priority", personal_priority(t_name, n_name, orb_deg)),
                applying=a.get("applying"),
                strength=a.get("strength"),
            )
        )

    for rec in moon_by_target.values():
        aspects.append(rec)

    aspects.sort(
        key=lambda x: (
            priority_rank_personal(x.get("priority", "medium")),
            x.get("orb", 99),
        )
    )
    return transit, aspects
