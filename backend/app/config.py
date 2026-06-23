import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = os.getenv("DEEPSEEK_MODEL", "deepseek-v4-flash")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
PUBLIC_API_URL = os.getenv("PUBLIC_API_URL", "http://127.0.0.1:8001").rstrip("/")
IS_PRODUCTION = os.getenv("RAILWAY_ENVIRONMENT") is not None

APP_AUTHOR = "蝦蝦"
APP_VERSION = "0.2.0"

_RAW_DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
# Railway 變數引用失敗時可能為空字串，或未解析的 ${{...}} 模板
if (
    not _RAW_DATABASE_URL
    or _RAW_DATABASE_URL.startswith("${{")
    or _RAW_DATABASE_URL == "<empty string>"
):
    DATABASE_URL = f"sqlite:///{BASE_DIR / 'daily_horoscope.db'}"
    DATABASE_BACKEND = "sqlite"
else:
    DATABASE_URL = _RAW_DATABASE_URL
    DATABASE_BACKEND = (
        "postgresql" if DATABASE_URL.startswith("postgresql") else "sqlite"
    )

# Railway postgres:// -> postgresql+psycopg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
    DATABASE_BACKEND = "postgresql"
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    DATABASE_BACKEND = "postgresql"

DAILY_TIMEZONE = os.getenv("DAILY_TIMEZONE", "Asia/Taipei")
DAILY_GENERATION_HOUR = int(os.getenv("DAILY_GENERATION_HOUR", "0"))
DAILY_AI_MAX_RETRIES = int(os.getenv("DAILY_AI_MAX_RETRIES", "2"))
DAILY_SCHEDULER_MAX_RETRIES = int(os.getenv("DAILY_SCHEDULER_MAX_RETRIES", "3"))
DAILY_PROMPT_VERSION = os.getenv("DAILY_PROMPT_VERSION", "public_daily_v1")
PERSONAL_DAILY_PROMPT_VERSION = os.getenv("PERSONAL_DAILY_PROMPT_VERSION", "personal_daily_v1")
PERSONAL_DAILY_AI_MAX_RETRIES = int(os.getenv("PERSONAL_DAILY_AI_MAX_RETRIES", "2"))
PERSONAL_DAILY_ASPECT_CAP = int(os.getenv("PERSONAL_DAILY_ASPECT_CAP", "8"))


def save_deepseek_key(api_key: str) -> None:
    if IS_PRODUCTION:
        raise RuntimeError("Production 環境請透過 Railway Variables 設定 DEEPSEEK_API_KEY")
    lines: list[str] = []
    if ENV_FILE.exists():
        lines = ENV_FILE.read_text(encoding="utf-8").splitlines()
    found = False
    new_lines = []
    for line in lines:
        if line.startswith("DEEPSEEK_API_KEY="):
            new_lines.append(f"DEEPSEEK_API_KEY={api_key}")
            found = True
        else:
            new_lines.append(line)
    if not found:
        new_lines.append(f"DEEPSEEK_API_KEY={api_key}")
    ENV_FILE.write_text("\n".join(new_lines) + "\n", encoding="utf-8")
    global DEEPSEEK_API_KEY
    DEEPSEEK_API_KEY = api_key


def mask_key(key: str) -> str:
    if len(key) < 8:
        return "sk-****"
    return f"sk-****{key[-4:]}"
