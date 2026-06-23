import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import config
from app.db.session import init_db
from app.routers import daily, interpret, natal, personal_daily, settings, share, transit
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


app = FastAPI(title="Astro Observatory API", version="1.0.0", lifespan=lifespan)

origins = [
    config.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(natal.router)
app.include_router(transit.router)
app.include_router(settings.router)
app.include_router(interpret.router)
app.include_router(daily.router)
app.include_router(personal_daily.router)
app.include_router(share.router)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": "Swiss Ephemeris",
        "api_version": "2",
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
