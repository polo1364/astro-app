"""Tests for AI transit report sanitization."""

import re

import pytest

from app.services.transit_ai_sanitize import sanitize_transit_ai_text

FORBIDDEN = (
    "transit_to_natal_aspects",
    "transit_planets",
    "transit_validity",
    "natal_house",
    "exact_dates",
    "can_analyze",
    "cannot_analyze",
    "active_periods",
    "in_primary",
    "schema_version",
)

ORB_PATTERN = re.compile(r"\borb\s", re.IGNORECASE)


@pytest.mark.parametrize(
    "raw",
    [
        "盤面依據：transit_to_natal_aspects 中，海王星四分火星，orb 1°00′",
        "根據 transit_validity 中的 can_analyze，可分析行運相位。",
        "active_periods 中，海王星合相月亮，exact_dates 為 2026-01-29",
        "行運木星 natal_house 為 7",
        "transit_planets 中，月亮落天蠍座",
        "transit_planet 海王星與 natal_point 月亮，priority: high",
        "birth_data 顯示 has_birth_time 為 true",
    ],
)
def test_sanitize_removes_english_keys(raw: str):
    out = sanitize_transit_ai_text(raw)
    for key in FORBIDDEN:
        assert key not in out.lower(), f"still has {key!r} in {out!r}"
    assert ORB_PATTERN.search(out) is None, f"still has orb in {out!r}"


def test_sanitize_preserves_chinese_evidence():
    good = "盤面依據：行運海王星四分本命火星，容許 1°00′，入相，優先級高"
    assert sanitize_transit_ai_text(good) == good


def test_sanitize_c_d_section_samples():
    sample = (
        "盤面依據：行運行星 中 saturn 的 星座 為牡羊、落本命宮 4。"
        "盤面依據：行運對本命相位 中 行運星 為火星、本命點 為土星、相位 為合相。"
    )
    out = sanitize_transit_ai_text(sample)
    assert "saturn" not in out.lower()
    assert "uranus" not in out.lower()
    assert "行運星 為" not in out
    assert "本命點 為" not in out
    assert "相位 為" not in out
    assert "星座 為" not in out
    assert "行運土星在牡羊座，落本命第 4 宮" in out
    assert "行運火星合相本命土星" in out
