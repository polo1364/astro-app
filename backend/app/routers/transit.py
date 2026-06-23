from fastapi import APIRouter, HTTPException

from app.models.schemas import InterpretResponse, TransitRequest, TransitResponse
from app.services.deepseek import (
    build_transit_prompt,
    interpret_chart,
    interpret_natal_sections,
)
from app.services.ephemeris import calculate_transit

router = APIRouter()


@router.post("/transit", response_model=TransitResponse)
async def transit_chart(req: TransitRequest):
    try:
        time_val = None if req.birth_time_unknown or not req.time else req.time
        result = calculate_transit(
            name=req.name,
            date=req.date,
            time=time_val,
            tz_name=req.timezone,
            lat=req.latitude,
            lng=req.longitude,
            house_system=req.house_system,
            transit_date=req.transit_date,
            transit_time=req.transit_time,
            location=req.location,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
