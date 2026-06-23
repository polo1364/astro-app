"""APScheduler jobs for daily horoscope generation."""

from __future__ import annotations

import logging
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app import config
from app.db.daily_repo import all_signs_passed, get_sky, increment_scheduler_retry
from app.db.session import SessionLocal
from app.services.daily_lock import daily_generation_lock
from app.services.daily_pipeline import (
    generate_daily_horoscope,
    generate_daily_horoscope_sync,
    today_taipei,
)

logger = logging.getLogger(__name__)
TZ = ZoneInfo(config.DAILY_TIMEZONE)

scheduler = BackgroundScheduler(timezone=TZ)


def run_daily_generation_job() -> None:
    today = today_taipei()
    db = SessionLocal()
    try:
        with daily_generation_lock(db) as locked:
            if not locked:
                logger.info("Daily generation skipped: lock busy")
                return
            result = generate_daily_horoscope_sync(today, force=False)
            logger.info("Daily generation done: %s", result)
    finally:
        db.close()


def run_daily_retry_check() -> None:
    today = today_taipei()
    db = SessionLocal()
    try:
        if all_signs_passed(db, today):
            return
        sky = get_sky(db, today)
        if sky and sky.scheduler_retry_count >= config.DAILY_SCHEDULER_MAX_RETRIES:
            logger.warning("Daily retry limit reached for %s", today)
            return
        with daily_generation_lock(db) as locked:
            if not locked:
                return
            increment_scheduler_retry(db, today)
            db.commit()
            result = generate_daily_horoscope_sync(today, force=False)
            logger.info("Daily retry generation: %s", result)
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(
        run_daily_generation_job,
        CronTrigger(hour=0, minute=0, second=0, timezone=TZ),
        id="daily_public_horoscope_midnight",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
        misfire_grace_time=3600,
    )
    scheduler.add_job(
        run_daily_retry_check,
        CronTrigger(minute="15,30,45", hour="0-2", timezone=TZ),
        id="daily_public_horoscope_retry",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    scheduler.start()
    logger.info("Daily horoscope scheduler started")


def shutdown_scheduler() -> None:
    if scheduler.running:
        scheduler.shutdown(wait=False)


def startup_catchup() -> None:
    """Sync entry for scripts; prefer startup_catchup_async inside FastAPI lifespan."""
    today = today_taipei()
    db = SessionLocal()
    try:
        if not all_signs_passed(db, today):
            logger.info("Startup catchup: generating horoscope for %s", today)
            run_daily_generation_job()
    finally:
        db.close()


async def startup_catchup_async() -> None:
    today = today_taipei()
    db = SessionLocal()
    try:
        if not all_signs_passed(db, today):
            logger.info("Startup catchup: generating horoscope for %s", today)
            await generate_daily_horoscope(today, force=False)
    finally:
        db.close()
