"""Ephemeral storage for personal daily share images."""

from __future__ import annotations

import json
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from app.config import BASE_DIR

SHARE_DIR = BASE_DIR / "data" / "share_uploads"
TTL_HOURS = 48
MAX_BYTES = 5 * 1024 * 1024


@dataclass
class ShareRecord:
    token: str
    title: str
    description: str
    created_at: datetime
    image_path: Path


def _meta_path(token: str) -> Path:
    return SHARE_DIR / f"{token}.json"


def _image_path(token: str) -> Path:
    return SHARE_DIR / f"{token}.png"


def _ensure_dir() -> None:
    SHARE_DIR.mkdir(parents=True, exist_ok=True)


def cleanup_expired() -> int:
    _ensure_dir()
    removed = 0
    cutoff = datetime.now(timezone.utc) - timedelta(hours=TTL_HOURS)
    for meta_file in SHARE_DIR.glob("*.json"):
        try:
            data = json.loads(meta_file.read_text(encoding="utf-8"))
            created = datetime.fromisoformat(data["created_at"])
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if created < cutoff:
                token = data["token"]
                _image_path(token).unlink(missing_ok=True)
                meta_file.unlink(missing_ok=True)
                removed += 1
        except (OSError, json.JSONDecodeError, KeyError, ValueError):
            meta_file.unlink(missing_ok=True)
            removed += 1
    return removed


def create_share(*, png_bytes: bytes, title: str, description: str) -> ShareRecord:
    if len(png_bytes) > MAX_BYTES:
        raise ValueError("分享圖片過大")
    if not png_bytes.startswith(b"\x89PNG"):
        raise ValueError("僅支援 PNG 圖片")

    cleanup_expired()
    _ensure_dir()
    token = secrets.token_urlsafe(12)
    image_path = _image_path(token)
    image_path.write_bytes(png_bytes)

    created_at = datetime.now(timezone.utc)
    meta = {
        "token": token,
        "title": title,
        "description": description,
        "created_at": created_at.isoformat(),
    }
    _meta_path(token).write_text(
        json.dumps(meta, ensure_ascii=False),
        encoding="utf-8",
    )
    return ShareRecord(
        token=token,
        title=title,
        description=description,
        created_at=created_at,
        image_path=image_path,
    )


def get_share(token: str) -> ShareRecord | None:
    meta_file = _meta_path(token)
    if not meta_file.exists():
        return None
    try:
        data = json.loads(meta_file.read_text(encoding="utf-8"))
        created = datetime.fromisoformat(data["created_at"])
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created < datetime.now(timezone.utc) - timedelta(hours=TTL_HOURS):
            delete_share(token)
            return None
        image_path = _image_path(token)
        if not image_path.exists():
            return None
        return ShareRecord(
            token=data["token"],
            title=data.get("title", ""),
            description=data.get("description", ""),
            created_at=created,
            image_path=image_path,
        )
    except (json.JSONDecodeError, KeyError, ValueError):
        return None


def delete_share(token: str) -> None:
    _image_path(token).unlink(missing_ok=True)
    _meta_path(token).unlink(missing_ok=True)
