"""Repository for DeepSeek API usage tracking."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import ApiUsageLog
from app.db.session import SessionLocal

FEATURE_LABELS: dict[str, str] = {
    "natal": "本命解讀",
    "transit": "行運解讀",
    "public_daily": "每日運勢（公開）",
    "personal_daily": "每日運勢（個人）",
}


def record_usage(feature: str, usage_dict: dict[str, Any], model: str) -> None:
    """Write a usage log row; silently ignore DB failures."""
    try:
        db = SessionLocal()
        try:
            db.add(
                ApiUsageLog(
                    feature=feature,
                    prompt_tokens=int(usage_dict.get("prompt_tokens") or 0),
                    completion_tokens=int(usage_dict.get("completion_tokens") or 0),
                    total_tokens=int(usage_dict.get("total_tokens") or 0),
                    model=model or "",
                )
            )
            db.commit()
        finally:
            db.close()
    except Exception:
        pass


def get_usage_summary(db: Session) -> dict[str, Any]:
    rows = db.execute(
        select(
            ApiUsageLog.feature,
            func.count().label("request_count"),
            func.coalesce(func.sum(ApiUsageLog.prompt_tokens), 0).label("prompt_tokens"),
            func.coalesce(func.sum(ApiUsageLog.completion_tokens), 0).label("completion_tokens"),
            func.coalesce(func.sum(ApiUsageLog.total_tokens), 0).label("total_tokens"),
        ).group_by(ApiUsageLog.feature)
    ).all()

    by_feature: list[dict[str, Any]] = []
    total_requests = 0
    total_prompt = 0
    total_completion = 0
    total_tokens = 0

    for row in rows:
        count = int(row.request_count)
        prompt = int(row.prompt_tokens)
        completion = int(row.completion_tokens)
        tokens = int(row.total_tokens)
        total_requests += count
        total_prompt += prompt
        total_completion += completion
        total_tokens += tokens
        by_feature.append(
            {
                "feature": row.feature,
                "label_zh": FEATURE_LABELS.get(row.feature, row.feature),
                "request_count": count,
                "prompt_tokens": prompt,
                "completion_tokens": completion,
                "total_tokens": tokens,
            }
        )

    by_feature.sort(key=lambda x: x["feature"])

    return {
        "totals": {
            "request_count": total_requests,
            "prompt_tokens": total_prompt,
            "completion_tokens": total_completion,
            "total_tokens": total_tokens,
        },
        "by_feature": by_feature,
    }
