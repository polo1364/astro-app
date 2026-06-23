from app.data.astrology_kb import HOUSES
from app.services.transit_orb_profiles import SLOW_MOVERS, MID_MOVERS, FAST_MOVERS

ASPECT_PLAIN = {
    "合相": "緊密重疊",
    "六分": "順暢配合",
    "四分": "有壓力要調整",
    "三分": "比較順",
    "對分": "兩頭拉扯",
}

PRIORITY_ZH = {"high": "高", "medium": "中", "low": "低"}


def _section(title: str, text: str, evidence: list[str] | None = None) -> dict:
    ev = evidence or []
    return {"title": title, "text": text, "lines": ev, "evidence": ev}


def _aspect_key(a: dict) -> tuple[str, str, str]:
    typ = a.get("aspect_zh") or a.get("aspect") or ""
    return (a.get("transit_planet", ""), a.get("natal_point", ""), typ)


def _priority_zh(p: str | None) -> str:
    return PRIORITY_ZH.get(p or "medium", "中")


def _aspect_evidence(a: dict) -> str:
    t = a.get("transit_planet", "")
    n = a.get("natal_point", "")
    typ = a.get("aspect_zh") or a.get("aspect") or ""
    orb_str = a.get("orb_str") or a.get("orb") or ""
    phase = "入相" if a.get("applying") else "出相"
    return (
        f"盤面依據：行運{t}{typ}本命{n}，"
        f"容許 {orb_str}，{phase}，優先級{_priority_zh(a.get('priority'))}"
    )


def _aspect_sentence(a: dict) -> tuple[str, str]:
    t = a.get("transit_planet", "")
    n = a.get("natal_point", "")
    typ = a.get("aspect_zh") or a.get("aspect") or ""
    app = "還在加強" if a.get("applying") else "高峰可能已過"
    plain = ASPECT_PLAIN.get(typ, typ)
    orb_str = a.get("orb_str") or a.get("orb") or ""
    text = (
        f"行運{t}與本命{n}{plain}（容許 {orb_str}），"
        f"影響{a.get('strength', '中')}，{app}。"
    )
    return text, _aspect_evidence(a)


def _collect_aspects(
    aspects: list[dict],
    used: set[tuple[str, str, str]],
) -> tuple[list[str], list[str], set[tuple[str, str, str]]]:
    sentences: list[str] = []
    evidence: list[str] = []
    for a in aspects:
        key = _aspect_key(a)
        if key in used:
            continue
        s, e = _aspect_sentence(a)
        sentences.append(s)
        evidence.append(e)
        used.add(key)
    return sentences, evidence, used


def build_section1_validity(tcj: dict) -> dict:
    tv = tcj.get("transit_validity", {})
    can = tv.get("can_analyze_labels", [])
    cannot = tv.get("cannot_analyze_labels", [])
    bd = tcj.get("birth_data", {})
    td = tcj.get("transit_data", {})

    lines = [
        f"出生日期：{'已提供' if bd.get('date') else '未提供'}",
        f"出生時間：{'已提供' if bd.get('has_birth_time') else '未提供'}",
        f"行運日期：{td.get('date', '')}",
        f"行運時間：{'已提供' if td.get('has_transit_time') else '未提供（預設中午）'}",
        f"可分析：{'、'.join(can) if can else '基本行運相位'}",
    ]
    if cannot:
        lines.append(f"不可分析：{'、'.join(cannot)}")

    if cannot:
        summary = "部分項目因資料不足這次不算，其餘仍可看行運相位。"
    else:
        summary = "資料齊全，可分析行運對本命的相位與落宮。"

    return _section("一、資料夠不夠算？", summary, lines)


def build_section2_highlights(tcj: dict, used: set[tuple[str, str, str]]) -> dict:
    aspects = [
        a for a in tcj.get("transit_to_natal_aspects", [])
        if a.get("priority") == "high" and a.get("in_primary", True)
    ][:5]
    if not aspects:
        aspects = tcj.get("transit_to_natal_aspects", [])[:3]

    sentences, evidence, used = _collect_aspects(aspects, used)

    if not sentences:
        sentences.append("目前沒有特別緊密的主要行運相位，可先從中長期背景星象看起。")

    return _section(
        "二、目前最重要的行運",
        "\n\n".join(sentences),
        evidence,
    ), used


def _filter_aspects(tcj: dict, movers: frozenset, used: set[tuple[str, str, str]]) -> list[dict]:
    result: list[dict] = []
    for a in tcj.get("transit_to_natal_aspects", []):
        if a.get("transit_planet") not in movers:
            continue
        if not a.get("in_primary", True):
            continue
        if _aspect_key(a) in used:
            continue
        result.append(a)
        if len(result) >= 4:
            break
    return result


def build_section3_long_term(tcj: dict, used: set[tuple[str, str, str]]) -> tuple[dict, set]:
    aspects = _filter_aspects(tcj, SLOW_MOVERS, used)
    sentences, evidence, used = _collect_aspects(aspects, used)
    text = "\n\n".join(sentences) if sentences else "慢行星（土天海冥）這段時間沒有特別緊密的主要相位。"
    return _section("三、長期行運（土天海冥）", text, evidence), used


def build_section4_mid_term(tcj: dict, used: set[tuple[str, str, str]]) -> tuple[dict, set]:
    aspects = _filter_aspects(tcj, MID_MOVERS, used)
    sentences, evidence, used = _collect_aspects(aspects, used)
    text = "\n\n".join(sentences) if sentences else "木星與火星這段時間沒有列為主軸的緊密相位。"
    return _section("四、中期行運（木火）", text, evidence), used


