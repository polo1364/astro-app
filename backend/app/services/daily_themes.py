"""House and aspect theme mappings for daily horoscope."""

from __future__ import annotations

HOUSE_THEMES: dict[int, list[str]] = {
    1: ["self_state", "body"],
    2: ["money_value", "resources"],
    3: ["communication", "learning"],
    4: ["home_family"],
    5: ["romance_creativity"],
    6: ["work_routine", "health"],
    7: ["relationship_balance"],
    8: ["shared_resources", "intimacy"],
    9: ["belief", "travel"],
    10: ["career_responsibility"],
    11: ["community", "plans"],
    12: ["rest_subconscious"],
}

# planet pair (sorted) + aspect -> theme key
ASPECT_THEMES: dict[tuple[str, str, str], str] = {
    ("moon", "venus", "sextile"): "relationship_mood_support",
    ("moon", "venus", "trine"): "relationship_mood_support",
    ("moon", "venus", "square"): "relationship_tension",
    ("moon", "venus", "opposition"): "relationship_tension",
    ("moon", "sun", "conjunction"): "emotion_self_focus",
    ("moon", "sun", "square"): "emotion_self_tension",
    ("moon", "sun", "opposition"): "emotion_self_balance",
    ("mars", "saturn", "square"): "pressure_action_block",
    ("mars", "saturn", "opposition"): "pressure_action_block",
    ("mars", "saturn", "conjunction"): "pressure_action_block",
    ("mercury", "mars", "square"): "communication_pressure",
    ("mercury", "mars", "opposition"): "communication_pressure",
    ("sun", "moon", "trine"): "inner_harmony",
    ("sun", "moon", "sextile"): "inner_harmony",
    ("sun", "moon", "square"): "inner_tension",
    ("sun", "moon", "opposition"): "inner_balance",
    ("venus", "mars", "conjunction"): "passion_attraction",
    ("venus", "mars", "square"): "passion_friction",
    ("jupiter", "saturn", "square"): "growth_limit_tension",
    ("jupiter", "saturn", "opposition"): "growth_limit_tension",
}

MOON_EVENT_THEMES: dict[str, str] = {
    "moon_sign_change": "mood_shift",
    "moon_in_libra_all_day": "relationship_balance",
    "moon_in_scorpio_all_day": "emotional_depth",
    "moon_in_sagittarius_all_day": "optimism_exploration",
    "moon_in_capricorn_all_day": "practical_focus",
    "moon_in_aquarius_all_day": "social_distance",
    "moon_in_pisces_all_day": "sensitivity_imagination",
    "moon_in_aries_all_day": "impulsive_mood",
    "moon_in_taurus_all_day": "comfort_stability",
    "moon_in_gemini_all_day": "curious_chat",
    "moon_in_cancer_all_day": "nurturing_mood",
    "moon_in_leo_all_day": "expressive_mood",
    "moon_in_virgo_all_day": "detail_focus",
}

# Internal theme keys -> 繁體中文（對外文案用）
THEME_LABEL_ZH: dict[str, str] = {
    "self_state": "自我狀態",
    "body": "身體狀態",
    "money_value": "金錢與價值",
    "resources": "資源管理",
    "communication": "溝通學習",
    "learning": "學習吸收",
    "home_family": "家庭安全感",
    "romance_creativity": "戀愛創作",
    "work_routine": "工作節奏",
    "health": "身心健康",
    "relationship_balance": "關係平衡",
    "shared_resources": "共享資源",
    "intimacy": "親密連結",
    "belief": "信念遠行",
    "travel": "遠行探索",
    "career_responsibility": "事業責任",
    "community": "社群互動",
    "plans": "計畫推進",
    "rest_subconscious": "休息潛意識",
    "relationship_mood_support": "關係情緒支持",
    "relationship_tension": "關係張力",
    "emotion_self_focus": "情緒與自我聚焦",
    "emotion_self_tension": "情緒與自我拉扯",
    "emotion_self_balance": "情緒與自我平衡",
    "pressure_action_block": "行動受阻壓力",
    "communication_pressure": "溝通壓力",
    "inner_harmony": "內在和諧",
    "inner_tension": "內在張力",
    "inner_balance": "內在平衡",
    "passion_attraction": "熱情吸引",
    "passion_friction": "熱情摩擦",
    "growth_limit_tension": "成長與限制拉扯",
    "mood_shift": "情緒轉換",
    "emotional_depth": "情感深度",
    "optimism_exploration": "樂觀探索",
    "practical_focus": "務實聚焦",
    "social_distance": "社交距離",
    "sensitivity_imagination": "敏感想像",
    "impulsive_mood": "衝動情緒",
    "comfort_stability": "舒適穩定",
    "curious_chat": "好奇交流",
    "nurturing_mood": "滋養情緒",
    "expressive_mood": "表達情緒",
    "detail_focus": "細節聚焦",
    "general_aspect": "整體相位",
    "general_activation": "日常能量啟動",
    "tension_action": "行動張力",
    "support_flow": "順暢支持",
}


def theme_label_zh(key: str) -> str:
    return THEME_LABEL_ZH.get(key, key)


def theme_labels_zh(keys: list[str]) -> list[str]:
    return [theme_label_zh(k) for k in keys]


def themes_for_house(house: int) -> list[str]:
    return list(HOUSE_THEMES.get(house, []))


def theme_for_aspect(planet1: str, planet2: str, aspect: str) -> str | None:
    pair = tuple(sorted([planet1, planet2]) + [aspect])
    return ASPECT_THEMES.get(pair)  # type: ignore[arg-type]


def theme_for_moon_event(event: str) -> str | None:
    if event in MOON_EVENT_THEMES:
        return MOON_EVENT_THEMES[event]
    if event.startswith("moon_enters_"):
        return "mood_shift"
    if event.endswith("_all_day"):
        sign_part = event.replace("moon_in_", "").replace("_all_day", "")
        return MOON_EVENT_THEMES.get(f"moon_in_{sign_part}_all_day", "mood_shift")
    return None


def dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out
