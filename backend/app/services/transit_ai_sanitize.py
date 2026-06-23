"""Post-process AI transit report text to remove English JSON field names."""

import re
from collections.abc import Callable

from app.data.astrology_kb import PLANET_KEY_TO_ZH, SIGN_EN

# snake_case JSON keys → 中文（catch-all 表）
_SNAKE_KEY_ZH: dict[str, str] = {
    "transit_validity": "盤面資料",
    "transit_to_natal_aspects": "行運對本命相位",
    "transit_planets": "行運行星",
    "transit_planet": "行運星",
    "transit_data": "行運資料",
    "active_periods": "慢行星精準期",
    "exact_dates": "精準日",
    "natal_house": "本命宮",
    "natal_point": "本命點",
    "birth_data": "出生資料",
    "can_analyze": "可分析項目",
    "cannot_analyze": "不可分析項目",
    "can_analyze_labels": "可分析項目",
    "cannot_analyze_labels": "不可分析項目",
    "can_calculate_natal_houses": "可計算本命宮位",
    "has_birth_time": "有出生時間",
    "has_transit_time": "有行運時間",
    "timezone_id": "時區",
    "schema_version": "",
    "in_primary": "",
    "aspect_zh": "相位",
    "orb_str": "容許",
    "sign_zh": "星座",
    "name_zh": "行星",
}

_ASCII_WORD_ZH: dict[str, str] = {
    "orb": "容許",
    "applying": "入相",
    "separating": "出相",
    "priority": "優先級",
    "strength": "強度",
    "conjunction": "合相",
    "square": "四分",
    "sextile": "六分",
    "trine": "三分",
    "opposition": "對分",
    "labels": "項目",
    "true": "是",
    "false": "否",
    "high": "高",
    "medium": "中",
    "low": "低",
    "mc": "中天",
    "asc": "上升",
}

_SIGN_EN_ZH = {en.lower(): zh for zh, en in SIGN_EN.items()}

_HOUSE_EVIDENCE = re.compile(
    r"(?:行運行星|transit_planets)\s*中\s*"
    r"(?P<p>[^的]+?)\s*的\s*星座\s*為(?P<sign>[^、，,。\n]+)、落本命宮\s*(?P<h>\d+)",
    re.IGNORECASE,
)

_ASPECT_EVIDENCE = re.compile(
    r"行運對本命相位\s*中\s*"
    r"行運星\s*為(?P<t>[^、，,]+)、本命點\s*為(?P<n>[^、，,]+)、相位\s*為(?P<a>[^。.\n]+)",
)

# Ordered: longer / more specific patterns first
_REPLACEMENTS: list[tuple[re.Pattern[str], str | Callable[[re.Match[str]], str]]] = [
    (
        re.compile(
            r"transit_to_natal_aspects\s*中[，,:：]\s*",
            re.IGNORECASE,
        ),
        "",
    ),
    (
        re.compile(r"transit_planets\s*中[，,:：]\s*", re.IGNORECASE),
        "",
    ),
    (
        re.compile(
            r"active_periods\s*中[，,:：]\s*",
            re.IGNORECASE,
        ),
        "",
    ),
    (
        re.compile(
            r"transit_validity\s*中的?\s*",
            re.IGNORECASE,
        ),
        "盤面資料顯示",
    ),
    (
        re.compile(r"根據\s*盤面資料", re.IGNORECASE),
        "盤面資料顯示",
    ),
    (
        re.compile(r"exact_dates\s*為\s*", re.IGNORECASE),
        "精準日為 ",
    ),
    (
        re.compile(r"exact_dates\s*[:：]\s*", re.IGNORECASE),
        "精準日：",
    ),
    (
        re.compile(r"natal_house\s*為\s*", re.IGNORECASE),
        "落本命宮 ",
    ),
    (
        re.compile(r"natal_house\s*[:：]\s*", re.IGNORECASE),
        "落本命宮",
    ),
    (re.compile(r"，\s*orb\s+", re.IGNORECASE), "，容許 "),
    (re.compile(r"，\s*orb\s*[:：=]\s*", re.IGNORECASE), "，容許 "),
    (re.compile(r"\borb\s*[:：=]\s*", re.IGNORECASE), "容許 "),
    (re.compile(r"\borb\s+", re.IGNORECASE), "容許 "),
    (
        re.compile(r"priority\s*[:：=]\s*(high|medium|low)", re.IGNORECASE),
        lambda m: f"優先級{_ASCII_WORD_ZH[m.group(1).lower()]}",
    ),
]


