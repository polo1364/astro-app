"""Transit aspect orb thresholds and priority (default_v1 profile)."""

ASPECT_EN = {
    "合相": "conjunction",
    "六分": "sextile",
    "四分": "square",
    "三分": "trine",
    "對分": "opposition",
}

SLOW_MOVERS = frozenset({"土星", "天王星", "海王星", "冥王星"})
MID_MOVERS = frozenset({"木星", "火星"})
FAST_MOVERS = frozenset({"太陽", "水星", "金星", "月亮"})
PERSONAL_POINTS = frozenset({"太陽", "月亮", "水星", "金星", "火星", "上升", "中天"})

# max orb in degrees for inclusion in primary report
DEFAULT_MAX_ORB: dict[str, float] = {
    "slow_to_personal": 2.0,
    "slow_to_angle": 2.0,
    "jupiter_to_personal": 3.0,
    "mars_to_personal": 2.0,
    "fast_to_personal": 2.0,
    "moon_to_any": 3.0,
    "default": 2.0,
}


def _category(transit: str, natal: str) -> str:
    if transit == "月亮":
        return "moon_to_any"
    if transit in SLOW_MOVERS:
        if natal in ("上升", "中天"):
            return "slow_to_angle"
        return "slow_to_personal"
    if transit == "木星":
        return "jupiter_to_personal"
    if transit == "火星":
        return "mars_to_personal"
    if transit in FAST_MOVERS:
        return "fast_to_personal"
    return "default"


def max_orb_for(transit_planet: str, natal_point: str) -> float:
    return DEFAULT_MAX_ORB[_category(transit_planet, natal_point)]


def aspect_priority(transit_planet: str, natal_point: str, orb_deg: float) -> str:
    cat = _category(transit_planet, natal_point)
    is_personal = natal_point in PERSONAL_POINTS

    if transit_planet in SLOW_MOVERS and is_personal and orb_deg <= 2.0:
        return "high"
    if transit_planet in SLOW_MOVERS and orb_deg <= 2.5:
        return "high"
    if transit_planet == "木星" and is_personal and orb_deg <= 2.5:
        return "high"
    if transit_planet == "火星" and is_personal and orb_deg <= 2.0:
        return "medium"
    if transit_planet in FAST_MOVERS and natal_point in ("太陽", "月亮", "上升", "中天"):
        return "medium"
    if transit_planet == "月亮":
        return "low"
    return "medium" if orb_deg <= 1.5 else "low"


def priority_rank(p: str) -> int:
    return {"high": 0, "medium": 1, "low": 2}.get(p, 3)
