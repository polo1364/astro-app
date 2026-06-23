from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        serialize_by_alias=True,
    )


class NatalRequest(BaseModel):
    name: str = ""
    date: str = Field(..., description="YYYY-MM-DD")
    time: str | None = Field(None, description="HH:MM or null if unknown")
    timezone: str = "Asia/Taipei"
    latitude: float
    longitude: float
    house_system: str = "Placidus"
    location: str = ""
    birth_time_unknown: bool = False


class TransitRequest(NatalRequest):
    transit_date: str = Field(..., description="YYYY-MM-DD")
    transit_time: str | None = Field(None, description="HH:MM or null for noon default")


class TransitAnalysisReport(CamelModel):
    section1_validity: AnalysisSection
    section2_highlights: AnalysisSection
    section3_long_term: AnalysisSection
    section4_mid_term: AnalysisSection
    section5_short_term: AnalysisSection
    section6_life_areas: AnalysisSection
    section7_timing: AnalysisSection
    section8_advice: AnalysisSection
    section9_summary: AnalysisSection
    sections_ai: str | None = None


class PlanetOut(CamelModel):
    name: str
    sign: str
    degree: str
    house: int = 0
    retrograde: bool
    longitude: float | None = None


class AspectOut(CamelModel):
    planet_a: str
    type: str
    planet_b: str
    orb: str
    strength: str
    moon_uncertain: bool | None = None


class HouseOut(CamelModel):
    number: int
    sign: str
    degree: str
    longitude: float | None = None


class ElementStat(CamelModel):
    element: str
    count: int
    percent: int


class PatternOut(CamelModel):
    name: str
    planets: list[str]
    description: str


class StatsOut(CamelModel):
    dominant_element: str
    dominant_modality: str
    chart_shape: str
    retrograde_count: int


class MetaOut(CamelModel):
    name: str
    birth_date: str
    birth_time: str
    timezone: str
    latitude: str
    longitude: str
    house_system: str
    utc: str
    julian_day: str
    engine: str
    has_birth_time: bool = True
    location: str = ""


class AnalysisSection(CamelModel):
    title: str
    lines: list[str] = []
    text: str = ""
    evidence: list[str] = []


class NatalAnalysisReport(CamelModel):
    section1_validity: AnalysisSection
    section2_core_summary: AnalysisSection
    sections_ai: str | None = None


class ChartJson(CamelModel):
    model_config = ConfigDict(extra="allow")


class NatalResponse(CamelModel):
    meta: MetaOut
    planets: list[PlanetOut]
    aspects: list[AspectOut]
    houses: list[HouseOut]
    elements: list[ElementStat]
    patterns: list[PatternOut]
    stats: StatsOut
    chart_json: dict
    analysis: NatalAnalysisReport


class TransitAspectOut(CamelModel):
    transit_planet: str
    type: str
    natal_planet: str
    natal_point: str | None = None
    orb: str
    orb_deg: float | None = None
    strength: str
    applying: bool
    priority: str = "medium"
    in_primary: bool = True


class TransitPlanetOut(CamelModel):
    name: str
    sign: str
    degree: str
    retrograde: bool
    longitude: float | None = None
    natal_house: int | None = None


class TransitResponse(CamelModel):
    natal: NatalResponse
    transit_date: str
    transit_time: str | None = None
    transit_planets: list[TransitPlanetOut]
    transit_aspects: list[TransitAspectOut]
    transit_aspects_appendix: list[TransitAspectOut] = []
    transit_chart_json: dict
    analysis: TransitAnalysisReport


class DeepSeekKeyRequest(BaseModel):
    api_key: str = Field(..., alias="apiKey")

    model_config = {"populate_by_name": True}


class DeepSeekStatusResponse(CamelModel):
    configured: bool
    masked_key: str | None = None


class TestResponse(BaseModel):
    success: bool
    message: str


class InterpretResponse(BaseModel):
    text: str
    sections_ai: str | None = None


class PersonalDailySections(CamelModel):
    theme: str
    work: str
    love: str
    money: str
    health: str
    advice: str
    evidence: str


class PersonalDailyDataValidity(CamelModel):
    can_use_houses: bool = False
    can_use_angles: bool = False
    can_use_moon_precision: bool = True
    moon_uncertain: bool = False
    has_birth_time: bool = False


class PersonalDailyRequest(BaseModel):
    profile_id: str
    birth_data: NatalRequest
    date: str | None = None
    timezone: str | None = None
    force: bool = False


class PersonalDailyResponse(CamelModel):
    profile_id: str
    date: str
    status: str
    data_validity: PersonalDailyDataValidity
    sections: PersonalDailySections
    validation_status: str
    cached: bool = False
    model_name: str | None = None
