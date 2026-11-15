from typing import Literal, Optional
from pydantic import BaseModel, Field

DataSourceType = Literal[
    "NASA_RESEARCH",
    "SIMULATED",
    "MANUAL",
    "SENSOR",
    "AI_DERIVED",
]


class VitalCreateRequest(BaseModel):
    astronaut_id: int = Field(..., ge=1, description="ID of the astronaut")
    mission_day: int = Field(default=142, ge=1)
    time: Optional[str] = Field(default=None, description="HH:MM time string")
    heart_rate: int = Field(..., ge=35, le=220, description="Heart rate in BPM")
    spo2: float = Field(default=98.0, ge=70.0, le=100.0, description="Blood oxygen saturation (%)")
    systolic_bp: int = Field(default=118, ge=70, le=220, description="Systolic blood pressure (mmHg)")
    diastolic_bp: int = Field(default=76, ge=40, le=140, description="Diastolic blood pressure (mmHg)")
    respiration_rate: float = Field(default=14.5, ge=6.0, le=45.0, description="Breaths per minute")
    skin_temp_c: float = Field(default=36.6, ge=33.0, le=41.5, description="Skin temperature in Celsius")
    activity_context: str = Field(default="Manual Crew Log", max_length=64)
    note: Optional[str] = Field(default=None, max_length=500)
    data_type: DataSourceType = Field(default="MANUAL")


class SleepCreateRequest(BaseModel):
    astronaut_id: int = Field(..., ge=1)
    mission_day: int = Field(default=142, ge=1)
    duration_hours: float = Field(..., ge=0.5, le=16.0)
    deep_sleep_hours: float = Field(default=1.5, ge=0.0, le=10.0)
    rem_sleep_hours: float = Field(default=1.6, ge=0.0, le=10.0)
    sleep_efficiency: int = Field(default=86, ge=30, le=100)
    interruptions: int = Field(default=1, ge=0, le=20)
    quality_label: str = Field(default="Adequate", max_length=32)
    note: Optional[str] = Field(default=None, max_length=500)
    data_type: DataSourceType = Field(default="MANUAL")


class WellbeingCreateRequest(BaseModel):
    astronaut_id: int = Field(..., ge=1)
    mission_day: int = Field(default=142, ge=1)
    mood_label: str = Field(..., min_length=2, max_length=64)
    mood_score: int = Field(..., ge=1, le=5)
    fatigue_level: Literal["Low", "Moderate", "Elevated"] = Field(default="Low")
    fatigue_score: int = Field(default=2, ge=1, le=5)
    stress_level: Literal["Low", "Moderate", "Elevated"] = Field(default="Low")
    workload_rating: Literal["Light", "Balanced", "High"] = Field(default="Balanced")
    note: str = Field(..., min_length=2, max_length=600)
    data_type: DataSourceType = Field(default="MANUAL")


class RadiationCreateRequest(BaseModel):
    mission_id: str = Field(default="ORBITAL-01", max_length=32)
    mission_day: int = Field(default=142, ge=1)
    value: float = Field(..., ge=0.0, le=50.0)
    cumulative_msv: Optional[float] = Field(default=None, ge=0.0)
    unit: str = Field(default="mSv", max_length=16)
    dosimeter_location: str = Field(default="Habitat Crew Quarters", max_length=64)
    solar_activity: str = Field(default="Quiet", max_length=32)
    note: str = Field(default="Manually entered demonstration radiation log.", max_length=500)
    data_type: DataSourceType = Field(default="MANUAL")


class AIQuestionRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    astronaut_id: Optional[int] = Field(default=None)
