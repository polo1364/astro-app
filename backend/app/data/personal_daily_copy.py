"""Rule-based fallback copy for personal daily horoscope."""

from __future__ import annotations

from typing import Any

from app.data.personal_daily_labels import aspect_zh_for_evidence, planet_zh


def _theme_section(summary: dict[str, Any]) -> str:
    main = summary.get("main_themes") or []
    caution = summary.get("caution_themes") or []
    parts = main[:2] or caution[:2] or ["日常節奏與情緒互動"]
    focus = "、".join(parts)
    return (
        f"今天的重點落在{focus}。你可能會覺得事情需要推進，"
        "但同時又有現實限制或責任需要顧及。"
    )


def _aspect_evidence_line(a: dict[str, Any]) -> str:
    t = planet_zh(a.get("transit_planet", ""))
    n = planet_zh(a.get("natal_point", ""))
    asp = a.get("aspect_zh") or aspect_zh_for_evidence(a.get("aspect", ""))
    orb = a.get("orb", 0)
    hint = "提供情緒與行動上的提示"
    if a.get("aspect") in ("square", "opposition"):
        hint = "提示壓力與摩擦需要調適"
    elif a.get("aspect") in ("trine", "sextile"):
        hint = "提供較順暢的支持感"
    return f"行運{t}{asp}本命{n}，容許 {orb}°，{hint}"


def _house_evidence(house_focus: list[dict[str, Any]] | None) -> str:
    if not house_focus:
        return ""
    houses = sorted(house_focus, key=lambda h: h["house"])
    if len(houses) == 1:
        h = houses[0]
        theme = h.get("theme_zh") or "日常節奏"
        return f"今日第 {h['house']} 宮被觸發，主題集中在{theme}。"
    themes = [h.get("theme_zh", "") for h in houses[:2] if h.get("theme_zh")]
    theme_part = "、".join(themes) if themes else "日常節奏與互動"
    return (
        f"今日第 {houses[0]['house']} 宮與第 {houses[1]['house']} 宮被觸發，"
        f"主題集中在{theme_part}。"
    )


def generate_rule_based_personal(source_doc: dict[str, Any]) -> dict[str, Any]:
    summary = source_doc.get("daily_summary_source") or {}
    aspects = source_doc.get("daily_transit_to_natal_aspects") or []
    house_focus = source_doc.get("daily_house_focus")
    validity = source_doc.get("data_validity") or {}

    evidence_parts = [_aspect_evidence_line(a) for a in aspects[:3]]
    if validity.get("can_use_houses") and house_focus:
        house_line = _house_evidence(house_focus)
        if house_line:
            evidence_parts.append(house_line)
    if not validity.get("can_use_moon_precision"):
        for i, a in enumerate(aspects):
            if a.get("transit_planet") == "moon" and evidence_parts:
                evidence_parts[i] = evidence_parts[i] + "（月亮位置可能不準）"
                break

    evidence = "；".join(evidence_parts) if evidence_parts else "今日行運節奏平穩，無強烈相位觸發。"

    return {
        "sections": {
            "theme": _theme_section(summary),
            "work": "適合處理已經排好的任務，不適合臨時硬改流程。若有溝通或會議，先確認界線與分工。",
            "love": "情緒互動宜柔和表達需求。若有壓力，避免用急躁語氣直接丟給對方。",
            "money": "今天不適合衝動做高風險決定。需要時間確認的事情，先保留彈性。",
            "health": "注意疲勞、肩頸緊繃與急躁感，避免把壓力轉成硬撐。",
            "advice": "先穩住節奏，再推進行動。今天的關鍵不是快，而是不要被壓力牽著跑。",
            "evidence": evidence,
        }
    }
