from app.services.transit_orb_profiles import ASPECT_EN


def build_transit_validity(
    *,
    has_birth_time: bool,
    has_birth_location: bool,
    has_transit_time: bool,
    has_valid_timezone: bool = True,
) -> dict:
    can: list[str] = []
    cannot: list[str] = []

    if has_valid_timezone:
        can.append("transit_planets")
        can.append("transit_to_natal_aspects")
    else:
        cannot.append("transit_calculation")

    if has_birth_time and has_birth_location:
        can.extend(["natal_houses", "transit_natal_house", "natal_angles_as_targets"])
    else:
        cannot.extend(["natal_houses", "transit_natal_house", "natal_angles_as_targets", "asc_mc_transits"])

    if has_transit_time:
        can.append("moon_transit")
        can.append("short_term_triggers")
    else:
        cannot.extend(["moon_transit", "short_term_exact_time"])

    return {
        "has_birth_time": has_birth_time,
        "has_birth_location": has_birth_location,
        "has_transit_time": has_transit_time,
        "has_valid_timezone": has_valid_timezone,
        "can_calculate_natal_houses": has_birth_time and has_birth_location,
        "can_calculate_natal_angles": has_birth_time and has_birth_location,
        "can_calculate_transit_angles": has_birth_location,
        "can_analyze": can,
        "cannot_analyze": cannot,
        "can_analyze_labels": _labels(can),
        "cannot_analyze_labels": _labels(cannot),
    }


def _labels(keys: list[str]) -> list[str]:
    mapping = {
        "transit_planets": "行運行星位置",
        "transit_to_natal_aspects": "行運對本命相位",
        "natal_houses": "本命宮位",
        "transit_natal_house": "行運落本命宮位",
        "natal_angles_as_targets": "行運對四軸相位",
        "moon_transit": "行運月亮",
        "short_term_triggers": "短期精準觸發",
        "asc_mc_transits": "上升與中天行運",
        "short_term_exact_time": "精準時點級觸發",
        "transit_calculation": "行運計算",
    }
    return [mapping.get(k, k) for k in keys]


def build_transit_chart_json(
    *,
    natal_chart_json: dict,
    birth_data: dict,
    transit_data: dict,
    natal_points: dict,
    transit_planets: list[dict],
    transit_to_natal_aspects: list[dict],
    active_periods: list[dict] | None = None,
    house_system: str = "Placidus",
) -> dict:
    natal_req = {
        "has_birth_time": birth_data.get("has_birth_time", False),
        "has_birth_place": bool(birth_data.get("lat")),
        "has_timezone": bool(birth_data.get("timezone_id")),
        "can_calculate_natal_houses": transit_data.get("can_calculate_natal_houses", False),
        "can_calculate_natal_angles": transit_data.get("can_calculate_natal_angles", False),
    }

    validity = build_transit_validity(
        has_birth_time=natal_req["has_birth_time"],
        has_birth_location=natal_req["has_birth_place"],
        has_transit_time=transit_data.get("has_transit_time", False),
    )

    return {
        "schema_version": "1.0.0",
        "language": "zh-TW",
        "metadata": {
            "ephemeris_engine": "swiss_ephemeris",
            "ephemeris_version": "2.10",
            "ephemeris_data": "DE441",
            "house_system": house_system.lower(),
            "zodiac_mode": "tropical",
            "orb_profile": "default_v1",
        },
        "natal_requirements": natal_req,
        "birth_data": birth_data,
        "transit_data": transit_data,
        "transit_validity": validity,
        "natal_points": natal_points,
        "transit_planets": {
            p["name_key"]: {
                "name_zh": p["name"],
                "sign": p.get("sign_en", ""),
                "sign_zh": p["sign"],
                "degree": p.get("degree_num", 0),
                "degree_str": p["degree"],
                "longitude": p.get("longitude"),
                "retrograde": p["retrograde"],
                "natal_house": p.get("natal_house"),
            }
            for p in transit_planets
        },
        "transit_to_natal_aspects": [
            {
                "transit_planet": a["transit_planet"],
                "transit_planet_key": a.get("transit_planet_key", ""),
                "natal_point": a["natal_point"],
                "natal_point_key": a.get("natal_point_key", ""),
                "aspect": ASPECT_EN.get(a["type"], a["type"]),
                "aspect_zh": a["type"],
                "orb": a.get("orb_deg", 0),
                "orb_str": a["orb"],
                "strength": a["strength"],
                "applying": a["applying"],
                "priority": a["priority"],
                "in_primary": a.get("in_primary", True),
            }
            for a in transit_to_natal_aspects
        ],
        "active_periods": active_periods or [],
        "natal_chart_json_ref": bool(natal_chart_json),
    }
