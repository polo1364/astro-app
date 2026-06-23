"""Tests for personal daily validate."""

from app.services.personal_daily_validate import validate_personal_horoscope


def _source(aspects=None, can_houses=True, moon_precision=True):
    return {
        "daily_transit_to_natal_aspects": aspects or [
            {
                "transit_planet": "mars",
                "natal_point": "saturn",
                "aspect": "square",
                "aspect_zh": "刑",
                "orb": 1.6,
            }
        ],
        "data_validity": {
            "can_use_houses": can_houses,
            "can_use_moon_precision": moon_precision,
        },
    }


def _content():
    return {
        "sections": {
            "theme": "今天的重點落在工作節奏、人際互動與行動壓力。你可能會覺得事情需要推進，但同時又有規則、責任或現實限制卡住。",
            "work": "適合處理已經排好的任務，不適合臨時硬改流程。若有溝通或會議，建議先確認界線與分工。",
            "love": "情緒互動宜柔和表達需求。若有壓力，避免用急躁語氣直接丟給對方。",
            "money": "今天不適合衝動做高風險決定。需要時間確認的事情，先保留彈性。",
            "health": "注意疲勞、肩頸緊繃與急躁感，避免把壓力轉成硬撐。",
            "advice": "先穩住節奏，再推進行動。今天的關鍵不是快，而是不要被壓力牽著跑。",
            "evidence": "行運火星刑本命土星，容許 1.6°，提示行動與限制之間的摩擦；行運月亮三分本命金星，容許 1.1°，提供情緒支持。",
        }
    }


def test_allows_benming_in_evidence():
    errors = validate_personal_horoscope(_content(), _source())
    assert "本命" not in str([e for e in errors if "禁止" in e])


def test_blocks_house_without_birth_time():
    content = _content()
    content["sections"]["evidence"] += "；今日第 6 宮被觸發。"
    errors = validate_personal_horoscope(content, _source(can_houses=False))
    assert any("宮位" in e for e in errors)


def test_word_count_range():
    errors = validate_personal_horoscope(_content(), _source())
    assert not any("字數不符" in e for e in errors)
