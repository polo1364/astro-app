from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import config
from app.db import api_usage_repo
from app.db.session import get_db
from app.models.schemas import (
    ApiUsageSummary,
    DeepSeekKeyRequest,
    DeepSeekStatusResponse,
    TestResponse,
)
from app.services.deepseek import test_connection

router = APIRouter(prefix="/settings")


@router.get("/deepseek", response_model=DeepSeekStatusResponse)
async def get_deepseek_status():
    configured = bool(config.DEEPSEEK_API_KEY)
    masked = config.mask_key(config.DEEPSEEK_API_KEY) if configured else None
    return {"configured": configured, "maskedKey": masked}


@router.put("/deepseek")
async def save_deepseek_key(req: DeepSeekKeyRequest):
    key = req.api_key.strip()
    if not key.startswith("sk-"):
        raise HTTPException(status_code=400, detail="API Key 格式不正確")
    try:
        config.save_deepseek_key(key)
        return {"success": True}
    except RuntimeError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/deepseek/test", response_model=TestResponse)
async def test_deepseek():
    success, message = await test_connection()
    return {"success": success, "message": message}


@router.get("/api-usage", response_model=ApiUsageSummary)
async def get_api_usage(db: Session = Depends(get_db)):
    summary = api_usage_repo.get_usage_summary(db)
    return summary
