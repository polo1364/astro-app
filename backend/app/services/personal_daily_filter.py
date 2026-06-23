"""Filter and rank personal daily transit aspects for AI input."""

from __future__ import annotations

from typing import Any

from app import config
from app.services.daily_themes import ASPECT_THEMES, theme_label_zh
from app.services.personal_daily_orb_profiles import OUTER_MOVERS, priority_rank_personal

HIGH_TRANSIT = frozenset({"sun", "moon", "venus", "mars"})
HIGH_NATAL = frozenset({"sun", "moon", "venus", "mars", "asc", "mc"})


def _aspect_theme(transit_key: str, natal_key: str, aspect_en: str) -> str:
    pair = tuple(sorted([transit_key, natal_key]))
    if len(pair) == 2 and pair[0] == pair[1]:
        pass
    key = (transit_key, natal_key, aspect_en)
    alt = (natal_key, transit_key, aspect_en)
    theme = ASPECT_THEMES.get(key) or ASPECT_THEMES.get(alt)
    if theme:
        return theme
    if aspect_en in ("square", "opposition"):
        return "tension_action"
    if aspect_en in ("trine", "sextile"):
        return "support_flow"
    return "general_activation"


def filter_personal_aspects(aspects: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    cap = config.PERSONAL_DAILY_ASPECT_CAP
    filtered_out = 0
    candidates: list[dict[str, Any]] = []

    for a in aspects:
        t = a.get("transit_planet", "")
        if t in OUTER_MOVERS:
            filtered_out += 1
            continue
        rec = dict(a)
        theme = _aspect_theme(t, a.get("natal_point", ""), a.get("aspect", ""))
        rec["theme"] = theme
        rec["theme_zh"] = theme_label_zh(theme)
        candidates.append(rec)

    candidates.sort(
        key=lambda x: (
            priority_rank_personal(x.get("priority", "medium")),
            x.get("orb", 99),
        )
    )

    main = candidates[:cap]
    filtered_out += max(0, len(candidates) - cap)

    main_themes: list[str] = []
    caution_themes: list[str] = []
    supportive_themes: list[str] = []

    for a in main:
        theme = a.get("theme", "")
        label = theme_label_zh(theme)
        t, n = a.get("transit_planet", ""), a.get("natal_point", "")
        if t in HIGH_TRANSIT and n in HIGH_NATAL and a.get("aspect") in ("square", "opposition"):
            if label not in caution_themes:
                caution_themes.append(label)
        elif a.get("aspect") in ("trine", "sextile"):
            if label not in supportive_themes:
                supportive_themes.append(label)
        else:
            if label not in main_themes:
                main_themes.append(label)

    summary = {
        "main_themes": main_themes,
        "caution_themes": caution_themes,
        "supportive_themes": supportive_themes,
        "filtered_out_count": filtered_out,
    }
    return main, summary
