"""Scan slow transit aspects for active period windows (simplified daily step)."""

import swisseph as swe

from app.services.transit_orb_profiles import max_orb_for

ASPECTS_SCAN = [
    ("合相", 0),
    ("四分", 90),
    ("對分", 180),
    ("三分", 120),
]

SLOW_IDS = {
    "土星": swe.SATURN,
    "天王星": swe.URANUS,
    "海王星": swe.NEPTUNE,
    "冥王星": swe.PLUTO,
}
IMPORTANT_NATAL = ("太陽", "月亮", "上升", "中天")


def _angular_distance(lon_a: float, lon_b: float) -> float:
    diff = abs(lon_a - lon_b)
    return 360 - diff if diff > 180 else diff


def _transit_jd(date_str: str, tz_name: str) -> float:
    from datetime import datetime
    from zoneinfo import ZoneInfo

    dt_naive = datetime.strptime(f"{date_str} 12:00", "%Y-%m-%d %H:%M")
    dt_local = dt_naive.replace(tzinfo=ZoneInfo(tz_name))
    utc_dt = dt_local.astimezone(ZoneInfo("UTC"))
    return swe.julday(
        utc_dt.year,
        utc_dt.month,
        utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0,
    )


def _find_exact_dates(
    jd_start: float,
    jd_end: float,
    pid: int,
    n_lon: float,
    asp_angle: float,
    orb_limit: float,
) -> list[str]:
    exacts: list[str] = []
    step = 1.0
    jd = jd_start
    prev_orb: float | None = None
    while jd <= jd_end:
        pos, _ = swe.calc_ut(jd, pid, swe.FLG_SWIEPH)
        t_lon = pos[0] % 360
        diff = _angular_distance(t_lon, n_lon)
        orb = abs(diff - asp_angle)
        if orb <= orb_limit and prev_orb is not None and prev_orb > orb_limit:
            y, m, d, _ = swe.revjul(jd)
            exacts.append(f"{int(y):04d}-{int(m):02d}-{int(d):02d}")
        prev_orb = orb
        jd += step
    return exacts


def compute_active_periods(
    *,
    birth_date: str,
    birth_time: str,
    tz_name: str,
    lat: float,
    lng: float,
    transit_date: str,
    natal_lons: dict[str, float],
    house_system: str = "Placidus",
) -> list[dict]:
    del birth_date, birth_time, lat, lng, house_system
    results: list[dict] = []

    center_jd = _transit_jd(transit_date, tz_name)
    window_days = 120
    jd_start = center_jd - window_days
    jd_end = center_jd + window_days

    targets = {k: natal_lons[k] for k in IMPORTANT_NATAL if k in natal_lons}

    for t_name, pid in SLOW_IDS.items():
        for n_name, n_lon in targets.items():
            max_o = max_orb_for(t_name, n_name)
            for asp_name, angle in ASPECTS_SCAN:
                exacts = _find_exact_dates(jd_start, jd_end, pid, n_lon, angle, max_o)
                if not exacts:
                    continue
                y0, m0, d0, _ = swe.revjul(jd_start)
                y1, m1, d1, _ = swe.revjul(jd_end)
                results.append({
                    "transit_planet": t_name,
                    "natal_point": n_name,
                    "aspect": asp_name,
                    "start_date": f"{int(y0):04d}-{int(m0):02d}-{int(d0):02d}",
                    "exact_dates": exacts[:5],
                    "end_date": f"{int(y1):04d}-{int(m1):02d}-{int(d1):02d}",
                })

    return results[:12]
