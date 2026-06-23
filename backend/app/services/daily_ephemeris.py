"""Compute daily sky for public horoscope (multi-timepoint ephemeris)."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

import swisseph as swe

from app.services.daily_constants import PLANET_KEYS, REFERENCE_TIMES, SIGN_EN_NAMES

SWE_BODIES = {
    "sun": swe.SUN,
    "moon": swe.MOON,
    "mercury": swe.MERCURY,
    "venus": swe.VENUS,
    "mars": swe.MARS,
    "jupiter": swe.JUPITER,
    "saturn": swe.SATURN,
    "uranus": swe.URANUS,
    "neptune": swe.NEPTUNE,
    "pluto": swe.PLUTO,
}


def to_julian_day(date_str: str, time_str: str, tz_name: str) -> tuple[float, datetime]:
    """Parse local date/time (HH:MM or HH:MM:SS) to JD and aware local datetime."""
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            dt_naive = datetime.strptime(f"{date_str} {time_str}", fmt)
            break
        except ValueError:
            continue
    else:
        raise ValueError(f"無法解析時間：{date_str} {time_str}")

    tz = ZoneInfo(tz_name)
    dt_local = dt_naive.replace(tzinfo=tz)
    utc_dt = dt_local.astimezone(ZoneInfo("UTC"))
    jd = swe.julday(
        utc_dt.year,
        utc_dt.month,
        utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0,
    )
    return jd, dt_local


def _sign_en_from_lon(lon: float) -> str:
    return SIGN_EN_NAMES[int(lon // 30) % 12]


def _degree_in_sign(lon: float) -> float:
    return round(lon % 30, 2)


def _calc_planet_at_jd(planet_key: str, jd: float) -> tuple[float, bool]:
    body = SWE_BODIES[planet_key]
    result, ret = swe.calc_ut(jd, body, swe.FLG_SPEED)
    if ret < 0:
        raise RuntimeError(f"Swiss Ephemeris error for {planet_key}: {ret}")
    lon = result[0] % 360
    speed = result[3]
    retrograde = speed < 0
    return lon, retrograde


def _planet_entry(lon: float, retrograde: bool) -> dict[str, Any]:
    return {
        "sign": _sign_en_from_lon(lon),
        "degree": _degree_in_sign(lon),
        "retrograde": retrograde,
        "longitude": round(lon, 4),
    }


def _find_moon_ingress(
    date_str: str,
    tz_name: str,
    start_time: str,
    end_time: str,
    from_sign: str,
    to_sign: str,
) -> str | None:
    """Binary-refine moon sign boundary between two local times."""
    start_dt = datetime.strptime(f"{date_str} {start_time}", "%Y-%m-%d %H:%M:%S")
    end_dt = datetime.strptime(f"{date_str} {end_time}", "%Y-%m-%d %H:%M:%S")
    tz = ZoneInfo(tz_name)
    start_dt = start_dt.replace(tzinfo=tz)
    end_dt = end_dt.replace(tzinfo=tz)

    lo = start_dt
    hi = end_dt
    while (hi - lo).total_seconds() > 60:
        mid = lo + (hi - lo) / 2
        mid_str = mid.strftime("%H:%M:%S")
        jd, _ = to_julian_day(date_str, mid_str, tz_name)
        lon, _ = _calc_planet_at_jd("moon", jd)
        sign = _sign_en_from_lon(lon)
        if sign == from_sign:
            lo = mid
        else:
            hi = mid

    exact = hi.astimezone(tz)
    return exact.isoformat()


def _build_moon_events(
    date_str: str,
    tz_name: str,
    moon_signs: dict[str, str],
) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    start_s = moon_signs["00:00:00"]
    mid_s = moon_signs["12:00:00"]
    end_s = moon_signs["23:59:59"]

    if start_s == mid_s == end_s:
        sign_id = start_s.lower()
        events.append({
            "event": f"moon_in_{sign_id}_all_day",
            "theme": f"moon_in_{sign_id}_all_day",
        })
        return events

    segments = [
        ("00:00:00", "12:00:00", start_s, mid_s),
        ("12:00:00", "23:59:59", mid_s, end_s),
    ]
    for t0, t1, s0, s1 in segments:
        if s0 != s1:
            exact = _find_moon_ingress(date_str, tz_name, t0, t1, s0, s1)
            to_id = s1.lower()
            events.append({
                "event": f"moon_enters_{to_id}",
                "from_sign": s0,
                "to_sign": s1,
                "exact_time": exact,
                "theme": "mood_shift",
            })

    return events


def compute_daily_sky(date: str, timezone: str = "Asia/Taipei") -> dict[str, Any]:
    """Return daily_sky dict: planets, major_aspects placeholder, moon_events."""
    snapshots: dict[str, dict[str, dict[str, Any]]] = {}
    moon_by_time: dict[str, str] = {}

    for ref_time in REFERENCE_TIMES:
        jd, _ = to_julian_day(date, ref_time, timezone)
        snapshots[ref_time] = {}
        for key in PLANET_KEYS:
            lon, retro = _calc_planet_at_jd(key, jd)
            snapshots[ref_time][key] = _planet_entry(lon, retro)
            if key == "moon":
                moon_by_time[ref_time] = _sign_en_from_lon(lon)

    noon = snapshots["12:00:00"]
    planets: dict[str, Any] = {}

    for key in PLANET_KEYS:
        if key == "moon":
            m0 = snapshots["00:00:00"]["moon"]
            m12 = snapshots["12:00:00"]["moon"]
            m_end = snapshots["23:59:59"]["moon"]
            planets["moon"] = {
                "sign": m12["sign"],
                "degree_start": m0["degree"],
                "degree_midday": m12["degree"],
                "degree_end": m_end["degree"],
                "retrograde": m12["retrograde"],
                "longitude": m12["longitude"],
            }
        else:
            planets[key] = {
                "sign": noon[key]["sign"],
                "degree": noon[key]["degree"],
                "retrograde": noon[key]["retrograde"],
                "longitude": noon[key]["longitude"],
            }

    moon_events = _build_moon_events(date, timezone, moon_by_time)

    return {
        "planets": planets,
        "snapshots": snapshots,
        "moon_events": moon_events,
        "reference_times": list(REFERENCE_TIMES),
        "timezone": timezone,
        "date": date,
    }


def iter_time_samples(
    date_str: str,
    tz_name: str,
    step_minutes: int = 30,
) -> list[tuple[str, float]]:
    """Yield (local_time_HH:MM:SS, jd) from 00:00 to 23:59:59."""
    tz = ZoneInfo(tz_name)
    start = datetime.strptime(f"{date_str} 00:00:00", "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz)
    end = datetime.strptime(f"{date_str} 23:59:59", "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz)
    samples: list[tuple[str, float]] = []
    cur = start
    while cur <= end:
        t_str = cur.strftime("%H:%M:%S")
        jd, _ = to_julian_day(date_str, t_str, tz_name)
        samples.append((t_str, jd))
        cur += timedelta(minutes=step_minutes)
    return samples
