"""ORM models for daily horoscope storage."""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class DailySky(Base):
    __tablename__ = "daily_sky"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, unique=True, nullable=False, index=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    ephemeris_engine: Mapped[str] = mapped_column(String(64), nullable=False, default="swiss_ephemeris")
    planet_positions_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    major_aspects_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    moon_events_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    source_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    source_json_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    generation_status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    scheduler_retry_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    passed_sign_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class DailySignSource(Base):
    __tablename__ = "daily_sign_sources"
    __table_args__ = (UniqueConstraint("date", "sign", name="uq_daily_sign_source"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    sign: Mapped[str] = mapped_column(String(32), nullable=False)
    sun_house: Mapped[int] = mapped_column(Integer, nullable=False)
    moon_house: Mapped[int] = mapped_column(Integer, nullable=False)
    mercury_house: Mapped[int] = mapped_column(Integer, nullable=False)
    venus_house: Mapped[int] = mapped_column(Integer, nullable=False)
    mars_house: Mapped[int] = mapped_column(Integer, nullable=False)
    main_houses_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    themes_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    source_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")


class DailyHoroscope(Base):
    __tablename__ = "daily_horoscopes"
    __table_args__ = (UniqueConstraint("date", "sign", name="uq_daily_horoscope"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    sign: Mapped[str] = mapped_column(String(32), nullable=False)
    content_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    model_name: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    prompt_version: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    source_json_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    validation_status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class NatalChart(Base):
    __tablename__ = "natal_charts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    birth_data_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    natal_points_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    chart_validity_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class DailyTransit(Base):
    __tablename__ = "daily_transits"
    __table_args__ = (UniqueConstraint("date", "timezone", name="uq_daily_transit_date_tz"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)
    transit_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class PersonalizedDailyTransit(Base):
    __tablename__ = "personalized_daily_transits"
    __table_args__ = (UniqueConstraint("profile_id", "date", name="uq_personal_daily_transit"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    natal_chart_id: Mapped[int] = mapped_column(Integer, ForeignKey("natal_charts.id"), nullable=False)
    daily_transit_id: Mapped[int] = mapped_column(Integer, ForeignKey("daily_transits.id"), nullable=False)
    source_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class PersonalizedDailyReport(Base):
    __tablename__ = "personalized_daily_reports"
    __table_args__ = (UniqueConstraint("profile_id", "date", name="uq_personal_daily_report"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    content_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    model_name: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    prompt_version: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    validation_status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
