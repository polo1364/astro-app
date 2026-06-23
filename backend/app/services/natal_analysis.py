from app.data.astrology_kb import (
    ANGLES,
    HOUSES,
    PLANETS,
    SIGNS,
)


def _planet_plain_sentence(key: str, planet: dict, validity: dict) -> str | None:
    if not planet:
        return None
    sign_zh = planet.get("sign_zh", "")
    sign_plain = SIGNS.get(sign_zh, {}).get("plain_zh", "")
    pname = PLANETS.get(key, {}).get("zh", key)
    nick = PLANETS.get(key, {}).get("plain_zh", pname)

    if key == "sun":
        lead = f"你的核心志向（太陽）帶有{sign_zh}座的味覺"
    elif key == "moon":
        lead = f"情緒與安全感（月亮）比較像{sign_zh}座"
    else:
        lead = f"你的{pname}落在{sign_zh}座"

    if sign_plain:
        lead += f"，{sign_plain}"

    house = planet.get("house")
    if house and validity.get("can_calculate_houses"):
        h_plain = HOUSES.get(house, {}).get("plain_zh", "")
        if h_plain:
            lead += f"；比較常跟「{h_plain}」這塊人生有關"

    if validity.get("moon_uncertain") and key == "moon":
        lead += "。因出生時間不詳，月亮位置可能有一點誤差"

    if nick and key not in ("sun", "moon"):
        lead += f"（{nick}）"

    return lead


def build_section1_validity(chart_json: dict) -> dict:
    bd = chart_json.get("birth_data", {})
    v = chart_json.get("chart_validity", {})

    if v.get("blocked"):
        summary = f"資料還不夠完整，暫時無法解讀（{v.get('blocked_reason', '請補齊出生資料')}）。"
        lines = [
            f"出生日期：{'已提供' if bd.get('date') else '未提供'}",
            f"出生時間：{'已提供' if bd.get('time') else '未提供'}",
            f"出生地點：{'已提供' if bd.get('location') else '未提供'}",
        ]
        return {
            "title": "一、資料夠不夠算？",
            "lines": lines,
            "evidence": lines,
            "text": summary,
        }

    has_time = v.get("has_birth_time", False)
    can_labels = v.get("can_analyze_labels", [])
    cannot_labels = v.get("cannot_analyze_labels", [])

    if has_time:
        summary = (
            f"出生資料齊全，可以解讀行星、相位與宮位。"
            f"已確認時區為 {bd.get('timezone', '')}。"
        )
    else:
        summary = (
            "有出生日期，但沒有準確時間：仍可看太陽星座與多數行星，"
            "但上升、宮位與命主星這次先不算。"
        )

    lines = [
        f"出生日期：{bd.get('date', '')}",
        f"出生時間：{bd.get('time', '') if has_time else '未提供'}",
        f"出生地點：{bd.get('location', '') or '已提供'}",
        f"可分析：{'、'.join(can_labels) if can_labels else '基本行星'}",
    ]
    if cannot_labels:
        lines.append(f"暫不分析：{'、'.join(cannot_labels)}")

    return {
        "title": "一、資料夠不夠算？",
        "lines": lines,
        "evidence": lines,
        "text": summary,
    }


def build_section2_core_summary(chart_json: dict) -> dict:
    v = chart_json.get("chart_validity", {})
    planets = chart_json.get("planets", {})
    angles = chart_json.get("angles") or {}

    sentences: list[str] = []
    evidence: list[str] = []

    sun = planets.get("sun")
    if sun and "sun_sign" in v.get("can_analyze", []):
        s = _planet_plain_sentence("sun", sun, v)
        if s:
            sentences.append(s)
            evidence.append(f"太陽在{sun['sign_zh']}座")

    moon = planets.get("moon")
    if moon and "moon_sign" in v.get("can_analyze", []):
        s = _planet_plain_sentence("moon", moon, v)
        if s:
            sentences.append(s)
            evidence.append(f"月亮在{moon['sign_zh']}座")

    if v.get("can_calculate_ascendant") and angles.get("ascendant"):
        asc = angles["ascendant"]
        asc_plain = ANGLES["ascendant"]["plain_zh"]
        sentences.append(
            f"你給人的第一印象（上升）帶有{asc['sign_zh']}座感覺，{asc_plain}。"
        )
        evidence.append(f"上升在{asc['sign_zh']}座")

        if angles.get("chart_ruler"):
            cr = angles["chart_ruler"]
            cr_plain = PLANETS.get(cr["planet"], {}).get("plain_zh", "")
            if cr.get("house"):
                sentences.append(
                    f"整張盤的「領隊」是{cr['planet_zh']}（命主星），"
                    f"比較常落在人生第 {cr['house']} 宮那塊；{cr_plain}。"
                )
            else:
                sentences.append(f"整張盤的領隊是{cr['planet_zh']}，{cr_plain}。")
            evidence.append(f"命主星為{cr['planet_zh']}")
    elif not v.get("has_birth_time"):
        sentences.append("沒有出生時間的話，外在印象與命主星這次先跳過。")

    if not sentences:
        sentences.append("資料不足，暫時無法整理核心輪廓。")

    text = "\n\n".join(sentences)

    return {
        "title": "二、你最核心的輪廓",
        "lines": sentences,
        "evidence": evidence,
        "text": text,
    }


def build_rule_analysis(chart_json: dict) -> dict:
    return {
        "section1_validity": build_section1_validity(chart_json),
        "section2_core_summary": build_section2_core_summary(chart_json),
        "sections_ai": None,
    }
