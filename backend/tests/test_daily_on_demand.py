"""Page-triggered generation must not spend tokens while the app is idle."""

import asyncio
from datetime import date, timedelta
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import config, main
from app.db import daily_repo
from app.db.session import Base, get_db
from app.routers import daily
from app.services import daily_lock, daily_pipeline
from app.services.daily_constants import SIGN_IDS


@pytest.fixture
def isolated(monkeypatch, tmp_path):
    url = f"sqlite:///{tmp_path / 'daily.db'}"
    engine = create_engine(url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    sessions = sessionmaker(bind=engine)
    monkeypatch.setattr(config, "DATABASE_URL", url)
    monkeypatch.setattr(config, "DAILY_SCHEDULER_MAX_RETRIES", 3)
    monkeypatch.setattr(daily_pipeline, "SessionLocal", sessions)
    # Any unexpected real HTTP request is a test failure, never a paid call.
    monkeypatch.setattr(httpx.AsyncClient, "send", AsyncMock(side_effect=AssertionError("HTTP forbidden")))
    today = date(2026, 9, 16)
    monkeypatch.setattr(daily, "today_taipei", lambda: today)
    monkeypatch.setattr(daily_pipeline, "today_taipei", lambda: today)
    calls = []

    async def generate(source, sign):
        calls.append(sign)
        return {"sections": {"theme": f"Test {sign}"}}, "passed"

    monkeypatch.setattr(daily_pipeline, "_generate_one_sign", generate)

    def get_test_db():
        with sessions() as db:
            yield db

    app = FastAPI()
    app.include_router(daily.router)
    app.dependency_overrides[get_db] = get_test_db
    with TestClient(app) as client:
        yield client, sessions, calls, today
    engine.dispose()


def test_startup_and_health_do_not_generate(isolated, monkeypatch):
    from app import scheduler

    def forbidden(*args, **kwargs):
        raise AssertionError("Startup must not start scheduling or generation")

    for name in ("start_scheduler", "startup_catchup_async"):
        monkeypatch.setattr(scheduler, name, forbidden)
        monkeypatch.setattr(main, name, forbidden, raising=False)
    monkeypatch.setattr(main, "init_db", lambda: None)
    with TestClient(main.app) as client:
        assert client.get("/health").status_code == 200
    assert isolated[2] == []


def test_first_visit_generates_twelve_and_reload_uses_cache(isolated):
    client, sessions, calls, today = isolated
    first = client.get("/daily/public")
    assert first.status_code == 200
    assert first.json()["status"] == "pending"
    assert calls == SIGN_IDS
    second = client.get("/daily/public")
    assert second.json()["status"] == "ready"
    assert second.json()["passed_sign_count"] == 12
    assert len(calls) == 12
    with sessions() as db:
        assert daily_repo.all_signs_passed(db, today)


def test_historical_read_does_not_generate(isolated):
    client, _, calls, today = isolated
    assert client.get("/daily/public", params={"date": str(today - timedelta(days=1))}).status_code == 200
    assert calls == []


def test_new_day_requires_another_visit(isolated, monkeypatch):
    client, _, calls, today = isolated
    client.get("/daily/public")
    tomorrow = today + timedelta(days=1)
    monkeypatch.setattr(daily, "today_taipei", lambda: tomorrow)
    monkeypatch.setattr(daily_pipeline, "today_taipei", lambda: tomorrow)
    assert len(calls) == 12
    client.get("/daily/public")
    assert len(calls) == 24


def test_partial_cache_only_generates_missing_signs(isolated):
    client, sessions, calls, today = isolated
    with sessions() as db:
        daily_repo.upsert_horoscope(db, today, "aries", {"sections": {"theme": "existing"}},
                                   model_name="test", prompt_version="test", source_hash="test",
                                   validation_status="passed")
        db.commit()
    client.get("/daily/public")
    assert calls == SIGN_IDS[1:]


def test_concurrent_generators_only_run_one_batch(isolated, monkeypatch):
    _, _, calls, today = isolated

    async def run():
        started, release = asyncio.Event(), asyncio.Event()
        original = daily_pipeline._generate_one_sign

        async def blocked(source, sign):
            started.set()
            await release.wait()
            return await original(source, sign)

        monkeypatch.setattr(daily_pipeline, "_generate_one_sign", blocked)
        first = asyncio.create_task(daily_pipeline.generate_daily_horoscope(today, on_demand=True))
        await asyncio.wait_for(started.wait(), timeout=5)
        try:
            second = await daily_pipeline.generate_daily_horoscope(today, on_demand=True)
            assert second["skipped"] is True
        finally:
            release.set()
            await first

    asyncio.run(run())
    assert calls == SIGN_IDS


def test_failures_stop_at_persisted_retry_limit(isolated, monkeypatch):
    client, sessions, _, today = isolated
    failing = AsyncMock(side_effect=RuntimeError("simulated upstream failure"))
    monkeypatch.setattr(daily_pipeline, "_generate_one_sign", failing)
    for _ in range(4):
        assert client.get("/daily/public").status_code == 200
    for _ in range(2):
        assert client.get("/daily/public").status_code == 503
    assert failing.await_count == 4
    with sessions() as db:
        assert daily_repo.get_sky(db, today).scheduler_retry_count == 4
    assert not daily_lock._local_lock.locked()


def test_final_attempt_remains_pending_while_running(isolated):
    client, sessions, _, today = isolated
    with sessions() as db:
        sky = daily_repo.get_or_create_sky(db, today)
        sky.scheduler_retry_count = 4
        db.commit()
    with sessions() as db, daily_lock.daily_generation_lock(db) as locked:
        assert locked
        response = client.get("/daily/public")
        assert response.status_code == 200
        assert response.json()["status"] == "pending"


def test_manual_generation_keeps_existing_behavior(isolated):
    client, _, calls, today = isolated
    response = client.post("/daily/generate", params={"sync": True})
    assert response.status_code == 200
    assert response.json()["passed_sign_count"] == 12
    assert calls == SIGN_IDS
    client.get("/daily/public")
    assert len(calls) == 12


def test_legacy_job_uses_pipeline_lock_without_double_locking(isolated, monkeypatch):
    from app import scheduler

    _, _, calls, today = isolated
    monkeypatch.setattr(scheduler, "today_taipei", lambda: today)
    scheduler.run_daily_generation_job()
    assert calls == SIGN_IDS
