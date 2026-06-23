"""Tighter orb profile for personal daily horoscope (daily_personal_v1)."""

from app.services.transit_orb_profiles import aspect_priority, priority_rank

SLOW_MOVERS = frozenset({"jupiter", "saturn", "uranus", "neptune", "pluto"})
OUTER_MOVERS = frozenset({"jupiter", "saturn", "uranus", "neptune", "pluto"})

PLANET_KEY_TO_ZH = {
    "sun": "太陽",
    "moon": "月亮",
    "mercury": "水星",
    "venus": "金星",
    "mars": "火星",
    "jupiter": "木星",
    "saturn": "土星",
    "uranus": "天王星",
    "neptune": "海王星",
    "pluto": "冥王星",
    "asc": "上升",
    "mc": "中天",
}

# max orb degrees for personal daily inclusion
PERSONAL_MAX_ORB: dict[str, float] = {
    "moon": 3.0,
    "sun": 2.0,
    "mercury": 2.0,
    "venus": 2.0,
    "mars": 2.0,
    "jupiter": 2.5,
    "saturn": 1.5,
    "uranus": 1.5,
    "neptune": 1.5,
    "pluto": 1.5,
}


def _to_zh(planet: str) -> str:
    if planet in PLANET_KEY_TO_ZH:
        return PLANET_KEY_TO_ZH[planet]
    return planet if planet in PLANET_KEY_TO_ZH.values() else planet


def max_orb_personal(transit_planet: str, natal_point: str) -> float:
    t = transit_planet.lower() if transit_planet in PLANET_KEY_TO_ZH else _to_zh(transit_planet)
    t_key = next((k for k, v in PLANET_KEY_TO_ZH.items() if v == t), transit_planet)
    if t_key in PERSONAL_MAX_ORB:
        return PERSONAL_MAX_ORB[t_key]
    if t == "月亮":
        return 3.0
    return 2.0


def passes_personal_orb(transit_planet: str, natal_point: str, orb_deg: float) -> bool:
    t_zh = _to_zh(transit_planet)
    n_zh = _to_zh(natal_point)
    return orb_deg <= max_orb_personal(t_zh, n_zh)


def personal_priority(transit_planet: str, natal_point: str, orb_deg: float) -> str:
    t_zh = _to_zh(transit_planet)
    n_zh = _to_zh(natal_point)
    return aspect_priority(t_zh, n_zh, orb_deg)


def priority_rank_personal(p: str) -> int:
    return priority_rank(p)