def build_section5_short_term(tcj: dict, used: set[tuple[str, str, str]]) -> tuple[dict, set]:
    tv = tcj.get("transit_validity", {})
    if not tv.get("has_transit_time"):
        return _section(
            "五、短期行運（日月水金）",
            "未提供行運時間，月亮與當日精準觸發這次不當主軸；請填寫行運時間後再分析。",
            ["不可分析：短期精準觸發（無行運時間）"],
        ), used
    aspects = _filter_aspects(tcj, FAST_MOVERS, used)
    sentences, evidence, used = _collect_aspects(aspects, used)
    text = "\n\n".join(sentences) if sentences else "快行星這段時間以氛圍觸發為主，沒有特別緊密的主軸相位。"
    return _section("五、短期行運（日月水金）", text, evidence), used


def build_section6_life_areas(tcj: dict) -> dict:
    if not tcj.get("transit_validity", {}).get("can_calculate_natal_houses"):
        return _section(
            "六、被觸發的人生領域",
            "沒有準確出生時間，行運落宮與宮位主題這次先不算。",
            ["不可分析：行運落本命宮位"],
        )

    areas: dict[int, list[str]] = {}
    for p in tcj.get("transit_planets", {}).values():
        h = p.get("natal_house")
        if h:
            areas.setdefault(h, []).append(p.get("name_zh", ""))

    sentences: list[str] = []
    evidence: list[str] = []
    for h in sorted(areas.keys()):
        topic = HOUSES.get(h, {}).get("plain_zh", f"第{h}宮")
        planets = "、".join(areas[h])
        sentences.append(f"本命第{h}宮（{topic}）有行運星經過：{planets}。")
        evidence.append(f"盤面依據：行運{planets}落本命第{h}宮")

    text = "\n\n".join(sentences) if sentences else "這段時間沒有明顯的行運落宮主題。"
    return _section("六、被觸發的人生領域", text, evidence)


def build_section7_timing(tcj: dict) -> dict:
    periods = tcj.get("active_periods") or []
    lines: list[str] = []
    for p in periods[:4]:
        exacts = "、".join(p.get("exact_dates", []))
        aspect = p.get("aspect") or ""
        lines.append(
            f"行運{p.get('transit_planet')}{aspect}本命{p.get('natal_point')}："
            f"精準日 {exacts or '（掃描中）'}"
        )
        if exacts:
            lines.append(
                f"盤面依據：行運{p.get('transit_planet')}{aspect}本命{p.get('natal_point')}，"
                f"精準日 {exacts}"
            )

    text_lines = [ln for ln in lines if not ln.startswith("盤面依據：")]
    text = "\n".join(text_lines) if text_lines else "目前沒有掃描到慢行星長週期精準日。"
    evidence = [ln for ln in lines if ln.startswith("盤面依據：")]
    return _section("七、重要時間點", text, evidence)


def build_section8_advice(tcj: dict) -> dict:
    high = [a for a in tcj.get("transit_to_natal_aspects", []) if a.get("priority") == "high"]
    tips_by_planet: dict[str, str] = {}
    evidence: list[str] = []

    for a in high:
        t = a.get("transit_planet", "")
        if t in tips_by_planet:
            continue
        n = a.get("natal_point", "")
        typ = a.get("aspect_zh") or a.get("aspect") or ""
        evidence.append(f"盤面依據：行運{t}{typ}本命{n}")

        if t == "土星":
            tips_by_planet[t] = "土星相關：把節奏與責任寫清楚，別再硬撐模糊地帶。"
        elif t in ("天王星", "海王星", "冥王星"):
            tips_by_planet[t] = f"{t}相關：接受需要調整，舊模式不一定還適用。"
        elif t == "木星":
            tips_by_planet[t] = "木星相關：把握擴張機會，但別把舒適圈放大成逃避。"
        else:
            tips_by_planet[t] = f"行運{t}：留意這段時間反覆出現的主題，主動溝通比悶著好。"

    tips = list(tips_by_planet.values())
    if not tips:
        tips.append("這段時間沒有特別緊繃的相位，適合整理步調、維持日常節奏。")
        evidence = []

    return _section("八、行動建議", "\n".join(tips), evidence)


def build_section9_summary(tcj: dict) -> dict:
    n_high = len([a for a in tcj.get("transit_to_natal_aspects", []) if a.get("priority") == "high"])
    if n_high >= 2:
        text = f"目前有 {n_high} 個高優先行運在作用，建議先處理結構與界線，再談擴張。"
    elif n_high == 1:
        text = "有一個明顯主軸行運，把力氣放在它觸發的人生主題上就好。"
    else:
        text = "這段時間以背景能量為主，適合維持穩定、小幅調整。"
    return _section("九、總結", text, [])


def build_transit_analysis(transit_chart_json: dict) -> dict:
    used: set[tuple[str, str, str]] = set()
    s2, used = build_section2_highlights(transit_chart_json, used)
    s3, used = build_section3_long_term(transit_chart_json, used)
    s4, used = build_section4_mid_term(transit_chart_json, used)
    s5, _used = build_section5_short_term(transit_chart_json, used)

    return {
        "section1_validity": build_section1_validity(transit_chart_json),
        "section2_highlights": s2,
        "section3_long_term": s3,
        "section4_mid_term": s4,
        "section5_short_term": s5,
        "section6_life_areas": build_section6_life_areas(transit_chart_json),
        "section7_timing": build_section7_timing(transit_chart_json),
        "section8_advice": build_section8_advice(transit_chart_json),
        "section9_summary": build_section9_summary(transit_chart_json),
        "sections_ai": None,
    }
