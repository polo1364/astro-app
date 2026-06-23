"""Chinese-only summary of transit_chart_json for AI prompts."""

from app.services.transit_orb_profiles import ASPECT_EN

PRIORITY_ZH = {"high": "高", "medium": "中", "low": "低"}

ASPECT_ZH = {v: k for k, v in ASPECT_EN.items()}


def _aspect_zh(a: dict) -> str:
    zh = a.get("aspect_zh")
    if zh:
        return str(zh)
    raw = a.get("aspect") or a.get("type") or ""
    return ASPECT_ZH.get(raw, raw if raw in ASPECT_EN else str(raw))


def build_transit_ai_context(tcj: dict) -> dict:
    tv = tcj.get("transit_validity", {})
    aspects_raw = tcj.get("transit_to_natal_aspects", [])

    aspects = []
    for a in aspects_raw:
        if not a.get("in_primary", True):
            continue
        aspects.append({
            "行運星": a.get("transit_planet", ""),
            "本命點": a.get("natal_point", ""),
            "相位": _aspect_zh(a),
            "容許": a.get("orb_str") or str(a.get("orb", "")),
            "強度": a.get("strength", ""),
            "入出相": "入相" if a.get("applying") else "出相",
            "優先級": PRIORITY_ZH.get(a.get("priority", "medium"), "中"),
        })

    periods = []
    for p in tcj.get("active_periods") or []:
        exacts = p.get("exact_dates") or []
        exact_str = "、".join(exacts) if isinstance(exacts, list) else str(exacts)
        periods.append({
            "行運星": p.get("transit_planet", ""),
            "本命點": p.get("natal_point", ""),
            "相位": p.get("aspect", ""),
            "精準日": exact_str,
        })

    transit_houses = []
    for p in tcj.get("transit_planets", {}).values():
        h = p.get("natal_house")
        if h:
            transit_houses.append({
                "行星": p.get("name_zh", ""),
                "星座": p.get("sign_zh", ""),
                "落本命宮": h,
            })

    bd = tcj.get("birth_data", {})
    td = tcj.get("transit_data", {})

    return {
        "語言": "繁體中文",
        "可分析項目": tv.get("can_analyze_labels", []),
        "不可分析項目": tv.get("cannot_analyze_labels", []),
        "出生資料": {
            "日期": bd.get("date"),
            "有出生時間": bd.get("has_birth_time", False),
            "時區": bd.get("timezone_id") or bd.get("timezone"),
        },
        "行運資料": {
            "日期": td.get("date"),
            "時間": td.get("time"),
            "有行運時間": td.get("has_transit_time", False),
        },
        "行運對本命相位": aspects,
        "慢行星精準期": periods,
        "行運落宮": transit_houses,
    }
