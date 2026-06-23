"""Chinese labels for personal daily horoscope source and copy."""

from app.services.transit_orb_profiles import ASPECT_EN

ASPECT_ZH_TO_EN = ASPECT_EN

ASPECT_EN_TO_ZH = {v: k for k, v in ASPECT_EN.items()}

# Evidence short form for square
ASPECT_EN_TO_EVIDENCE_ZH: dict[str, str] = {
    "conjunction": "合相",
    "sextile": "六分",
    "square": "刑",
    "trine": "三分",
    "opposition": "對分",
}

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

PLANET_ZH_TO_KEY = {v: k for k, v in PLANET_KEY_TO_ZH.items()}

NATAL_POINT_ZH = {
    **PLANET_KEY_TO_ZH,
    "上升": "上升",
    "中天": "中天",
}


def aspect_zh_for_evidence(aspect_en: str) -> str:
    return ASPECT_EN_TO_EVIDENCE_ZH.get(aspect_en, ASPECT_EN_TO_ZH.get(aspect_en, aspect_en))


def normalize_aspect_to_en(aspect: str) -> str:
    if aspect in ASPECT_EN_TO_ZH:
        return aspect
    return ASPECT_ZH_TO_EN.get(aspect, aspect)


def normalize_planet_to_key(name: str) -> str:
    if name in PLANET_KEY_TO_ZH:
        return name
    if name in PLANET_ZH_TO_KEY:
        return PLANET_ZH_TO_KEY[name]
    if name == "上升":
        return "asc"
    if name == "中天":
        return "mc"
    return name


def planet_zh(key_or_name: str) -> str:
    if key_or_name in PLANET_KEY_TO_ZH:
        return PLANET_KEY_TO_ZH[key_or_name]
    if key_or_name in NATAL_POINT_ZH:
        return NATAL_POINT_ZH[key_or_name]
    return key_or_name
