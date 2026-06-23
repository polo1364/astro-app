"""AI and rule-based daily horoscope text generation."""

from __future__ import annotations

import json
import re
from typing import Any

from app import config
from app.data.daily_ai_rules import PUBLIC_DAILY_SYSTEM_PROMPT
from app.data.daily_horoscope_copy import (
    ADVICE_BY_SUN,
    DEFAULT_SECTION,
    HOUSE_COPY,
    HEALTH_HOUSES,
    LOVE_HOUSES,
    MONEY_HOUSES,
    WORK_HOUSES,
    pick_section_copy,
)
from app.services.deepseek import interpret_chart

SIGN_ZH = {
    "aries": "牡羊座",
    "taurus": "金牛座",
    "gemini": "雙子座",
    "cancer": "巨蟹座",
    "leo": "獅子座",
    "virgo": "處女座",
    "libra": "天秤座",
    "scorpio": "天蠍座",
    "sagittarius": "射手座",
    "capricorn": "摩羯座",
    "aquarius": "水瓶座",
    "pisces": "雙魚座",
}

def _priority_houses(src: dict[str, Any]) -> list[int]:
    main = src.get("main_houses", [])
    core = [src["sun_house"], src["moon_house"], src["mars_house"]]
    seen: set[int] = set()
    ordered: list[int] = []
    for h in core + main:
        if h not in seen:
            seen.add(h)
            ordered.append(h)
    return ordered


def _brief_evidence_themes(sun_h: int, moon_h: int, mars_h: int) -> str:
    parts: list[str] = []
    for h in (sun_h, moon_h, mars_h):
        brief = HOUSE_COPY[h]["brief"]
        if brief not in parts:
            parts.append(brief)
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return f"{parts[0]}、{parts[1]}"
    return f"{parts[0]}、{parts[1]}與{parts[2]}"


def build_user_prompt(source_doc: dict[str, Any], sign_id: str) -> str:
    sign_src = source_doc["sign_horoscopes_source"][sign_id]
    payload = {
        "sign": sign_id,
        "sign_horoscopes_source": sign_src,
        "daily_sky": {
            "planets": source_doc["daily_sky"]["planets"],
            "major_aspects": source_doc["daily_sky"]["major_aspects"],
            "moon_events": source_doc["daily_sky"]["moon_events"],
        },
        "date": source_doc["date"],
    }
    return (
        "以下為 daily_horoscope_json 節錄，請只根據此 JSON 撰寫運勢：\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )


def generate_rule_based_horoscope(
    source_doc: dict[str, Any],
    sign_id: str,
) -> dict[str, Any]:
    """Deterministic fallback when DeepSeek is unavailable."""
    src = source_doc["sign_horoscopes_source"][sign_id]

    sun_h = src["sun_house"]
    moon_h = src["moon_house"]
    mars_h = src["mars_house"]
    sun = HOUSE_COPY[sun_h]
    moon = HOUSE_COPY[moon_h]
    priority = _priority_houses(src)

    theme_text = (
        f"今天重點落在{sun['short']}與{moon['short']}。"
        f"你可能比較在意{sun['theme_focus']}，或{moon['theme_feel']}。"
    )

    evidence_themes = _brief_evidence_themes(sun_h, moon_h, mars_h)
    sections = {
        "theme": theme_text,
        "work": pick_section_copy(
            "work", priority, WORK_HOUSES, DEFAULT_SECTION["work"]
        ),
        "love": pick_section_copy(
            "love", priority, LOVE_HOUSES, DEFAULT_SECTION["love"]
        ),
        "money": pick_section_copy(
            "money", priority, MONEY_HOUSES, DEFAULT_SECTION["money"]
        ),
        "health": pick_section_copy(
            "health", priority, HEALTH_HOUSES, DEFAULT_SECTION["health"]
        ),
        "advice": ADVICE_BY_SUN.get(sun_h, DEFAULT_SECTION["advice"]),
        "evidence": (
            f"太陽落第 {sun_h} 宮，月亮落第 {moon_h} 宮，火星落第 {mars_h} 宮，"
            f"主題集中在{evidence_themes}。"
        ),
    }
    return {"sign": sign_id, "sections": sections}


def _parse_ai_json(raw: str, sign_id: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    data = json.loads(text)
    if "sections" not in data:
        raise ValueError("AI 回應缺少 sections")
    data["sign"] = sign_id
    return data


async def generate_horoscope_for_sign(
    source_doc: dict[str, Any],
    sign_id: str,
) -> dict[str, Any]:
    if not config.DEEPSEEK_API_KEY:
        return generate_rule_based_horoscope(source_doc, sign_id)

    user_prompt = build_user_prompt(source_doc, sign_id)
    raw = await interpret_chart(PUBLIC_DAILY_SYSTEM_PROMPT, user_prompt, max_tokens=1200, feature="public_daily")
    try:
        return _parse_ai_json(raw, sign_id)
    except (json.JSONDecodeError, ValueError):
        return generate_rule_based_horoscope(source_doc, sign_id)
