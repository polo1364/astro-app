"""Build natal summary from calculate_transit / calculate_natal result."""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.data.astrology_kb import PLANET_ZH_TO_KEY


def birth_data_hash(birth_data: dict[str, Any]) -> str:
    raw = json.dumps(birth_data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_natal_points_from_natal(natal: dict[str, Any]) -> dict[str, Any]:
    """Extract natal_points with absolute_degree from raw calculate_natal planets list."""
    points: dict[str, Any] = {}
    chart_json = natal.get("chart_json") or {}
    validity = chart_json.get("chart_validity") or {}

    for p in natal.get("planets") or []:
        name = p.get("name", "")
        if name in ("上升", "中天"):
            key = "asc" if name == "上升" else "mc"
            points[key] = {
                "sign_zh": p.get("sign"),
                "degree": _parse_degree_str(p.get("degree", "0°00′")),
                "absolute_degree": p.get("longitude"),
                "house": p.get("house"),
            }
            continue
        key = PLANET_ZH_TO_KEY.get(name)
        if not key:
            continue
        entry: dict[str, Any] = {
            "sign_zh": p.get("sign"),
            "degree": _parse_degree_str(p.get("degree", "0°00′")),
            "absolute_degree": p.get("longitude"),
            "retrograde": p.get("retrograde", False),
        }
        if validity.get("can_calculate_houses") and p.get("house"):
            entry["house"] = p["house"]
        points[key] = entry

    return points


def build_natal_summary(natal: dict[str, Any], birth_data: dict[str, Any]) -> dict[str, Any]:
    chart_json = natal.get("chart_json") or {}
    validity = chart_json.get("chart_validity") or {}
    return {
        "natal_points": build_natal_points_from_natal(natal),
        "chart_validity": validity,
        "birth_data": birth_data,
    }


def _parse_degree_str(deg_str: str) -> float:
    deg_str = str(deg_str).replace("′", "'").replace("°", " ")
    parts = deg_str.split()
    d = float(parts[0]) if parts else 0.0
    m = float(parts[1].replace("'", "")) / 60 if len(parts) > 1 else 0.0
    return round(d + m, 2)


def build_data_validity(chart_validity: dict[str, Any]) -> dict[str, Any]:
    moon_uncertain = chart_validity.get("moon_uncertain", False)
    return {
        "can_use_houses": bool(chart_validity.get("can_calculate_houses")),
        "can_use_angles": bool(chart_validity.get("can_calculate_ascendant")),
        "can_use_moon_precision": not moon_uncertain,
        "moon_uncertain": moon_uncertain,
        "has_birth_time": bool(chart_validity.get("has_birth_time")),
    }
