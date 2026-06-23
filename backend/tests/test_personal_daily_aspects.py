"""Tests for personal daily aspects moon dedup."""

from unittest.mock import patch

from app.services.personal_daily_aspects import build_personal_aspects


SAMPLE = {
    "name": "測試",
    "birth_date": "1995-08-14",
    "birth_time": "14:32",
    "timezone": "Asia/Taipei",
    "lat": 25.033,
    "lng": 121.5654,
    "house_system": "Placidus",
    "location": "台北",
    "transit_date": "2026-06-23",
}


def test_single_moon_aspect_per_pair():
    transit, aspects = build_personal_aspects(**SAMPLE)
    moon_aspects = [a for a in aspects if a["transit_planet"] == "moon"]
    keys = {(a["natal_point"], a["aspect"]) for a in moon_aspects}
    assert len(moon_aspects) == len(keys)
    assert "natal" in transit


def test_calculate_transit_called_once():
    call_count = 0
    original = __import__(
        "app.services.personal_daily_aspects", fromlist=["calculate_transit"]
    ).calculate_transit

    def counting_transit(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        return original(*args, **kwargs)

    with patch(
        "app.services.personal_daily_aspects.calculate_transit",
        side_effect=counting_transit,
    ):
        build_personal_aspects(**SAMPLE)
    assert call_count == 1
