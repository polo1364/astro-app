"""Tests for personal daily ephemeris."""

from app.services.personal_daily_ephemeris import build_daily_transit_json


def test_daily_transit_three_moon_slots():
    doc = build_daily_transit_json("2026-06-23", "Asia/Taipei")
    moon = doc["planets"]["moon"]
    assert "start" in moon
    assert "midday" in moon
    assert "end" in moon
    assert "absolute_degree" not in moon["midday"]  # uses longitude key
    assert "longitude" in moon["midday"]
    assert doc["source_hash"]


def test_reference_times():
    doc = build_daily_transit_json("2026-06-23", "Asia/Taipei")
    assert doc["reference_times"] == ["00:00:00", "12:00:00", "23:59:59"]
