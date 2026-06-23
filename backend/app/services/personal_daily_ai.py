"""AI generation for personal daily horoscope."""

from __future__ import annotations

import json
import re
from typing import Any

from app import config
from app.data.personal_daily_ai_rules import PERSONAL_DAILY_SYSTEM_PROMPT
from app.data.personal_daily_copy import generate_rule_based_personal
from app.services.daily_themes import theme_label_zh
from app.services.deepseek import interpret_chart
from app.services.transit_ai_sanitize import sanitize_transit_ai_text


def _sanitize_content(content: dict[str, Any]) -> dict[str, Any]:
    sections = content.get("sections") or {}
    return {
        "sections": {
            k: sanitize_transit_ai_text(str(v)) for k, v in sections.items()
        }
    }


def _aspects_for_prompt(aspects: list[dict[str, Any]] | None) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for a in aspects or []:
        rec = {k: v for k, v in a.items() if k != "theme"}
        rec["theme_zh"] = a.get("theme_zh") or theme_label_zh(a.get("theme", ""))
        out.append(rec)
    return out


def build_user_prompt(source_doc: dict[str, Any]) -> str:
    payload = {
        "profile_id": source_doc.get("profile_id"),
        "date": source_doc.get("date"),
        "daily_transit_to_natal_aspects": _aspects_for_prompt(
            source_doc.get("daily_transit_to_natal_aspects")
        ),
        "daily_summary_source": source_doc.get("daily_summary_source"),
        "daily_house_focus": source_doc.get("daily_house_focus"),
        "long_term_background": source_doc.get("long_term_background"),
        "daily_trigger_to_long_term_transit": source_doc.get("daily_trigger_to_long_term_transit"),
        "data_validity": source_doc.get("data_validity"),
    }
    return (
        "以下為 personalized_daily_transit_json，請只根據此 JSON 撰寫個人每日行運：\n"
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}"
    )


def _parse_ai_json(raw: str) -> dict[str, Any]:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


async def generate_personal_horoscope(source_doc: dict[str, Any]) -> tuple[dict[str, Any], str]:
    if not config.DEEPSEEK_API_KEY:
        content = generate_rule_based_personal(source_doc)
        return content, "rule_based"

    try:
        raw = await interpret_chart(
            PERSONAL_DAILY_SYSTEM_PROMPT,
            build_user_prompt(source_doc),
            max_tokens=2000,
            feature="personal_daily",
        )
        content = _parse_ai_json(raw)
        return _sanitize_content(content), config.DEEPSEEK_MODEL
    except Exception:
        return generate_rule_based_personal(source_doc), "rule_based"
