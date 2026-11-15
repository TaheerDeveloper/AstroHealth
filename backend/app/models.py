from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class MissionModel(Base):
    __tablename__ = "missions"

    id = Column(String(32), primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    location = Column(String(120), nullable=False)
    status = Column(String(64), nullable=False, default="Demonstration")
    duration_days = Column(Integer, nullable=False, default=142)
    target_days = Column(Integer, nullable=False, default=210)
    progress_percent = Column(Integer, nullable=False, default=68)
    vehicle = Column(String(120), nullable=False, default="Orbital Research Station Haven-1")
    objective = Column(
        Text,
        nullable=False,
        default="Long-duration microgravity human physiology, sleep circadian rhythm, and radiation monitoring study.",
    )
    data_type = Column(String(32), nullable=False, default="SIMULATED")


class AstronautModel(Base):
    __tablename__ = "astronauts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    role = Column(String(120), nullable=False)
    specialty = Column(String(160), nullable=False, default="Spaceflight Operations")
    status = Column(String(64), nullable=False, default="Stable")
    mission_id = Column(String(32), ForeignKey("missions.id"), nullable=False, default="ORBITAL-01")
    assigned_day = Column(Integer, nullable=False, default=142)
    eva_hours = Column(Float, nullable=False, default=0.0)
    summary_note = Column(Text, nullable=False, default="")
    data_type = Column(String(32), nullable=False, default="SIMULATED")

    vitals = relationship("VitalReadingModel", back_populates="astronaut", cascade="all, delete-orphan")
    sleep_records = relationship("SleepRecordModel", back_populates="astronaut", cascade="all, delete-orphan")
    wellbeing_records = relationship("WellbeingRecordModel", back_populates="astronaut", cascade="all, delete-orphan")


class VitalReadingModel(Base):
    __tablename__ = "vital_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"), nullable=False, index=True)
    mission_day = Column(Integer, nullable=False, default=142)
    time = Column(String(16), nullable=False)
    timestamp = Column(String(64), nullable=False)
    heart_rate = Column(Integer, nullable=False)
    spo2 = Column(Float, nullable=False, default=98.0)
    systolic_bp = Column(Integer, nullable=False, default=118)
    diastolic_bp = Column(Integer, nullable=False, default=76)
    respiration_rate = Column(Float, nullable=False, default=14.5)
    skin_temp_c = Column(Float, nullable=False, default=36.6)
    activity_context = Column(String(64), nullable=False, default="Nominal station duty")
    unit = Column(String(16), nullable=False, default="BPM")
    data_type = Column(String(32), nullable=False, default="SIMULATED")
    note = Column(Text, nullable=True)

    astronaut = relationship("AstronautModel", back_populates="vitals")


class SleepRecordModel(Base):
    __tablename__ = "sleep_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"), nullable=False, index=True)
    mission_day = Column(Integer, nullable=False, default=142)
    date_label = Column(String(32), nullable=False, default="Mission Day 142")
    duration_hours = Column(Float, nullable=False)
    deep_sleep_hours = Column(Float, nullable=False, default=1.6)
    rem_sleep_hours = Column(Float, nullable=False, default=1.8)
    light_sleep_hours = Column(Float, nullable=False, default=3.8)
    sleep_efficiency = Column(Integer, nullable=False, default=88)
    interruptions = Column(Integer, nullable=False, default=1)
    quality_label = Column(String(32), nullable=False, default="Adequate")
    data_type = Column(String(32), nullable=False, default="SIMULATED")
    note = Column(Text, nullable=True)

    astronaut = relationship("AstronautModel", back_populates="sleep_records")


class WellbeingRecordModel(Base):
    __tablename__ = "wellbeing_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"), nullable=False, index=True)
    mission_day = Column(Integer, nullable=False, default=142)
    timestamp = Column(String(64), nullable=False)
    mood_label = Column(String(64), nullable=False)
    mood_score = Column(Integer, nullable=False)  # 1-5 illustrative self-report scale
    fatigue_level = Column(String(32), nullable=False)  # Low, Moderate, Elevated
    fatigue_score = Column(Integer, nullable=False)  # 1-5 illustrative self-report scale
    stress_level = Column(String(32), nullable=False, default="Low")
    workload_rating = Column(String(32), nullable=False, default="Balanced")
    note = Column(Text, nullable=False)
    data_type = Column(String(32), nullable=False, default="SIMULATED")

    astronaut = relationship("AstronautModel", back_populates="wellbeing_records")


class RadiationRecordModel(Base):
    __tablename__ = "radiation_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    mission_id = Column(String(32), nullable=False, default="ORBITAL-01", index=True)
    mission_day = Column(Integer, nullable=False, default=142)
    timestamp = Column(String(64), nullable=False)
    value = Column(Float, nullable=False)
    cumulative_msv = Column(Float, nullable=False, default=58.4)
    unit = Column(String(16), nullable=False, default="mSv")
    dosimeter_location = Column(String(64), nullable=False, default="Habitat Crew Quarters")
    solar_activity = Column(String(32), nullable=False, default="Quiet")
    data_type = Column(String(32), nullable=False, default="SIMULATED")
    note = Column(Text, nullable=False)


class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"), nullable=True, index=True)
    mission_id = Column(String(32), nullable=False, default="ORBITAL-01")
    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False, default="")
    category = Column(String(64), nullable=False, default="Physiological")
    priority = Column(String(32), nullable=False, default="Information")  # Review, Warning, Information
    timestamp = Column(String(64), nullable=False, default=lambda: datetime.now(timezone.utc).isoformat())
    is_read = Column(Boolean, nullable=False, default=False)
    data_type = Column(String(32), nullable=False, default="SIMULATED")
