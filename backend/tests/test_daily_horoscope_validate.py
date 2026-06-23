"""Tests for daily horoscope validation."""

from app.services.daily_horoscope_ai import generate_rule_based_horoscope
from app.services.daily_horoscope_source import build_daily_horoscope_source
from app.services.daily_horoscope_validate import validate_horoscope_content


def test_rule_based_passes_validation():
    source = build_daily_horoscope_source("2026-06-22")
    content = generate_rule_based_horoscope(source, "aries")
    errors = validate_horoscope_content(content, source, "aries")
    assert errors == [], errors


def test_forbidden_phrase_fails():
    source = build_daily_horoscope_source("2026-06-22")
    content = generate_rule_based_horoscope(source, "aries")
    content["sections"]["theme"] = "今天一定會成功，幸運色是金色"
    errors = validate_horoscope_content(content, source, "aries")
    assert any("禁止" in e for e in errors)
