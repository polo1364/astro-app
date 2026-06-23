from datetime import datetime
from zoneinfo import ZoneInfo

import swisseph as swe

from app.data.astrology_kb import PLANET_ZH_TO_KEY, SIGN_EN
from app.services.chart_json import build_chart_json
from app.services.chart_patterns import detect_chart_shape, detect_patterns
from app.services.natal_analysis import build_rule_analysis
from app.services.transit_analysis import build_transit_analysis
from app.services.transit_chart_json import build_transit_chart_json
from app.services.transit_orb_profiles import (
    ASPECT_EN,
    max_orb_for,
    aspect_priority,
    priority_rank,
)
from app.services.transit_periods import compute_active_periods

SIGNS_ZH = ["牡羊", "金牛", "雙子", "巨蟹", "獅子", "處女", "天秤", "天蠍", "射手", "摩羯", "水瓶", "雙魚"]
PLANETS = [
    (swe.SUN, "太陽"),
    (swe.MOON, "月亮"),
    (swe.MERCURY, "水星"),
    (swe.VENUS, "金星"),
    (swe.MARS, "火星"),
    (swe.JUPITER, "木星"),
    (swe.SATURN, "土星"),
    (swe.URANUS, "天王星"),
    (swe.NEPTUNE, "海王星"),
    (swe.PLUTO, "冥王星"),
]
ASPECTS = [
    ("合相", 0, 8),
    ("六分", 60, 6),
    ("四分", 90, 7),
    ("三分", 120, 7),
    ("對分", 180, 8),
]
HOUSE_SYSTEMS = {
    "Placidus": b"P",
    "Whole Sign": b"W",
    "Koch": b"K",
}
ELEMENT_MAP = {0: "火", 1: "土", 2: "風", 3: "水"}
MODALITY_MAP = {0: "開創", 1: "固定", 2: "變動"}


def _format_degree(lon: float) -> str:
    deg_in_sign = lon % 30
    d = int(deg_in_sign)
    m = int((deg_in_sign - d) * 60)
    return f"{d}°{m:02d}′"