def _ascii_token(pattern: str) -> re.Pattern[str]:
    return re.compile(rf"(?<![A-Za-z_]){pattern}(?![A-Za-z_])", re.IGNORECASE)


def _planet_name_zh(raw: str) -> str:
    s = raw.strip()
    return PLANET_KEY_TO_ZH.get(s.lower(), s)


def _sign_with_zuo(raw: str) -> str:
    s = raw.strip()
    mapped = _SIGN_EN_ZH.get(s.lower())
    if mapped:
        s = mapped
    if s and not s.endswith("座"):
        return f"{s}座"
    return s


def _rewrite_house_evidence(m: re.Match[str]) -> str:
    p = _planet_name_zh(m.group("p"))
    sign = _sign_with_zuo(m.group("sign"))
    h = m.group("h")
    return f"行運{p}在{sign}，落本命第 {h} 宮"


def _rewrite_aspect_evidence(m: re.Match[str]) -> str:
    t = _planet_name_zh(m.group("t"))
    n = _planet_name_zh(m.group("n"))
    a = m.group("a").strip()
    return f"行運{t}{a}本命{n}"


def _replace_english_planets(text: str) -> str:
    out = text
    for en, zh in PLANET_KEY_TO_ZH.items():
        out = _ascii_token(re.escape(en)).sub(zh, out)
    return out


def _replace_english_signs(text: str) -> str:
    out = text
    for en, zh in _SIGN_EN_ZH.items():
        out = _ascii_token(re.escape(en)).sub(f"{zh}座", out)
    return out


def _rewrite_evidence_phrases(text: str) -> str:
    out = _HOUSE_EVIDENCE.sub(_rewrite_house_evidence, text)
    out = _ASPECT_EVIDENCE.sub(_rewrite_aspect_evidence, out)
    out = re.sub(r"落本命宮\s*(\d+)", r"落本命第 \1 宮", out)
    out = _replace_english_planets(out)
    out = _replace_english_signs(out)
    # 殘留的欄位標籤句式
    out = re.sub(r"行運星\s*為\s*", "", out)
    out = re.sub(r"本命點\s*為\s*", "", out)
    out = re.sub(r"相位\s*為\s*", "", out)
    out = re.sub(r"星座\s*為\s*", "在", out)
    out = re.sub(r"行運行星\s*中\s*", "", out)
    out = re.sub(r"行運對本命相位\s*中\s*", "", out)
    return out


def _build_token_replacements() -> list[tuple[re.Pattern[str], str]]:
    out: list[tuple[re.Pattern[str], str]] = []
    for key, zh in _SNAKE_KEY_ZH.items():
        out.append((_ascii_token(re.escape(key)), zh))
    for word, zh in _ASCII_WORD_ZH.items():
        if word in ("high", "medium", "low"):
            continue
        out.append((_ascii_token(re.escape(word)), zh))
    return out


_TOKEN_REPLACEMENTS = _build_token_replacements()

_SNAKE_CATCHALL = re.compile(r"(?<![A-Za-z])[a-z][a-z0-9]*(?:_[a-z0-9]+)+(?![A-Za-z_])", re.IGNORECASE)


def _replace_snake(m: re.Match[str]) -> str:
    key = m.group(0).lower()
    return _SNAKE_KEY_ZH.get(key, "")


def sanitize_transit_ai_text(text: str) -> str:
    if not text:
        return text
    out = text
    for pattern, repl in _REPLACEMENTS:
        out = pattern.sub(repl, out)
    for pattern, repl in _TOKEN_REPLACEMENTS:
        out = pattern.sub(repl, out)
    out = _rewrite_evidence_phrases(out)
    out = _SNAKE_CATCHALL.sub(_replace_snake, out)
    out = re.sub(r"[ \t]{2,}", " ", out)
    out = re.sub(r"\n{3,}", "\n\n", out)
    out = re.sub(r"[，,]\s*[，,]", "，", out)
    return out.strip()
