from app.data.astrology_kb import CAN_ANALYZE_LABELS, CANNOT_ANALYZE_LABELS

VALID_TZ_PREFIXES = ("Asia/", "Europe/", "America/", "Africa/", "Australia/", "Pacific/", "UTC")


def _has_valid_timezone(tz_name: str | None) -> bool:
    if not tz_name or tz_name.strip() in ("", "unknown"):
        return False
    if tz_name == "UTC":
        return True
    return any(tz_name.startswith(p) for p in VALID_TZ_PREFIXES) or "/" in tz_name


def build_chart_validity(
    *,
    has_birth_time: bool,
    has_birth_location: bool,
    timezone: str | None,
) -> dict:
    has_tz = _has_valid_timezone(timezone)
    can_houses = has_birth_time and has_birth_location and has_tz
    can_asc = can_houses

    cannot: list[str] = []
    can: list[str] = []

    if not has_tz:
        cannot = list(CANNOT_ANALYZE_LABELS.keys())
        can = []
        return {
            "has_birth_time": has_birth_time,
            "has_birth_location": has_birth_location,
            "has_valid_timezone": False,
            "can_calculate_houses": False,
            "can_calculate_ascendant": False,
            "can_analyze": [],
            "cannot_analyze": cannot,
            "can_analyze_labels": [],
            "cannot_analyze_labels": [CANNOT_ANALYZE_LABELS[k] for k in cannot],
            "blocked": True,
            "blocked_reason": "時區不明或無效，無法正確換算命盤",
        }

    if not has_birth_location:
        cannot.extend(["houses", "mc", "ic", "dc", "planet_houses", "house_rulers",
                       "relationship_7th", "career_10th", "ascendant", "chart_ruler"])
    elif not has_birth_time:
        cannot.extend([
            "ascendant", "houses", "chart_ruler", "mc", "ic", "dc",
            "planet_houses", "house_rulers", "relationship_7th", "career_10th",
        ])

    base_can = ["sun_sign", "mercury_sign", "venus_sign", "mars_sign",
                "jupiter_sign", "saturn_sign", "outer_planets", "aspects",
                "element_balance", "modality_balance"]
    if has_birth_time:
        can = base_can + ["moon_sign"]
    else:
        can = base_can + ["moon_sign"]  # with uncertainty note

    if can_houses:
        can.extend(["ascendant", "houses", "chart_ruler", "angles", "planet_houses"])

    cannot_set = set(cannot)
    can = [k for k in can if k not in cannot_set]

    return {
        "has_birth_time": has_birth_time,
        "has_birth_location": has_birth_location,
        "has_valid_timezone": True,
        "can_calculate_houses": can_houses,
        "can_calculate_ascendant": can_asc,
        "can_analyze": can,
        "cannot_analyze": list(cannot_set),
        "can_analyze_labels": [CAN_ANALYZE_LABELS[k] for k in can if k in CAN_ANALYZE_LABELS],
        "cannot_analyze_labels": [CANNOT_ANALYZE_LABELS[k] for k in cannot_set if k in CANNOT_ANALYZE_LABELS],
        "blocked": False,
        "blocked_reason": None,
        "moon_uncertain": not has_birth_time,
    }
