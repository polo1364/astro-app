"""Tests for personal daily filter."""

from app.services.personal_daily_filter import filter_personal_aspects


def _aspect(transit: str, natal: str, orb: float, priority: str = "high"):
    return {
        "transit_planet": transit,
        "natal_point": natal,
        "aspect": "square",
        "aspect_zh": "刑",
        "orb": orb,
        "priority": priority,
    }


def test_filter_caps_at_eight():
    aspects = [
        _aspect("sun", "moon", 0.5 + i * 0.1, "high" if i < 4 else "medium")
        for i in range(12)
    ]
    main, summary = filter_personal_aspects(aspects)
    assert len(main) <= 8
    assert summary["filtered_out_count"] >= 4


def test_outer_planets_excluded():
    aspects = [
        _aspect("saturn", "sun", 1.0),
        _aspect("mars", "venus", 1.2),
    ]
    main, summary = filter_personal_aspects(aspects)
    assert all(a["transit_planet"] != "saturn" for a in main)
    assert summary["filtered_out_count"] >= 1


def test_theme_labels_are_chinese():
    aspects = [
        _aspect("mars", "saturn", 1.0),
        {
            "transit_planet": "venus",
            "natal_point": "moon",
            "aspect": "trine",
            "aspect_zh": "三分",
            "orb": 1.1,
            "priority": "high",
        },
    ]
    main, summary = filter_personal_aspects(aspects)
    for a in main:
        assert "theme_zh" in a
        assert "_" not in a["theme_zh"]
    for label in (
        summary["main_themes"]
        + summary["caution_themes"]
        + summary["supportive_themes"]
    ):
        assert "_" not in label
