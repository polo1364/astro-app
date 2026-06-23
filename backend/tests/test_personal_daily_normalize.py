"""Tests for personal daily normalize."""

from app.services.personal_daily_normalize import aspect_match_key, normalize_aspect_record


def test_normalize_aspect_square_to_xing():
    rec = normalize_aspect_record(
        transit_planet="火星",
        natal_point="土星",
        aspect="四分",
        orb=1.6,
    )
    assert rec["aspect"] == "square"
    assert rec["aspect_zh"] == "刑"
    assert rec["transit_planet"] == "mars"
    assert rec["natal_point"] == "saturn"


def test_aspect_match_key_bilingual():
    a = aspect_match_key("火星", "土星", "四分")
    b = aspect_match_key("mars", "saturn", "square")
    assert a == b
