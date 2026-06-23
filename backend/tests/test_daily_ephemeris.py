"""Tests for daily ephemeris, houses, and aspects."""

from app.services.daily_horoscope_source import build_daily_horoscope_source
from app.services.daily_sign_houses import CANCER_SUN_HOUSES, house_for_planet


def test_house_formula_sun_in_cancer():
    # Sun in Cancer (index 3)
    for sign_id, expected in CANCER_SUN_HOUSES.items():
        got = house_for_planet(
            {"aries": 0, "taurus": 1, "gemini": 2, "cancer": 3, "leo": 4,
             "virgo": 5, "libra": 6, "scorpio": 7, "sagittarius": 8,
             "capricorn": 9, "aquarius": 10, "pisces": 11}[sign_id],
            "Cancer",
        )
        assert got == expected, f"{sign_id}: expected {expected}, got {got}"


def test_build_source_structure():
    doc = build_daily_horoscope_source("2026-06-22")
    assert doc["type"] == "public_12_sign_daily_horoscope"
    assert "daily_sky" in doc
    assert "planets" in doc["daily_sky"]
    assert "sun" in doc["daily_sky"]["planets"]
    assert len(doc["sign_horoscopes_source"]) == 12
    assert "aries" in doc["sign_horoscopes_source"]
    src = doc["sign_horoscopes_source"]["aries"]
    assert "sun_house" in src
    assert "themes" in src
    assert doc.get("source_json_hash")


def test_major_aspects_present():
    doc = build_daily_horoscope_source("2026-06-22")
    aspects = doc["daily_sky"]["major_aspects"]
    assert isinstance(aspects, list)
    for a in aspects:
        assert "planet1" in a
        assert "aspect" in a
        assert a["orb"] <= 3.0
