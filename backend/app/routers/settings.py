from fastapi import APIRouter, HTTPException
from app import config
from app.models.schemas import DeepSeekKeyRequest, DeepSeekStatusResponse, TestResponse
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
