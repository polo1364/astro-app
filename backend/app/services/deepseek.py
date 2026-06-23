import asyncio
import json

import httpx

from app import config
from app.data.ai_rules import NATAL_SYSTEM_PROMPT, TRANSIT_SYSTEM_PROMPT
from app.db.api_usage_repo import record_usage
from app.services.transit_ai_context import build_transit_ai_context
from app.services.transit_ai_sanitize import sanitize_transit_ai_text


async def test_connection() -> tuple[bool, str]:
    if not config.DEEPSEEK_API_KEY:
        return False, "尚未設定 API Key"
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.post(
                f"{config.DEEPSEEK_BASE_URL}/chat/completions",
                headers={"Authorization": f"Bearer {config.DEEPSEEK_API_KEY}"},
                json={
                    "model": config.DEEPSEEK_MODEL,
                    "messages": [{"role": "user", "content": "ping"}],
                    "max_tokens": 5,
                },
            )
        if res.status_code == 200:
            return True, "連線成功"
        return False, f"API 回應錯誤：{res.status_code}"
    except Exception as e:
        return False, f"連線失敗：{e}"


async def interpret_chart(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 3000,
    feature: str | None = None,
) -> str:
    if not config.DEEPSEEK_API_KEY:
        raise ValueError("尚未設定 DeepSeek API Key")

    async with httpx.AsyncClient(timeout=90) as client:
        res = await client.post(
            f"{config.DEEPSEEK_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {config.DEEPSEEK_API_KEY}"},
            json={
                "model": config.DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.6,
            },
        )
    if res.status_code != 200:
        raise ValueError(f"DeepSeek API 錯誤：{res.status_code}")
    data = res.json()

    if feature:
        usage = data.get("usage") or {}
        await asyncio.to_thread(
            record_usage,
            feature,
            usage,
            config.DEEPSEEK_MODEL,
        )

    return data["choices"][0]["message"]["content"]


def build_natal_prompt(chart_json: dict) -> str:
    validity = chart_json.get("chart_validity", {})
    if validity.get("blocked"):
        return (
            "chart_json 顯示時區無效，無法換算命盤。"
            "請只回覆：因時區資料不足，無法進行本命盤分析。"
        )

    can = validity.get("can_analyze_labels", [])
    cannot = validity.get("cannot_analyze_labels", [])

    return (
        "以下為唯一可信的命盤資料（chart_json）。你只能根據此 JSON 解讀，禁止自行算盤或補盤。\n\n"
        f"可以分析的項目：{json.dumps(can, ensure_ascii=False)}\n"
        f"不可分析的項目：{json.dumps(cannot, ensure_ascii=False)}\n\n"
        f"chart_json:\n{json.dumps(chart_json, ensure_ascii=False, indent=2)}\n\n"
        "請依系統指示撰寫第三至十段白話分析報告。"
    )


def build_transit_prompt(data: dict) -> str:
    tcj = (
        data.get("transit_chart_json")
        or data.get("transitChartJson")
        or data
    )
    if not tcj or not isinstance(tcj, dict) or not tcj.get("schema_version"):
        raise ValueError("請提供 transit_chart_json（請先計算行運）")

    ctx = build_transit_ai_context(tcj)

    return (
        "以下為唯一可信的行運盤資料摘要（全繁體中文）。你只能根據此資料解讀，禁止自行算盤或補盤。\n\n"
        f"行運盤摘要：\n{json.dumps(ctx, ensure_ascii=False, indent=2)}\n\n"
        "盤面依據寫法範例：\n"
        "錯誤：transit_to_natal_aspects 中，海王星四分火星，orb 1°00′\n"
        "正確：盤面依據：行運海王星四分本命火星，容許 1°00′，入相，優先級高\n"
        "錯誤：行運行星 中 saturn 的 星座 為牡羊、落本命宮 4\n"
        "正確：盤面依據：行運土星在牡羊座，落本命第 4 宮\n"
        "錯誤：行運對本命相位 中 行運星 為火星、本命點 為土星、相位 為合相\n"
        "正確：盤面依據：行運火星合相本命土星，容許 0°07′，強度強\n\n"
        "請依系統指示撰寫 A 至 I 段白話行運分析報告。"
    )


async def interpret_transit_sections(transit_chart_json: dict) -> str:
    prompt = build_transit_prompt({"transit_chart_json": transit_chart_json})
    raw = await interpret_chart(TRANSIT_SYSTEM_PROMPT, prompt, max_tokens=4000, feature="transit")
    return sanitize_transit_ai_text(raw)


async def interpret_natal_sections(chart_json: dict) -> str:
    prompt = build_natal_prompt(chart_json)
    return await interpret_chart(NATAL_SYSTEM_PROMPT, prompt, feature="natal")
