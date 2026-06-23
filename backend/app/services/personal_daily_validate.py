"""Validate personal daily horoscope AI output."""

from __future__ import annotations

import re
from typing import Any

from app.data.personal_daily_labels import aspect_zh_for_evidence, planet_zh

ROBOTIC_PATTERNS = [
    re.compile(r"第\d+宮主題帶動"),
    re.compile(r"宜先穩住節奏再推進"),
    re.compile(r"按部就班"),
    re.compile(r"主題圍繞"),
]

FORBIDDEN_PATTERNS = [
    re.compile(r"幸運色"),
    re.compile(r"幸運數字"),
    re.compile(r"貴人星座"),
    re.compile(r"一定|注定|保證|必然|爆棚"),
]

ENGLISH_THEME_KEY = re.compile(r"\b[a-z]+(?:_[a-z]+)+\b")
ENGLISH_ORB = re.compile(r"\borb\b", re.IGNORECASE)

SECTION_KEYS = ("theme", "work", "love", "money", "health", "advice", "evidence")


def _count_cjk(text: str) -> int:
    return len(re.findall(r"[\u4e00-\u9fff]", text))


def _all_text(sections: dict[str, str]) -> str:
    return "".join(sections.get(k, "") for k in SECTION_KEYS)


def validate_personal_horoscope(
    content: dict[str, Any],
    source_doc: dict[str, Any],
) -> list[str]:
    errors: list[str] = []
    sections = content.get("sections") or {}
    validity = source_doc.get("data_validity") or {}
    aspects = source_doc.get("daily_transit_to_natal_aspects") or []

    for k in SECTION_KEYS:
        if not str(sections.get(k, "")).strip():
            errors.append(f"缺少區段：{k}")

    full = _all_text(sections)
    cjk = _count_cjk(full)
    if cjk < 200 or cjk > 480:
        errors.append(f"字數不符（目前 {cjk} 字，目標 280–420）")

    for pat in ROBOTIC_PATTERNS + FORBIDDEN_PATTERNS:
        if pat.search(full):
            errors.append(f"含禁止用語：{pat.pattern}")

    if ENGLISH_THEME_KEY.search(full):
        errors.append("含英文主題鍵名")

    if ENGLISH_ORB.search(full):
        errors.append("含英文 orb，應使用「容許」")

    evidence = sections.get("evidence", "")
    if "行運" not in evidence or "本命" not in evidence:
        errors.append("盤面依據須含行運與本命")

    if not re.search(r"容許\s*[\d.]+°", evidence):
        errors.append("盤面依據須含容許 N°")

    if not validity.get("can_use_houses") and re.search(r"第\s*\d+\s*宮", evidence):
        errors.append("無出生時間時 evidence 不得含宮位")

    if validity.get("can_use_moon_precision") is False:
        for a in aspects:
            if a.get("transit_planet") == "moon" and a.get("exact_time"):
                if re.search(r"\d{1,2}:\d{2}", evidence):
                    errors.append("月亮精度不足時不得寫具體鐘點")
                break

    for a in aspects:
        t_zh = planet_zh(a["transit_planet"])
        n_zh = planet_zh(a["natal_point"])
        asp_zh = a.get("aspect_zh") or aspect_zh_for_evidence(a["aspect"])
        if t_zh in evidence and n_zh in evidence:
            orb = a.get("orb", 0)
            if (
                f"容許 {orb}" not in evidence
                and f"容許 {orb:.1f}" not in evidence
            ):
                found_orb = re.search(r"容許\s*([\d.]+)°", evidence)
                if found_orb:
                    cited = float(found_orb.group(1))
                    if abs(cited - float(orb)) > 0.25:
                        errors.append(f"容許度與 source 不一致：{cited} vs {orb}")
            break

    return errors
