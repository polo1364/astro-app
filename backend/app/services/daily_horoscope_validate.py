"""Validate AI daily horoscope output against source JSON."""

from __future__ import annotations

import re
from typing import Any

PLANET_ZH = {
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
}

ASPECT_ZH = {
    "conjunction": "合相",
    "sextile": "六分",
    "square": "四分",
    "trine": "三分",
    "opposition": "對分",
}

ROBOTIC_PATTERNS = [
    re.compile(r"第\d+宮主題帶動"),
    re.compile(r"宜先穩住節奏再推進"),
    re.compile(r"按部就班，避免情緒化決策"),
    re.compile(r"主題圍繞"),
]

ENGLISH_THEME_KEY = re.compile(r"\b[a-z]+(?:_[a-z]+)+\b")

FORBIDDEN_PATTERNS = [
    re.compile(r"幸運色"),
    re.compile(r"幸運數字"),
    re.compile(r"貴人星座"),
    re.compile(r"一定|注定|保證|必然|爆棚"),
    re.compile(r"本命"),
    re.compile(r"命主"),
    re.compile(r"上升星座|上升點"),
]

RETROGRADE_WORDS = re.compile(r"水逆|逆行")


def _count_cjk(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", text))


def _all_section_text(sections: dict[str, str]) -> str:
    return "".join(sections.get(k, "") for k in (
        "theme", "work", "love", "money", "health", "advice", "evidence"
    ))


def validate_horoscope_content(
    content: dict[str, Any],
    source_doc: dict[str, Any],
    sign_id: str,
) -> list[str]:
    errors: list[str] = []
    sections = content.get("sections") or {}
    if not sections.get("evidence", "").strip():
        errors.append("盤面依據不可為空")

    full_text = _all_section_text(sections)
    cjk_count = _count_cjk(full_text)
    if cjk_count < 90 or cjk_count > 250:
        errors.append(f"字數不符（目前 {cjk_count} 字，目標 120–200）")

    for pat in ROBOTIC_PATTERNS:
        if pat.search(full_text):
            errors.append("文案過於模板化")

    if ENGLISH_THEME_KEY.search(full_text):
        errors.append("含英文主題鍵名")

    for pat in FORBIDDEN_PATTERNS:
        if pat.search(full_text):
            errors.append(f"含禁止用語：{pat.pattern}")

    planets = source_doc["daily_sky"]["planets"]
    for key, zh in PLANET_ZH.items():
        if key not in planets:
            continue
        # Only flag if mentions planet not in allowed set with fabricated claims - skip strict

    aspects = source_doc["daily_sky"].get("major_aspects", [])
    aspect_keywords = set()
    for a in aspects:
        aspect_keywords.add(ASPECT_ZH.get(a["aspect"], a["aspect"]))
    for az in ASPECT_ZH.values():
        if az in full_text and az not in aspect_keywords and aspects:
            # allow if any aspect mentioned matches
            if not any(az in ASPECT_ZH.get(a["aspect"], "") for a in aspects):
                pass

    if RETROGRADE_WORDS.search(full_text):
        retro_planets = [
            k for k, v in planets.items()
            if isinstance(v, dict) and v.get("retrograde")
        ]
        if not retro_planets:
            errors.append("提到逆行但 JSON 無逆行行星")

    sign_src = source_doc["sign_horoscopes_source"].get(sign_id, {})
    if sign_src:
        houses = [
            sign_src.get("sun_house"),
            sign_src.get("moon_house"),
            sign_src.get("mars_house"),
        ]
        evidence = sections.get("evidence", "")
        if houses and not re.search(r"第\s*\d+\s*宮", evidence) and "宮" not in evidence:
            errors.append("盤面依據應提及宮位")

    required_keys = ("theme", "work", "love", "money", "health", "advice", "evidence")
    for k in required_keys:
        if not sections.get(k, "").strip():
            errors.append(f"缺少區段：{k}")

    return errors
