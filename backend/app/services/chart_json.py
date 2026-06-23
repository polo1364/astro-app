import json
from app.data.astrology_kb import (
    CHART_RULER,
    PLANET_KEY_TO_ZH,
    PLANET_ZH_TO_KEY,
    SIGN_EN,
)
from app.services.chart_validity import build_chart_validity

ASPECT_EN = {
    "合相": "conjunction",
    "六分": "sextile",
    "四分": "square",
    "三分": "trine",
    "對分": "opposition",
}

STRENGTH_EN = {"強": "strong", "中": "medium", "弱": "weak"}


def _parse_degree(deg_str: str) -> float:
    """Parse '21°14′' to absolute degree within sign."""
    deg_str = deg_str.replace("′", "'").replace("°", " ")
    parts = deg_str.split()
    d = float(parts[0]) if parts else 0
    m = 0.0
    if len(parts) > 1:
        m = float(parts[1].replace("'", ""))
    return round(d + m / 60, 2)


def _sign_en(sign_zh: str) -> str:
    return SIGN_EN.get(sign_zh, sign_zh)


def build_chart_json(
    raw: dict,
    *,
    date: str,
    time: str | None,
    location: str,
    timezone: str,
    utc_iso: str,
    house_system: str,
    lat: float,
    lng: float,
) -> dict:
    has_time = bool(time and str(time).strip())
    has_location = lat is not None and lng is not None

    validity = build_chart_validity(
        has_birth_time=has_time,
        has_birth_location=has_location,
        timezone=timezone,
    )

    planets_out: dict = {}
    for p in raw.get("planets", []):
        name = p["name"]
        if name in ("上升", "中天"):
            continue
        key = PLANET_ZH_TO_KEY.get(name)
        if not key:
            continue
        entry = {
            "sign": _sign_en(p["sign"]),
            "sign_zh": p["sign"],
            "degree": _parse_degree(p["degree"]),
            "degree_display": p["degree"],
            "retrograde": p.get("retrograde", False),
        }
        if validity["can_calculate_houses"] and p.get("house") is not None:
            entry["house"] = p["house"]
        else:
            entry["house"] = None
        planets_out[key] = entry

    angles = {}
    if validity["can_calculate_ascendant"]:
        for p in raw.get("planets", []):
            if p["name"] == "上升":
                angles["ascendant"] = {
                    "sign": _sign_en(p["sign"]),
                    "sign_zh": p["sign"],
                    "degree": _parse_degree(p["degree"]),
                }
            elif p["name"] == "中天":
                angles["mc"] = {
                    "sign": _sign_en(p["sign"]),
                    "sign_zh": p["sign"],
                    "degree": _parse_degree(p["degree"]),
                }
        if "ascendant" in angles:
            asc_sign = next(
                (p["sign"] for p in raw.get("planets", []) if p["name"] == "上升"),
                None,
            )
            if asc_sign:
                ruler_zh = CHART_RULER.get(asc_sign)
                if ruler_zh:
                    ruler_key = PLANET_ZH_TO_KEY.get(ruler_zh)
                    if ruler_key and ruler_key in planets_out:
                        angles["chart_ruler"] = {
                            "planet": ruler_key,
                            "planet_zh": ruler_zh,
                            "sign": planets_out[ruler_key]["sign"],
                            "sign_zh": planets_out[ruler_key]["sign_zh"],
                            "house": planets_out[ruler_key].get("house"),
                        }

    aspects_out = []
    moon_uncertain = validity.get("moon_uncertain", False)
    for a in raw.get("aspects", []):
        p1 = PLANET_ZH_TO_KEY.get(a["planet_a"])
        p2 = PLANET_ZH_TO_KEY.get(a["planet_b"])
        if not p1 or not p2:
            continue
        orb_parts = a["orb"].replace("′", "'").replace("°", " ").split()
        orb_val = float(orb_parts[0]) if orb_parts else 0
        if len(orb_parts) > 1:
            orb_val += float(orb_parts[1].replace("'", "")) / 60
        asp = {
            "planet1": p1,
            "planet1_zh": a["planet_a"],
            "planet2": p2,
            "planet2_zh": a["planet_b"],
            "aspect": ASPECT_EN.get(a["type"], a["type"]),
            "aspect_zh": a["type"],
            "orb": round(orb_val, 2),
            "strength": STRENGTH_EN.get(a["strength"], a["strength"]),
            "strength_zh": a["strength"],
        }
        if moon_uncertain and ("moon" in (p1, p2)):
            asp["moon_uncertain"] = True
        aspects_out.append(asp)

    elem_map = {"火": "fire", "土": "earth", "風": "air", "水": "water"}
    mod_map = {"開創": "cardinal", "固定": "fixed", "變動": "mutable"}
    element_balance = {elem_map.get(e["element"], e["element"]): e["count"]
                       for e in raw.get("elements", [])}
    stats = raw.get("stats", {})
    modality_balance = {
        "cardinal": stats.get("modality_cardinal", 0),
        "fixed": stats.get("modality_fixed", 0),
        "mutable": stats.get("modality_mutable", 0),
    }

    return {
        "birth_data": {
            "date": date,
            "time": time if has_time else None,
            "location": location or f"{lat},{lng}",
            "timezone": timezone,
            "utc_time": utc_iso,
            "house_system": house_system,
            "latitude": lat,
            "longitude": lng,
        },
        "chart_validity": validity,
        "angles": angles if angles else None,
        "planets": planets_out,
        "aspects": aspects_out,
        "element_balance": element_balance,
        "modality_balance": modality_balance,
        "aspect_orbs": {
            "conjunction": 8, "sextile": 6, "square": 7, "trine": 7, "opposition": 8,
        },
    }
