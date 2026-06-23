"""Compute major aspects for a given day."""

from __future__ import annotations

from typing import Any

from app.services.daily_constants import PLANET_KEYS
from app.services.daily_ephemeris import _calc_planet_at_jd, iter_time_samples, to_julian_day
from app.services.daily_themes import theme_for_aspect

ASPECT_DEFS = [
    ("conjunction", 0),
    ("sextile", 60),
    ("square", 90),
    ("trine", 120),
    ("opposition", 180),
]

FAST_PLANETS = frozenset({"sun", "mercury", "venus", "mars"})


def max_orb_for_pair(p1: str, p2: str) -> float:
    if "moon" in (p1, p2):
        return 3.0
    if p1 in FAST_PLANETS and p2 in FAST_PLANETS:
        return 2.0
    return 2.0


def _angular_distance(a: float, b: float) -> float:
    diff = abs(a - b) % 360
    return diff if diff <= 180 else 360 - diff


def _aspect_for_distance(dist: float, max_orb: float) -> tuple[str, float] | None:
    best: tuple[str, float] | None = None
    for name, angle in ASPECT_DEFS:
        orb = abs(dist - angle)
        if orb <= max_orb and (best is None or orb < best[1]):
            best = (name, orb)
    return best


def compute_major_aspects(daily_sky: dict[str, Any]) -> list[dict[str, Any]]:
    date_str = daily_sky["date"]
    tz_name = daily_sky["timezone"]
    samples = iter_time_samples(date_str, tz_name, step_minutes=30)

    pair_best: dict[tuple[str, str], dict[str, Any]] = {}

    for t_str, jd in samples:
        lons: dict[str, float] = {}
        for key in PLANET_KEYS:
            lon, _ = _calc_planet_at_jd(key, jd)
            lons[key] = lon

        for i, p1 in enumerate(PLANET_KEYS):
            for p2 in PLANET_KEYS[i + 1:]:
                max_orb = max_orb_for_pair(p1, p2)
                dist = _angular_distance(lons[p1], lons[p2])
                match = _aspect_for_distance(dist, max_orb)
                if not match:
                    continue
                aspect_name, orb = match
                pair_key = (p1, p2)
                prev = pair_best.get(pair_key)
                if prev is None or orb < prev["orb"]:
                    _, dt_local = to_julian_day(date_str, t_str, tz_name)
                    theme = theme_for_aspect(p1, p2, aspect_name)
                    pair_best[pair_key] = {
                        "planet1": p1,
                        "planet2": p2,
                        "aspect": aspect_name,
                        "orb": round(orb, 2),
                        "exact_time": dt_local.isoformat(),
                        "theme": theme or "general_aspect",
                    }

    return sorted(pair_best.values(), key=lambda x: x["orb"])


def attach_aspects_to_daily_sky(daily_sky: dict[str, Any]) -> dict[str, Any]:
    aspects = compute_major_aspects(daily_sky)
    out = dict(daily_sky)
    out["major_aspects"] = aspects
    out.pop("snapshots", None)
    return out
