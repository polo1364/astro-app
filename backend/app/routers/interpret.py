from fastapi import APIRouter, HTTPException

from app.models.schemas import InterpretResponse
from app.services.deepseek import interpret_natal_sections, interpret_transit_sections

router = APIRouter(prefix="/interpret")


@router.post("/natal", response_model=InterpretResponse)
async def interpret_natal(body: dict):
    try:
        chart_json = body.get("chart_json") or body.get("chartJson")
        if not chart_json:
            raise ValueError("請提供 chart_json（請先計算命盤）")
        text = await interpret_natal_sections(chart_json)
        return {"text": text, "sections_ai": text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/transit", response_model=InterpretResponse)
async def interpret_transit(body: dict):
    try:
        tcj = body.get("transit_chart_json") or body.get("transitChartJson")
        if not tcj:
            raise ValueError("請提供 transit_chart_json（請先計算行運）")
        text = await interpret_transit_sections(tcj)
        return {"text": text, "sections_ai": text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
