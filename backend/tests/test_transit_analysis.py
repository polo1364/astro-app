"""Tests for transit analysis report deduplication and Chinese evidence."""

import json

import pytest

from app.services.transit_ai_context import build_transit_ai_context
from app.services.transit_analysis import build_transit_analysis

ENGLISH_EVIDENCE_MARKERS = (
    "orb=",
    "applying=",
    "priority=",
    "True",
    "False",
    " high",
    " medium",
    " low",
    "transit_",
    "conjunction",
)


def _sample_tcj() -> dict:
    aspects = [
        {
            "transit_planet": "海王星",
            "natal_point": "月亮",
            "aspect_zh": "合相",
            "aspect": "conjunction",
            "orb": 1.21,
            "orb_str": "1°12′",
            "strength": "中",
            "applying": False,
            "priority": "high",
            "in_primary": True,
        },
        {
            "transit_planet": "天王星",
            "natal_point": "金星",
            "aspect_zh": "四分",
            "aspect": "square",
            "orb": 1.33,
            "orb_str": "1°19′",
            "strength": "中",
            "applying": True,
            "priority": "high",
            "in_primary": True,
        },
        {
            "transit_planet": "天王星",
            "natal_point": "土星",
            "aspect_zh": "四分",
            "aspect": "square",
            "orb": 1.61,
            "orb_str": "1°36′",
            "strength": "弱",
            "applying": True,
            "priority": "high",
            "in_primary": True,
        },
        {
            "transit_planet": "天王星",
            "natal_point": "月亮",
            "aspect_zh": "六分",
            "aspect": "sextile",
            "orb": 1.78,
            "orb_str": "1°46′",
            "strength": "弱",
            "applying": True,
            "priority": "high",
            "in_primary": True,
        },
        {
            "transit_planet": "水星",
            "natal_point": "上升",
            "aspect_zh": "四分",
            "aspect": "square",
            "orb": 0.01,
            "orb_str": "0°01′",
            "strength": "強",
            "applying": False,
            "priority": "medium",
            "in_primary": True,
        },
    ]
    return {
        "schema_version": "1.0.0",
        "transit_validity": {
            "has_birth_time": True,
            "has_transit_time": True,
            "can_calculate_natal_houses": True,
            "can_analyze_labels": ["行運對本命相位"],
            "cannot_analyze_labels": [],
        },
        "birth_data": {"date": "1990-01-01", "has_birth_time": True},
        "transit_data": {"date": "2026-05-01", "has_transit_time": True},
        "transit_to_natal_aspects": aspects,
        "transit_planets": {
            "moon": {"name_zh": "月亮", "natal_house": 9, "sign_zh": "天蠍"},
        },
        "active_periods": [
            {
                "transit_planet": "海王星",
                "natal_point": "月亮",
                "aspect": "合相",
                "exact_dates": ["2026-01-29", "2026-08-14"],
            },
        ],
    }


def _all_evidence(report: dict) -> list[str]:
    out: list[str] = []
    for key, sec in report.items():
        if not key.startswith("section") or key == "sections_ai":
            continue
        if not isinstance(sec, dict):
            continue
        out.extend(sec.get("evidence") or [])
    return out


def test_section2_and_section3_not_duplicate():
    report = build_transit_analysis(_sample_tcj())
    s2 = report["section2_highlights"]["text"]
    s3 = report["section3_long_term"]["text"]
    assert s2 != s3
    for sentence in s2.split("\n\n"):
        if sentence.strip():
            assert sentence not in s3


def test_evidence_is_chinese():
    report = build_transit_analysis(_sample_tcj())
    for ev in _all_evidence(report):
        for marker in ENGLISH_EVIDENCE_MARKERS:
            assert marker not in ev, f"Found {marker!r} in {ev!r}"
    aspect_ev = report["section2_highlights"]["evidence"]
    assert len(aspect_ev) > 0
    for ev in aspect_ev:
        assert "容許" in ev
        assert "入相" in ev or "出相" in ev
        assert "優先級" in ev


def test_section8_advice_dedupes_planets():
    report = build_transit_analysis(_sample_tcj())
    text = report["section8_advice"]["text"]
    assert text.count("天王星相關") <= 1


def test_section9_no_duplicate_evidence():
    report = build_transit_analysis(_sample_tcj())
    assert report["section9_summary"]["evidence"] == []


def test_ai_context_no_english_fields():
    ctx = build_transit_ai_context(_sample_tcj())
    raw = json.dumps(ctx, ensure_ascii=False)
    assert "sign_en" not in raw
    assert "conjunction" not in raw
    assert "square" not in raw
    assert "sextile" not in raw
    assert "transit_to_natal_aspects" not in raw
    assert "行運星" in raw
    for asp in ctx["行運對本命相位"]:
        assert asp["相位"] not in ("conjunction", "square", "sextile", "trine", "opposition")
    period = ctx["慢行星精準期"][0]
    assert isinstance(period["精準日"], str)
    assert "2026-01-29" in period["精準日"]
    assert "2026-08-14" in period["精準日"]


def test_ai_context_aspect_fallback_from_english():
    tcj = _sample_tcj()
    for a in tcj["transit_to_natal_aspects"]:
        a.pop("aspect_zh", None)
    ctx = build_transit_ai_context(tcj)
    aspects = ctx["行運對本命相位"]
    assert aspects[0]["相位"] == "合相"
    assert aspects[1]["相位"] == "四分"