def _sign_name(lon: float) -> str:
    return SIGNS_ZH[int(lon // 30) % 12]


def _to_jd(
    date_str: str,
    time_str: str | None,
    tz_name: str,
) -> tuple[float, str, datetime, bool]:
    has_time = bool(time_str and str(time_str).strip())
    calc_time = time_str.strip() if has_time else "12:00"
    dt_naive = datetime.strptime(f"{date_str} {calc_time}", "%Y-%m-%d %H:%M")
    try:
        tz = ZoneInfo(tz_name)
    except Exception as exc:
        raise ValueError(f"未知或無效時區：{tz_name}") from exc
    dt_local = dt_naive.replace(tzinfo=tz)
    utc_dt = dt_local.astimezone(ZoneInfo("UTC"))
    utc_iso = utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    utc_str = utc_dt.strftime("%Y-%m-%d %H:%M:%S UTC")
    jd = swe.julday(
        utc_dt.year,
        utc_dt.month,
        utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0,
    )
    return jd, utc_str, utc_dt, has_time


def _aspect_strength(orb: float, max_orb: float) -> str:
    ratio = orb / max_orb if max_orb else 1
    if ratio <= 0.3:
        return "強"
    if ratio <= 0.7:
        return "中"
    return "弱"


def _calc_aspects(
    positions: dict[str, float],
    moon_uncertain: bool = False,
) -> list[dict]:
    result = []
    names = list(positions.keys())
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            diff = abs(positions[a] - positions[b])
            if diff > 180:
                diff = 360 - diff
            for asp_name, angle, max_orb in ASPECTS:
                orb = abs(diff - angle)
                if orb <= max_orb:
                    entry = {
                        "planet_a": a,
                        "type": asp_name,
                        "planet_b": b,
                        "orb": f"{int(orb)}°{int((orb % 1) * 60):02d}′",
                        "strength": _aspect_strength(orb, max_orb),
                    }
                    if moon_uncertain and ("月亮" in (a, b)):
                        entry["moon_uncertain"] = True
                    result.append(entry)
    return result


def _element_stats(sign_indices: list[int]) -> list[dict]:
    counts = {"火": 0, "土": 0, "風": 0, "水": 0}
    for idx in sign_indices:
        counts[ELEMENT_MAP[idx % 4]] += 1
    total = sum(counts.values()) or 1
    return [
        {"element": k, "count": v, "percent": round(v / total * 100)}
        for k, v in counts.items()
    ]


def _modality_counts(sign_indices: list[int]) -> dict[str, int]:
    counts = {"開創": 0, "固定": 0, "變動": 0}
    for idx in sign_indices:
        counts[MODALITY_MAP[idx % 3]] += 1
    return counts


def _planet_house(lon: float, cusps: tuple) -> int:
    for i in range(12):
        c1 = cusps[i]
        c2 = cusps[(i + 1) % 12]
        if c1 <= c2:
            if c1 <= lon < c2:
                return i + 1
        else:
            if lon >= c1 or lon < c2:
                return i + 1
    return 1


def calculate_natal(
    name: str,
    date: str,
    time: str | None,
    tz_name: str,
    lat: float,
    lng: float,
    house_system: str = "Placidus",
    location: str = "",
) -> dict:
    jd, utc_str, utc_dt, has_time = _to_jd(date, time, tz_name)
    hs = HOUSE_SYSTEMS.get(house_system, b"P")

    houses: list[dict] = []
    cusps = None
    ascmc = None

    if has_time:
        cusps, ascmc = swe.houses(jd, lat, lng, hs)
        for i in range(12):
            cusp_lon = cusps[i]
            houses.append({
                "number": i + 1,
                "sign": _sign_name(cusp_lon),
                "degree": _format_degree(cusp_lon),
                "longitude": round(cusp_lon % 360, 4),
            })

    planets = []
    positions: dict[str, float] = {}
    sign_indices: list[int] = []
    house_numbers: list[int] = []
    retro_count = 0

    for pid, pname in PLANETS:
        pos, _ = swe.calc_ut(jd, pid, swe.FLG_SWIEPH | swe.FLG_SPEED)
        lon = pos[0] % 360
        speed = pos[3]
        is_retro = speed < 0
        if is_retro:
            retro_count += 1
        sign_idx = int(lon // 30) % 12
        sign_indices.append(sign_idx)
        positions[pname] = lon

        entry = {
            "name": pname,
            "sign": _sign_name(lon),
            "degree": _format_degree(lon),
            "longitude": round(lon, 4),
            "retrograde": is_retro,
        }
        if has_time and cusps is not None:
            house_num = _planet_house(lon, cusps)
            entry["house"] = house_num
            house_numbers.append(house_num)
        else:
            entry["house"] = 0
        planets.append(entry)

    if has_time and ascmc is not None:
        asc_lon = ascmc[0] % 360
        mc_lon = ascmc[1] % 360
        positions["上升"] = asc_lon
        positions["中天"] = mc_lon
        planets.append({
            "name": "上升",
            "sign": _sign_name(asc_lon),
            "degree": _format_degree(asc_lon),
            "longitude": round(asc_lon, 4),
            "house": 1,
            "retrograde": False,
        })
        planets.append({
            "name": "中天",
            "sign": _sign_name(mc_lon),
            "degree": _format_degree(mc_lon),
            "longitude": round(mc_lon, 4),
            "house": 10,
            "retrograde": False,
        })

    moon_uncertain = not has_time
    aspect_positions = {k: v for k, v in positions.items() if k not in ("上升", "中天")}
    aspects = _calc_aspects(aspect_positions, moon_uncertain=moon_uncertain)
    elements = _element_stats(sign_indices)
    mod_counts = _modality_counts(sign_indices)
    dominant_element = max(elements, key=lambda e: e["count"])["element"]
    modalities = [MODALITY_MAP[i % 3] for i in sign_indices]
    dom_mod = max(set(modalities), key=modalities.count) if modalities else "固定"
    chart_shape = detect_chart_shape(house_numbers) if has_time else "未知"

    try:
        tz_display = f"{tz_name} ({utc_dt.astimezone(ZoneInfo(tz_name)).strftime('%z')})"
    except Exception:
        tz_display = tz_name

    raw = {
        "meta": {
            "name": name,
            "birth_date": date,
            "birth_time": time if has_time else "不詳",
            "timezone": tz_display,
            "latitude": f"{abs(lat):.4f}°{'N' if lat >= 0 else 'S'}",
            "longitude": f"{abs(lng):.4f}°{'E' if lng >= 0 else 'W'}",
            "house_system": house_system,
            "utc": utc_str,
            "utc_iso": utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "julian_day": f"{jd:.3f}",
            "engine": "Swiss Ephemeris 2.10",
            "has_birth_time": has_time,
            "location": location,
        },
        "planets": planets,
        "aspects": aspects,
        "houses": houses,
        "elements": elements,
        "patterns": detect_patterns(aspects),
        "stats": {
            "dominant_element": dominant_element,
            "dominant_modality": dom_mod,
            "chart_shape": chart_shape,
            "retrograde_count": retro_count,
            "modality_cardinal": mod_counts["開創"],
            "modality_fixed": mod_counts["固定"],
            "modality_mutable": mod_counts["變動"],
        },
    }

    chart_json = build_chart_json(
        raw,
        date=date,
        time=time if has_time else None,
        location=location,
        timezone=tz_name,
        utc_iso=utc_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        house_system=house_system,
        lat=lat,
        lng=lng,
    )
    analysis = build_rule_analysis(chart_json)

    return {
        **raw,
        "chart_json": chart_json,
        "analysis": analysis,
    }


def _angular_distance(lon_a: float, lon_b: float) -> float:
    diff = abs(lon_a - lon_b)
    return 360 - diff if diff > 180 else diff


def _transit_applying(
    t_lon: float,
    n_lon: float,
    t_speed: float,
    asp_angle: float,
) -> bool:
    diff = _angular_distance(t_lon, n_lon)
    orb_now = abs(diff - asp_angle)
    t_future = (t_lon + t_speed * 0.5) % 360
    diff_f = _angular_distance(t_future, n_lon)
    orb_future = abs(diff_f - asp_angle)
    return orb_future < orb_now


def _sign_en(lon: float) -> str:
    return SIGN_EN.get(_sign_name(lon), _sign_name(lon))


def _degree_num(lon: float) -> float:
    return round(lon % 30, 2)


def calculate_transit(
    name: str,
    date: str,
    time: str | None,
    tz_name: str,
    lat: float,
    lng: float,
    house_system: str,
    transit_date: str,
    location: str = "",
    transit_time: str | None = None,
) -> dict:
    natal = calculate_natal(name, date, time, tz_name, lat, lng, house_system, location)
    has_birth_time = bool(time and str(time).strip())
    has_transit_time = bool(transit_time and str(transit_time).strip())
    calc_transit_time = transit_time.strip() if has_transit_time else "12:00"

    jd_t, utc_str_t, utc_dt_t, _ = _to_jd(transit_date, calc_transit_time, tz_name)
    jd_n, _, _, _ = _to_jd(date, time if has_birth_time else "12:00", tz_name)

    natal_lons: dict[str, float] = {}
    for pid, pname in PLANETS:
        pos, _ = swe.calc_ut(jd_n, pid, swe.FLG_SWIEPH)
        natal_lons[pname] = pos[0] % 360

    natal_cusps = None
    if has_birth_time:
        hs = HOUSE_SYSTEMS.get(house_system, b"P")
        cusps, ascmc = swe.houses(jd_n, lat, lng, hs)
        natal_cusps = cusps
        natal_lons["上升"] = ascmc[0] % 360
        natal_lons["中天"] = ascmc[1] % 360

    transit_speeds: dict[str, float] = {}
    transit_planets = []
    transit_lons: dict[str, float] = {}
    for pid, pname in PLANETS:
        pos, _ = swe.calc_ut(jd_t, pid, swe.FLG_SWIEPH | swe.FLG_SPEED)
        lon = pos[0] % 360
        speed = pos[3]
        is_retro = speed < 0
        transit_lons[pname] = lon
        transit_speeds[pname] = speed

        entry = {
            "name": pname,
            "name_key": PLANET_ZH_TO_KEY.get(pname, pname),
            "sign": _sign_name(lon),
            "sign_en": _sign_en(lon),
            "degree": _format_degree(lon),
            "degree_num": _degree_num(lon),
            "longitude": round(lon, 4),
            "retrograde": is_retro,
            "natal_house": None,
        }
        if has_birth_time and natal_cusps is not None:
            entry["natal_house"] = _planet_house(lon, natal_cusps)
        transit_planets.append(entry)

    natal_points: dict = {}
    cj = natal.get("chart_json", {})
    for key, planet in (cj.get("planets") or {}).items():
        natal_points[key] = {
            "sign": planet.get("sign_en", ""),
            "sign_zh": planet.get("sign_zh", ""),
            "degree": planet.get("degree_in_sign", 0),
            "house": planet.get("house"),
        }
    if has_birth_time:
        angles = cj.get("angles") or {}
        if angles.get("ascendant"):
            asc = angles["ascendant"]
            natal_points["asc"] = {
                "sign": asc.get("sign_en", ""),
                "sign_zh": asc.get("sign_zh", ""),
                "degree": asc.get("degree_in_sign", 0),
            }
        if angles.get("midheaven"):
            mc = angles["midheaven"]
            natal_points["mc"] = {
                "sign": mc.get("sign_en", ""),
                "sign_zh": mc.get("sign_zh", ""),
                "degree": mc.get("degree_in_sign", 0),
            }

    natal_targets: dict[str, str] = {}
    for _pid, pname in PLANETS:
        natal_targets[pname] = pname
    if has_birth_time:
        natal_targets["上升"] = "上升"
        natal_targets["中天"] = "中天"

    transit_aspects: list[dict] = []
    for t_name, t_lon in transit_lons.items():
        t_speed = transit_speeds[t_name]
        for n_name in natal_targets.values():
            n_lon = natal_lons[n_name]
            diff = _angular_distance(t_lon, n_lon)
            for asp_name, angle, _default_orb in ASPECTS:
                orb = abs(diff - angle)
                max_o = max_orb_for(t_name, n_name)
                if orb > max_o:
                    continue
                applying = _transit_applying(t_lon, n_lon, t_speed, angle)
                priority = aspect_priority(t_name, n_name, orb)
                transit_aspects.append({
                    "transit_planet": t_name,
                    "transit_planet_key": PLANET_ZH_TO_KEY.get(t_name, t_name),
                    "type": asp_name,
                    "natal_planet": n_name,
                    "natal_point": n_name,
                    "natal_point_key": (
                        "asc" if n_name == "上升"
                        else "mc" if n_name == "中天"
                        else PLANET_ZH_TO_KEY.get(n_name, n_name)
                    ),
                    "orb": f"{int(orb)}°{int((orb % 1) * 60):02d}′",
                    "orb_deg": round(orb, 2),
                    "strength": _aspect_strength(orb, max_o),
                    "applying": applying,
                    "priority": priority,
                    "in_primary": priority in ("high", "medium"),
                })

    transit_aspects.sort(
        key=lambda a: (
            priority_rank(a["priority"]),
            {"強": 0, "中": 1, "弱": 2}[a["strength"]],
            a["orb_deg"],
        )
    )

    primary = [a for a in transit_aspects if a.get("in_primary")]
    appendix = [a for a in transit_aspects if not a.get("in_primary")]

    try:
        tz_local = ZoneInfo(tz_name)
        dt_local_birth = datetime.strptime(
            f"{date} {time if has_birth_time else '12:00'}", "%Y-%m-%d %H:%M"
        ).replace(tzinfo=tz_local)
        birth_utc = dt_local_birth.astimezone(ZoneInfo("UTC"))
        birth_local_iso = dt_local_birth.isoformat()
    except Exception:
        birth_utc = utc_dt_t
        birth_local_iso = f"{date}T12:00:00"

    birth_data = {
        "date": date,
        "time_local": time if has_birth_time else None,
        "timezone_id": tz_name,
        "datetime_local": birth_local_iso,
        "datetime_utc": birth_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "place_name": location or f"{lat},{lng}",
        "lat": lat,
        "lon": lng,
        "has_birth_time": has_birth_time,
    }

    transit_data = {
        "date": transit_date,
        "time_local": calc_transit_time if has_transit_time else None,
        "timezone_id": tz_name,
        "datetime_local": utc_dt_t.astimezone(ZoneInfo(tz_name)).isoformat(),
        "datetime_utc": utc_dt_t.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "place_name": location or f"{lat},{lng}",
        "lat": lat,
        "lon": lng,
        "has_transit_time": has_transit_time,
        "can_calculate_natal_houses": has_birth_time,
        "can_calculate_natal_angles": has_birth_time,
    }

    active_periods = []
    if has_birth_time:
        try:
            active_periods = compute_active_periods(
                birth_date=date,
                birth_time=time,
                tz_name=tz_name,
                lat=lat,
                lng=lng,
                transit_date=transit_date,
                natal_lons=natal_lons,
                house_system=house_system,
            )
        except Exception:
            active_periods = []

    transit_chart_json = build_transit_chart_json(
        natal_chart_json=cj,
        birth_data=birth_data,
        transit_data=transit_data,
        natal_points=natal_points,
        transit_planets=transit_planets,
        transit_to_natal_aspects=transit_aspects,
        active_periods=active_periods,
        house_system=house_system,
    )
    analysis = build_transit_analysis(transit_chart_json)

    return {
        "natal": natal,
        "transit_date": transit_date,
        "transit_time": calc_transit_time if has_transit_time else None,
        "transit_planets": transit_planets,
        "transit_aspects": primary,
        "transit_aspects_appendix": appendix,
        "transit_chart_json": transit_chart_json,
        "analysis": analysis,
    }
