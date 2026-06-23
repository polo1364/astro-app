"""Normalize planet/aspect keys for personal daily source and trigger matching."""

from __future__ import annotations

from app.data.personal_daily_labels import (
    aspect_zh_for_evidence,
    normalize_aspect_to_en,
    normalize_planet_to_key,
    planet_zh,
)


def normalize_aspect_record(
    *,
    transit_planet: str,
    natal_point: str,
    aspect: str,
    orb: float,
    **extra,
) -> dict:
    t_key = normalize_planet_to_key(transit_planet)
    n_key = normalize_planet_to_key(natal_point)
    asp_en = normalize_aspect_to_en(aspect)
    return {
        "transit_planet": t_key,
        "transit_planet_zh": planet_zh(transit_planet),
        "natal_point": n_key,
        "natal_point_zh": planet_zh(natal_point),
        "aspect": asp_en,
        "aspect_zh": aspect_zh_for_evidence(asp_en),
        "orb": round(float(orb), 2),
        **extra,
    }


def aspect_match_key(transit_planet: str, natal_point: str, aspect: str) -> tuple[str, str, str]:
    return (
        normalize_planet_to_key(transit_planet),
        normalize_planet_to_key(natal_point),
        normalize_aspect_to_en(aspect),
    )
