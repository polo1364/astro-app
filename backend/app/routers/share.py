"""Public share endpoints for social preview (Facebook OG)."""

from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app import config
from app.services.share_storage import create_share, get_share

router = APIRouter(prefix="/share", tags=["share"])


def _public_api_base() -> str:
    return config.PUBLIC_API_URL.rstrip("/")


def _share_page_url(token: str) -> str:
    return f"{config.FRONTEND_URL.rstrip('/')}/share/personal/{token}"


def _image_url(token: str) -> str:
    return f"{_public_api_base()}/share/personal-daily/{token}/image.png"


@router.post("/personal-daily")
async def upload_personal_daily_share(
    image: UploadFile = File(...),
    title: str = Form(""),
    description: str = Form(""),
):
    raw = await image.read()
    try:
        record = create_share(
            png_bytes=raw,
            title=title.strip() or "星象觀測台 · 個人今日運勢",
            description=description.strip(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "token": record.token,
        "share_page_url": _share_page_url(record.token),
        "image_url": _image_url(record.token),
    }


@router.get("/personal-daily/{token}/meta")
async def personal_daily_share_meta(token: str):
    record = get_share(token)
    if not record:
        raise HTTPException(status_code=404, detail="分享已過期或不存在")
    return {
        "token": record.token,
        "title": record.title,
        "description": record.description,
        "image_url": _image_url(record.token),
        "share_page_url": _share_page_url(record.token),
    }


@router.get("/personal-daily/{token}/image.png")
async def personal_daily_share_image(token: str):
    record = get_share(token)
    if not record:
        raise HTTPException(status_code=404, detail="分享已過期或不存在")
    return FileResponse(
        record.image_path,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=3600"},
    )
