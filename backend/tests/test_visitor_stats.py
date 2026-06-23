"""Tests for homepage visitor statistics."""

from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import models as _models  # noqa: F401
from app.db.models import HomeVisitorLog
from app.db.session import Base, get_db
from app.db import visitor_repo
from app.main import app


def _make_db_session(tmp_path=None):
    if tmp_path is not None:
        db_url = f"sqlite:///{tmp_path / 'test.db'}"
    else:
        db_url = "sqlite:///:memory:"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


def test_same_day_same_visitor_no_increment():
    db = _make_db_session()
    vid = str(uuid4())

    first = visitor_repo.record_home_visit(vid, db)
    second = visitor_repo.record_home_visit(vid, db)

    assert first["recorded"] is True
    assert first["total_count"] == 1
    assert second["recorded"] is False
    assert second["total_count"] == 1


def test_different_visitors_same_day():
    db = _make_db_session()
    a = visitor_repo.record_home_visit(str(uuid4()), db)
    b = visitor_repo.record_home_visit(str(uuid4()), db)

    assert a["total_count"] == 1
    assert b["recorded"] is True
    assert b["total_count"] == 2


def test_next_day_same_visitor_increments(monkeypatch):
    db = _make_db_session()
    vid = str(uuid4())
    day1 = date(2026, 6, 23)
    day2 = date(2026, 6, 24)

    monkeypatch.setattr("app.db.visitor_repo.today_taipei", lambda: day1)
    first = visitor_repo.record_home_visit(vid, db)
    assert first["total_count"] == 1

    monkeypatch.setattr("app.db.visitor_repo.today_taipei", lambda: day2)
    second = visitor_repo.record_home_visit(vid, db)
    assert second["recorded"] is True
    assert second["total_count"] == 2


def test_invalid_visitor_id_returns_400(tmp_path):
    db = _make_db_session(tmp_path)

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        res = client.post("/stats/home-visit", json={"visitorId": "not-a-uuid"})
        assert res.status_code == 400
    finally:
        app.dependency_overrides.clear()


def test_client_date_field_ignored(tmp_path):
    db = _make_db_session(tmp_path)
    vid = str(uuid4())

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app)
        res = client.post(
            "/stats/home-visit",
            json={"visitorId": vid, "date": "2099-01-01"},
        )
        assert res.status_code == 200
        assert res.json()["totalCount"] == 1
        row = db.query(HomeVisitorLog).one()
        assert row.visitor_id == vid
        assert row.date != date(2099, 1, 1)
    finally:
        app.dependency_overrides.clear()


def test_get_visitors_total():
    db = _make_db_session()
    db.add(
        HomeVisitorLog(
            date=date(2026, 6, 23),
            visitor_id=str(uuid4()),
        )
    )
    db.add(
        HomeVisitorLog(
            date=date(2026, 6, 24),
            visitor_id=str(uuid4()),
        )
    )
    db.commit()
    assert visitor_repo.get_visitor_total(db) == 2
