"""Tests for API usage tracking."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.db.api_usage_repo import get_usage_summary, record_usage
from app.db.models import ApiUsageLog
from app.db.session import Base


def _make_session() -> Session:
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def test_record_usage_and_aggregate():
    record_usage("natal", {"prompt_tokens": 100, "completion_tokens": 50, "total_tokens": 150}, "deepseek-v4-flash")
    record_usage("natal", {"prompt_tokens": 200, "completion_tokens": 100, "total_tokens": 300}, "deepseek-v4-flash")
    record_usage("transit", {"prompt_tokens": 80, "completion_tokens": 40, "total_tokens": 120}, "deepseek-v4-flash")

    db = _make_session()
    # Manually insert since record_usage uses SessionLocal from app config
    db.add_all(
        [
            ApiUsageLog(feature="natal", prompt_tokens=100, completion_tokens=50, total_tokens=150, model="m"),
            ApiUsageLog(feature="natal", prompt_tokens=200, completion_tokens=100, total_tokens=300, model="m"),
            ApiUsageLog(feature="transit", prompt_tokens=80, completion_tokens=40, total_tokens=120, model="m"),
        ]
    )
    db.commit()

    summary = get_usage_summary(db)
    assert summary["totals"]["request_count"] == 3
    assert summary["totals"]["prompt_tokens"] == 380
    assert summary["totals"]["completion_tokens"] == 190
    assert summary["totals"]["total_tokens"] == 570

    by_feature = {row["feature"]: row for row in summary["by_feature"]}
    assert by_feature["natal"]["request_count"] == 2
    assert by_feature["natal"]["total_tokens"] == 450
    assert by_feature["natal"]["label_zh"] == "本命解讀"
    assert by_feature["transit"]["request_count"] == 1
    assert by_feature["transit"]["total_tokens"] == 120


def test_record_usage_missing_fields_defaults_to_zero(monkeypatch):
    captured: list[tuple] = []

    class FakeSession:
        def add(self, row):
            captured.append(
                (
                    row.feature,
                    row.prompt_tokens,
                    row.completion_tokens,
                    row.total_tokens,
                    row.model,
                )
            )

        def commit(self):
            pass

        def close(self):
            pass

    def fake_session_local():
        return FakeSession()

    monkeypatch.setattr("app.db.api_usage_repo.SessionLocal", fake_session_local)
    record_usage("public_daily", {}, "deepseek-v4-flash")
    assert captured == [("public_daily", 0, 0, 0, "deepseek-v4-flash")]
