"""Whole-sign solar house derivation per zodiac sign."""

from __future__ import annotations

from typing import Any

from app.services.daily_constants import HOUSE_PLANET_KEYS, SIGN_EN_TO_INDEX, SIGN_IDS
from app.services.daily_themes import (
    dedupe_preserve_order,
    theme_for_aspect,
    theme_for_moon_event,
    themes_for_house,
)


def house_for_planet(target_sign_index: int, planet_sign_en: str) -> int:
    planet_index = SIGN_EN_TO_INDEX[planet_sign_en]
    return (planet_index - target_sign_index) % 12 + 1


def _planet_sign_at_noon(planets: dict[str, Any], key: str) -> str:
    p = planets[key]
    if key == "moon":
        return p["sign"]
    return p["sign"]


def _houses_for_sign(
    target_index: int,
    planets: dict[str, Any],
) -> dict[str, int]:
    return {
        f"{key}_house": house_for_planet(
            target_index,
            _planet_sign_at_noon(planets, key),
        )
        for key in HOUSE_PLANET_KEYS
    }


def _main_houses(houses: dict[str, int]) -> list[int]:
    order = ["sun_house", "moon_house", "mercury_house", "venus_house", "mars_house"]
    seen: set[int] = set()
    result: list[int] = []
    for key in order:
        h = houses[key]
        if h not in seen:
            seen.add(h)
            result.append(h)
    return result


def _aspect_planet_houses(
    target_index: int,
    planets: dict[str, Any],
    planet_key: str,
) -> int:
    sign = _planet_sign_at_noon(planets, planet_key)
    return house_for_planet(target_index, sign)


def _themes_for_sign(
    main_houses: list[int],
    moon_events: list[dict[str, Any]],
    major_aspects: list[dict[str, Any]],
    planets: dict[str, Any],
    target_index: int,
) -> list[str]:
    themes: list[str] = []
    for h in main_houses:
        themes.extend(themes_for_house(h))

    for ev in moon_events:
        event = ev.get("event", "")
        t = ev.get("theme") or theme_for_moon_event(event)
        if t:
            themes.append(t if not t.startswith("moon_in_") else theme_for_moon_event(event) or t)

    for asp in major_aspects:
        p1, p2 = asp["planet1"], asp["planet2"]
        h1 = _aspect_planet_houses(target_index, planets, p1)
        h2 = _aspect_planet_houses(target_index, planets, p2)
        if h1 in main_houses or h2 in main_houses:
            t = asp.get("theme") or theme_for_aspect(p1, p2, asp["aspect"])
            if t:
                themes.append(t)

    return dedupe_preserve_order(themes)


def compute_sign_sources(
    daily_sky: dict[str, Any],
) -> dict[str, dict[str, Any]]:
    planets = daily_sky["planets"]
    moon_events = daily_sky.get("moon_events", [])
    major_aspects = daily_sky.get("major_aspects", [])
    result: dict[str, dict[str, Any]] = {}

    for i, sign_id in enumerate(SIGN_IDS):
        houses = _houses_for_sign(i, planets)
        main_houses = _main_houses(houses)
        themes = _themes_for_sign(
            main_houses, moon_events, major_aspects, planets, i
        )
        result[sign_id] = {
            **houses,
            "main_houses": main_houses,
            "themes": themes,
        }

    return result


# Golden validation: Sun in Cancer -> Aries sun_house = 4
CANCER_SUN_HOUSES: dict[str, int] = {
    "aries": 4,
    "taurus": 3,
    "gemini": 2,
    "cancer": 1,
    "leo": 12,
    "virgo": 11,
    "libra": 10,
    "scorpio": 9,
    "sagittarius": 8,
    "capricorn": 7,
    "aquarius": 6,
    "pisces": 5,
}
