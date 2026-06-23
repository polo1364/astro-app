from fastapi import APIRouter, HTTPException

from app.models.schemas import NatalRequest, NatalResponse
from app.services.ephemeris import calculate_natal

router = APIRouter()


@router.post("/natal", response_model=NatalResponse)
async def natal_chart(req: NatalRequest):
    try:
        time_val = None if req.birth_time_unknown or not req.time else req.time
        result = calculate_natal(
            name=req.name,
            date=req.date,
            time=time_val,
            tz_name=req.timezone,
            lat=req.latitude,
            lng=req.longitude,
            house_system=req.house_system,
            location=req.location or req.name,
        )
        return NatalResponse.model_validate(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
