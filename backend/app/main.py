import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.db.session import init_db
from app.routers import daily, interpret, natal, personal_daily, settings, share, stats, transit
from app.scheduler import shutdown_scheduler, start_scheduler, startup_catchup_async

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_scheduler()
    try:
        await startup_catchup_async()
    except Exception as exc:
        logger.warning("Startup catchup failed: %s", exc)
    yield
    shutdown_scheduler()


app = FastAPI(
    title="Astro Observatory API",
    version=config.APP_VERSION,
    lifespan=lifespan,
)

local_origins = [
    config.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    *(o.strip().rstrip("/") for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()),
]
local_origins = list(dict.fromkeys(local_origins))

cors_kwargs: dict = {
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

if config.IS_PRODUCTION:
    # Railway 前端網域可能變更；避免 FRONTEND_URL 漏設或尾端斜線導致 CORS 失敗
    cors_kwargs["allow_origin_regex"] = r"https://.*\.up\.railway\.app"
else:
    cors_kwargs["allow_origins"] = local_origins

app.add_middleware(CORSMiddleware, **cors_kwargs)

app.include_router(natal.router)
app.include_router(transit.router)
app.include_router(settings.router)
app.include_router(interpret.router)
app.include_router(daily.router)
app.include_router(personal_daily.router)
app.include_router(share.router)
app.include_router(stats.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "Swiss Ephemeris",
        "api_version": "2",
        "app_version": config.APP_VERSION,
        "author": config.APP_AUTHOR,
        "database": config.DATABASE_BACKEND,
        "features": [
            "chart_json",
            "natal_analysis",
            "transit",
            "transit_analysis",
            "daily_horoscope",
            "personal_daily_horoscope",
            "personal_daily_share",
        ],
    }
