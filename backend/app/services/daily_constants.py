"""Shared constants for public daily horoscope."""

SIGN_IDS = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
]

SIGN_EN_NAMES = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]

SIGN_EN_TO_INDEX = {name: i for i, name in enumerate(SIGN_EN_NAMES)}
SIGN_ID_TO_INDEX = {sid: i for i, sid in enumerate(SIGN_IDS)}

PLANET_KEYS = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
]

HOUSE_PLANET_KEYS = ("sun", "moon", "mercury", "venus", "mars")

REFERENCE_TIMES = ("00:00:00", "12:00:00", "23:59:59")
