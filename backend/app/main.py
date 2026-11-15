from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.ai_service import answer_health_question, generate_health_summary
from app.config import settings
from app.database import get_database_status, get_db
from app.models import (
    AlertModel,
    AstronautModel,
    MissionModel,
    RadiationRecordModel,
    SleepRecordModel,
    VitalReadingModel,
    WellbeingRecordModel,
)
from app.nasa_service import fetch_nasa_osdr_research
from app.schemas import (
    AIQuestionRequest,
    RadiationCreateRequest,
    SleepCreateRequest,
    VitalCreateRequest,
    WellbeingCreateRequest,
)
from app.seed import init_and_seed_db


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_and_seed_db()
    yield


# ==========================================
# ASTROHEALTH APPLICATION
# ==========================================

app = FastAPI(
    title="AstroHealth API",
    description=(
        "Intelligent Health Monitoring Beyond Earth. "
        "An independent student research prototype for NASA Space Apps Challenge 2026 (Challenge 5)."
    ),
    version=settings.APP_VERSION,
    lifespan=lifespan,
)


# ==========================================
# FRONTEND CONNECTION (CORS)
# ==========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# SERIALIZATION HELPERS
# ==========================================


def serialize_mission(m: MissionModel) -> dict[str, Any]:
    return {
        "id": m.id,
        "name": m.name,
        "location": m.location,
        "status": m.status,
        "duration_days": m.duration_days,
        "target_days": m.target_days,
        "progress_percent": m.progress_percent,
        "vehicle": m.vehicle,
        "objective": m.objective,
        "data_type": m.data_type,
    }


def serialize_vital(v: VitalReadingModel, astronaut_name: Optional[str] = None) -> dict[str, Any]:
    return {
        "id": v.id,
        "astronaut_id": v.astronaut_id,
        "astronaut_name": astronaut_name or (v.astronaut.name if v.astronaut else f"Astronaut {v.astronaut_id}"),
        "mission_day": v.mission_day,
        "time": v.time,
        "timestamp": v.timestamp,
        "heart_rate": v.heart_rate,
        "spo2": v.spo2,
        "systolic_bp": v.systolic_bp,
        "diastolic_bp": v.diastolic_bp,
        "respiration_rate": v.respiration_rate,
        "skin_temp_c": v.skin_temp_c,
        "activity_context": v.activity_context,
        "unit": v.unit,
        "data_type": v.data_type,
        "note": v.note,
    }


def serialize_sleep(s: SleepRecordModel, astronaut_name: Optional[str] = None) -> dict[str, Any]:
    return {
        "id": s.id,
        "astronaut_id": s.astronaut_id,
        "astronaut_name": astronaut_name or (s.astronaut.name if s.astronaut else f"Astronaut {s.astronaut_id}"),
        "mission_day": s.mission_day,
        "date_label": s.date_label,
        "duration_hours": s.duration_hours,
        "deep_sleep_hours": s.deep_sleep_hours,
        "rem_sleep_hours": s.rem_sleep_hours,
        "light_sleep_hours": s.light_sleep_hours,
        "sleep_efficiency": s.sleep_efficiency,
        "interruptions": s.interruptions,
        "quality_label": s.quality_label,
        "data_type": s.data_type,
        "note": s.note,
    }


def serialize_wellbeing(w: WellbeingRecordModel, astronaut_name: Optional[str] = None) -> dict[str, Any]:
    return {
        "id": w.id,
        "astronaut_id": w.astronaut_id,
        "astronaut_name": astronaut_name or (w.astronaut.name if w.astronaut else f"Astronaut {w.astronaut_id}"),
        "mission_day": w.mission_day,
        "timestamp": w.timestamp,
        "mood_label": w.mood_label,
        "mood_score": w.mood_score,
        "fatigue_level": w.fatigue_level,
        "fatigue_score": w.fatigue_score,
        "stress_level": w.stress_level,
        "workload_rating": w.workload_rating,
        "note": w.note,
        "data_type": w.data_type,
    }


def serialize_radiation(r: RadiationRecordModel) -> dict[str, Any]:
    return {
        "id": r.id,
        "mission_id": r.mission_id,
        "mission_day": r.mission_day,
        "timestamp": r.timestamp,
        "value": r.value,
        "cumulative_msv": r.cumulative_msv,
        "unit": r.unit,
        "dosimeter_location": r.dosimeter_location,
        "solar_activity": r.solar_activity,
        "data_type": r.data_type,
        "note": r.note,
    }


def serialize_alert(a: AlertModel, astronaut_name: Optional[str] = None) -> dict[str, Any]:
    return {
        "id": a.id,
        "astronaut_id": a.astronaut_id,
        "astronaut_name": astronaut_name,
        "mission_id": a.mission_id,
        "title": a.title,
        "description": a.description,
        "explanation": a.explanation,
        "category": a.category,
        "priority": a.priority,
        "timestamp": a.timestamp,
        "is_read": a.is_read,
        "data_type": a.data_type,
    }


def serialize_astronaut(a: AstronautModel, db: Session) -> dict[str, Any]:
    vitals = (
        db.query(VitalReadingModel)
        .filter(VitalReadingModel.astronaut_id == a.id)
        .order_by(VitalReadingModel.id.asc())
        .all()
    )
    sleep_logs = (
        db.query(SleepRecordModel)
        .filter(SleepRecordModel.astronaut_id == a.id)
        .order_by(SleepRecordModel.mission_day.desc(), SleepRecordModel.id.desc())
        .all()
    )
    wellbeing_logs = (
        db.query(WellbeingRecordModel)
        .filter(WellbeingRecordModel.astronaut_id == a.id)
        .order_by(WellbeingRecordModel.mission_day.desc(), WellbeingRecordModel.id.desc())
        .all()
    )
    alerts = (
        db.query(AlertModel)
        .filter(AlertModel.astronaut_id == a.id)
        .order_by(AlertModel.id.desc())
        .all()
    )

    latest_vital = serialize_vital(vitals[-1], a.name) if vitals else None
    avg_hr = (
        round(sum(v.heart_rate for v in vitals) / len(vitals), 1)
        if vitals
        else None
    )
    latest_sleep = serialize_sleep(sleep_logs[0], a.name) if sleep_logs else None
    avg_sleep = (
        round(sum(s.duration_hours for s in sleep_logs) / len(sleep_logs), 1)
        if sleep_logs
        else None
    )
    latest_wellbeing = serialize_wellbeing(wellbeing_logs[0], a.name) if wellbeing_logs else None

    return {
        "id": a.id,
        "code": a.code,
        "name": a.name,
        "role": a.role,
        "specialty": a.specialty,
        "status": a.status,
        "mission_id": a.mission_id,
        "assigned_day": a.assigned_day,
        "eva_hours": a.eva_hours,
        "summary_note": a.summary_note,
        "data_type": a.data_type,
        "latest_vital": latest_vital,
        "avg_heart_rate": avg_hr,
        "latest_sleep": latest_sleep,
        "avg_sleep_hours": avg_sleep,
        "latest_wellbeing": latest_wellbeing,
        "vitals_count": len(vitals),
        "sleep_count": len(sleep_logs),
        "wellbeing_count": len(wellbeing_logs),
        "alerts_count": len(alerts),
    }


# ==========================================
# GENERAL API ROUTES
# ==========================================


@app.get("/")
def home():
    return {
        "application": "AstroHealth",
        "tagline": "Intelligent Health Monitoring Beyond Earth.",
        "message": "AstroHealth API is running successfully.",
        "status": "online",
        "version": settings.APP_VERSION,
        "database": get_database_status(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AstroHealth Backend",
        "version": settings.APP_VERSION,
        "database": get_database_status(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ==========================================
# MISSION ROUTES
# ==========================================


@app.get("/api/mission")
def get_mission(db: Session = Depends(get_db)):
    mission = db.query(MissionModel).filter(MissionModel.id == "ORBITAL-01").first()
    if not mission:
        mission = db.query(MissionModel).first()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission record not found")
    return serialize_mission(mission)


# ==========================================
# ASTRONAUT ROUTES
# ==========================================


@app.get("/api/astronauts")
def get_astronauts(db: Session = Depends(get_db)):
    crew = db.query(AstronautModel).order_by(AstronautModel.id.asc()).all()
    serialized = [serialize_astronaut(a, db) for a in crew]
    return {
        "count": len(serialized),
        "data_type": "SIMULATED",
        "astronauts": serialized,
    }


@app.get("/api/astronauts/{astronaut_id}")
def get_astronaut(astronaut_id: int, db: Session = Depends(get_db)):
    astronaut = db.query(AstronautModel).filter(AstronautModel.id == astronaut_id).first()
    if not astronaut:
        raise HTTPException(
            status_code=404,
            detail=f"Astronaut with id {astronaut_id} not found",
        )

    profile = serialize_astronaut(astronaut, db)
    vitals = (
        db.query(VitalReadingModel)
        .filter(VitalReadingModel.astronaut_id == astronaut.id)
        .order_by(VitalReadingModel.id.asc())
        .all()
    )
    sleep_logs = (
        db.query(SleepRecordModel)
        .filter(SleepRecordModel.astronaut_id == astronaut.id)
        .order_by(SleepRecordModel.mission_day.desc(), SleepRecordModel.id.desc())
        .all()
    )
    wellbeing_logs = (
        db.query(WellbeingRecordModel)
        .filter(WellbeingRecordModel.astronaut_id == astronaut.id)
        .order_by(WellbeingRecordModel.mission_day.desc(), WellbeingRecordModel.id.desc())
        .all()
    )
    alerts = (
        db.query(AlertModel)
        .filter(AlertModel.astronaut_id == astronaut.id)
        .order_by(AlertModel.id.desc())
        .all()
    )

    profile["vitals"] = [serialize_vital(v, astronaut.name) for v in vitals]
    profile["sleep_records"] = [serialize_sleep(s, astronaut.name) for s in sleep_logs]
    profile["wellbeing_records"] = [serialize_wellbeing(w, astronaut.name) for w in wellbeing_logs]
    profile["alerts"] = [serialize_alert(al, astronaut.name) for al in alerts]
    return profile


# ==========================================
# VITAL SIGNS ROUTES
# ==========================================


@app.get("/api/vitals")
def get_vitals(
    astronaut_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    astronauts_map = {a.id: a.name for a in db.query(AstronautModel).all()}

    query = db.query(VitalReadingModel)
    if astronaut_id is not None:
        query = query.filter(VitalReadingModel.astronaut_id == astronaut_id)

    records = query.order_by(VitalReadingModel.id.asc()).all()
    serialized = [serialize_vital(v, astronauts_map.get(v.astronaut_id)) for v in records]

    # When no astronaut_id filter is applied, also provide the primary 24-hour time series
    # (Astronaut 1's 7 diurnal readings + any manually added readings) in `readings`
    # while returning the full crew dataset in `all_readings`.
    if astronaut_id is None:
        primary_series = [r for r in serialized if r["astronaut_id"] == 1 or r["data_type"] == "MANUAL"]
        if not primary_series:
            primary_series = serialized
    else:
        primary_series = serialized

    hr_values = [r["heart_rate"] for r in primary_series]
    avg_hr = round(sum(hr_values) / len(hr_values), 1) if hr_values else 0.0

    return {
        "unit": "BPM",
        "measurement": "Heart rate & multi-parameter vitals",
        "data_type": "SIMULATED",
        "illustrate_threshold_notice": (
            "Illustrative demonstration reference range (60–85 BPM resting, 96–100% SpO2). "
            "Not a validated clinical threshold."
        ),
        "count": len(primary_series),
        "total_crew_readings": len(serialized),
        "average_heart_rate": avg_hr,
        "readings": primary_series,
        "all_readings": serialized,
    }


@app.post("/api/vitals", status_code=201)
def create_vital_reading(
    payload: VitalCreateRequest,
    db: Session = Depends(get_db),
):
    astronaut = db.query(AstronautModel).filter(AstronautModel.id == payload.astronaut_id).first()
    if not astronaut:
        raise HTTPException(status_code=404, detail="Astronaut not found")

    now = datetime.now(timezone.utc)
    time_str = payload.time or now.strftime("%H:%M")

    reading = VitalReadingModel(
        astronaut_id=payload.astronaut_id,
        mission_day=payload.mission_day,
        time=time_str,
        timestamp=now.isoformat(),
        heart_rate=payload.heart_rate,
        spo2=payload.spo2,
        systolic_bp=payload.systolic_bp,
        diastolic_bp=payload.diastolic_bp,
        respiration_rate=payload.respiration_rate,
        skin_temp_c=payload.skin_temp_c,
        activity_context=payload.activity_context,
        unit="BPM",
        data_type=payload.data_type,
        note=payload.note or "Manually entered demonstration vital reading.",
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    return {
        "message": "Vital sign reading recorded.",
        "reading": serialize_vital(reading, astronaut.name),
    }


# ==========================================
# SLEEP MONITORING ROUTES
# ==========================================


@app.get("/api/sleep")
def get_sleep_records(
    astronaut_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    astronauts_map = {a.id: a.name for a in db.query(AstronautModel).all()}

    query = db.query(SleepRecordModel)
    if astronaut_id is not None:
        query = query.filter(SleepRecordModel.astronaut_id == astronaut_id)

    records = query.order_by(SleepRecordModel.mission_day.desc(), SleepRecordModel.id.asc()).all()
    serialized = [serialize_sleep(s, astronauts_map.get(s.astronaut_id)) for s in records]

    durations = [r["duration_hours"] for r in serialized]
    efficiencies = [r["sleep_efficiency"] for r in serialized]

    return {
        "count": len(serialized),
        "data_type": "SIMULATED",
        "average_duration_hours": round(sum(durations) / len(durations), 1) if durations else 0.0,
        "average_efficiency": round(sum(efficiencies) / len(efficiencies), 1) if efficiencies else 0.0,
        "records": serialized,
    }


@app.post("/api/sleep", status_code=201)
def create_sleep_record(
    payload: SleepCreateRequest,
    db: Session = Depends(get_db),
):
    astronaut = db.query(AstronautModel).filter(AstronautModel.id == payload.astronaut_id).first()
    if not astronaut:
        raise HTTPException(status_code=404, detail="Astronaut not found")

    light_sleep = round(
        max(0.2, payload.duration_hours - payload.deep_sleep_hours - payload.rem_sleep_hours),
        1,
    )
    record = SleepRecordModel(
        astronaut_id=payload.astronaut_id,
        mission_day=payload.mission_day,
        date_label=f"Mission Day {payload.mission_day}",
        duration_hours=payload.duration_hours,
        deep_sleep_hours=payload.deep_sleep_hours,
        rem_sleep_hours=payload.rem_sleep_hours,
        light_sleep_hours=light_sleep,
        sleep_efficiency=payload.sleep_efficiency,
        interruptions=payload.interruptions,
        quality_label=payload.quality_label,
        data_type=payload.data_type,
        note=payload.note or "Manually logged sleep record.",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Sleep record saved.",
        "record": serialize_sleep(record, astronaut.name),
    }


# ==========================================
# WELLBEING MONITORING ROUTES
# ==========================================


@app.get("/api/wellbeing")
def get_wellbeing_records(
    astronaut_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    astronauts_map = {a.id: a.name for a in db.query(AstronautModel).all()}

    query = db.query(WellbeingRecordModel)
    if astronaut_id is not None:
        query = query.filter(WellbeingRecordModel.astronaut_id == astronaut_id)

    records = query.order_by(WellbeingRecordModel.mission_day.desc(), WellbeingRecordModel.id.desc()).all()
    serialized = [serialize_wellbeing(w, astronauts_map.get(w.astronaut_id)) for w in records]

    mood_scores = [r["mood_score"] for r in serialized]
    fatigue_scores = [r["fatigue_score"] for r in serialized]

    return {
        "count": len(serialized),
        "data_type": "SIMULATED",
        "average_mood_score": round(sum(mood_scores) / len(mood_scores), 1) if mood_scores else 0.0,
        "average_fatigue_score": round(sum(fatigue_scores) / len(fatigue_scores), 1) if fatigue_scores else 0.0,
        "non_diagnostic_notice": (
            "Wellbeing check-ins represent subjective crew self-reports for schedule awareness "
            "and must never be used for psychological or clinical diagnosis."
        ),
        "records": serialized,
    }


@app.post("/api/wellbeing", status_code=201)
def create_wellbeing_record(
    payload: WellbeingCreateRequest,
    db: Session = Depends(get_db),
):
    astronaut = db.query(AstronautModel).filter(AstronautModel.id == payload.astronaut_id).first()
    if not astronaut:
        raise HTTPException(status_code=404, detail="Astronaut not found")

    record = WellbeingRecordModel(
        astronaut_id=payload.astronaut_id,
        mission_day=payload.mission_day,
        timestamp=datetime.now(timezone.utc).isoformat(),
        mood_label=payload.mood_label,
        mood_score=payload.mood_score,
        fatigue_level=payload.fatigue_level,
        fatigue_score=payload.fatigue_score,
        stress_level=payload.stress_level,
        workload_rating=payload.workload_rating,
        note=payload.note,
        data_type=payload.data_type,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Wellbeing check-in saved.",
        "record": serialize_wellbeing(record, astronaut.name),
    }


# ==========================================
# RADIATION MONITORING ROUTES
# ==========================================


@app.get("/api/radiation")
def get_radiation_records(db: Session = Depends(get_db)):
    records = (
        db.query(RadiationRecordModel)
        .order_by(RadiationRecordModel.mission_day.desc(), RadiationRecordModel.id.desc())
        .all()
    )
    serialized = [serialize_radiation(r) for r in records]
    values = [r["value"] for r in serialized]

    return {
        "count": len(serialized),
        "data_type": "SIMULATED",
        "average_daily_msv": round(sum(values) / len(values), 3) if values else 0.0,
        "latest_cumulative_msv": serialized[0]["cumulative_msv"] if serialized else 0.0,
        "explanatory_notice": (
            "All radiation entries are simulated demonstration logs for Mission ORBITAL-01. "
            "No clinical exposure limits or real spacecraft dosimeter claims are made."
        ),
        "records": serialized,
    }


@app.post("/api/radiation", status_code=201)
def create_radiation_record(
    payload: RadiationCreateRequest,
    db: Session = Depends(get_db),
):
    latest = (
        db.query(RadiationRecordModel)
        .order_by(RadiationRecordModel.mission_day.desc(), RadiationRecordModel.id.desc())
        .first()
    )
    prev_cum = latest.cumulative_msv if latest else 58.0
    cum_msv = (
        payload.cumulative_msv
        if payload.cumulative_msv is not None
        else round(prev_cum + payload.value, 2)
    )

    record = RadiationRecordModel(
        mission_id=payload.mission_id,
        mission_day=payload.mission_day,
        timestamp=datetime.now(timezone.utc).isoformat(),
        value=payload.value,
        cumulative_msv=cum_msv,
        unit=payload.unit,
        dosimeter_location=payload.dosimeter_location,
        solar_activity=payload.solar_activity,
        data_type=payload.data_type,
        note=payload.note,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Radiation record logged.",
        "record": serialize_radiation(record),
    }


# ==========================================
# ALERT & NOTIFICATION ROUTES
# ==========================================


@app.get("/api/alerts")
def get_alerts(
    priority: Optional[str] = Query(default=None),
    astronaut_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    astronauts_map = {a.id: a.name for a in db.query(AstronautModel).all()}

    query = db.query(AlertModel)
    if priority:
        query = query.filter(AlertModel.priority == priority)
    if astronaut_id is not None:
        query = query.filter(AlertModel.astronaut_id == astronaut_id)

    alerts = query.order_by(AlertModel.id.asc()).all()
    serialized = [serialize_alert(a, astronauts_map.get(a.astronaut_id)) for a in alerts]

    unread_count = sum(1 for a in serialized if not a["is_read"])
    review_count = sum(1 for a in serialized if a["priority"] == "Review")

    return {
        "count": len(serialized),
        "unread_count": unread_count,
        "review_count": review_count,
        "data_type": "SIMULATED",
        "alerts": serialized,
    }


@app.patch("/api/alerts/{alert_id}/read")
def toggle_alert_read(
    alert_id: int,
    is_read: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    alert = db.query(AlertModel).filter(AlertModel.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = (not alert.is_read) if is_read is None else is_read
    db.commit()
    db.refresh(alert)

    astronaut_name = None
    if alert.astronaut_id:
        person = db.query(AstronautModel).filter(AstronautModel.id == alert.astronaut_id).first()
        astronaut_name = person.name if person else None

    return {
        "message": "Alert read state updated.",
        "alert": serialize_alert(alert, astronaut_name),
    }


@app.post("/api/alerts/mark-all-read")
def mark_all_alerts_read(db: Session = Depends(get_db)):
    db.query(AlertModel).update({AlertModel.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read."}


# ==========================================
# AI HEALTH ASSISTANT ROUTES
# ==========================================


@app.get("/api/ai/summary")
def get_ai_summary(
    astronaut_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    mission_obj = db.query(MissionModel).first()
    mission = serialize_mission(mission_obj) if mission_obj else {"id": "ORBITAL-01"}
    astronauts = [
        serialize_astronaut(a, db)
        for a in db.query(AstronautModel).order_by(AstronautModel.id.asc()).all()
    ]
    astronauts_map = {a["id"]: a["name"] for a in astronauts}
    vitals = [
        serialize_vital(v, astronauts_map.get(v.astronaut_id))
        for v in db.query(VitalReadingModel).order_by(VitalReadingModel.id.asc()).all()
    ]
    sleep_records = [
        serialize_sleep(s, astronauts_map.get(s.astronaut_id))
        for s in db.query(SleepRecordModel).order_by(SleepRecordModel.mission_day.desc()).all()
    ]
    wellbeing_records = [
        serialize_wellbeing(w, astronauts_map.get(w.astronaut_id))
        for w in db.query(WellbeingRecordModel).order_by(WellbeingRecordModel.mission_day.desc()).all()
    ]
    radiation_records = [
        serialize_radiation(r)
        for r in db.query(RadiationRecordModel).order_by(RadiationRecordModel.mission_day.desc()).all()
    ]
    alerts = [
        serialize_alert(a, astronauts_map.get(a.astronaut_id))
        for a in db.query(AlertModel).order_by(AlertModel.id.asc()).all()
    ]

    return generate_health_summary(
        mission=mission,
        astronauts=astronauts,
        vitals=vitals,
        sleep_records=sleep_records,
        wellbeing_records=wellbeing_records,
        radiation_records=radiation_records,
        alerts=alerts,
        astronaut_id=astronaut_id,
    )


@app.post("/api/ai/ask")
def ask_ai_assistant(
    payload: AIQuestionRequest,
    db: Session = Depends(get_db),
):
    mission_obj = db.query(MissionModel).first()
    mission = serialize_mission(mission_obj) if mission_obj else {"id": "ORBITAL-01"}
    astronauts = [
        serialize_astronaut(a, db)
        for a in db.query(AstronautModel).order_by(AstronautModel.id.asc()).all()
    ]
    astronauts_map = {a["id"]: a["name"] for a in astronauts}
    vitals = [
        serialize_vital(v, astronauts_map.get(v.astronaut_id))
        for v in db.query(VitalReadingModel).order_by(VitalReadingModel.id.asc()).all()
    ]
    sleep_records = [
        serialize_sleep(s, astronauts_map.get(s.astronaut_id))
        for s in db.query(SleepRecordModel).order_by(SleepRecordModel.mission_day.desc()).all()
    ]
    wellbeing_records = [
        serialize_wellbeing(w, astronauts_map.get(w.astronaut_id))
        for w in db.query(WellbeingRecordModel).order_by(WellbeingRecordModel.mission_day.desc()).all()
    ]
    radiation_records = [
        serialize_radiation(r)
        for r in db.query(RadiationRecordModel).order_by(RadiationRecordModel.mission_day.desc()).all()
    ]
    alerts = [
        serialize_alert(a, astronauts_map.get(a.astronaut_id))
        for a in db.query(AlertModel).order_by(AlertModel.id.asc()).all()
    ]

    return answer_health_question(
        question=payload.question,
        mission=mission,
        astronauts=astronauts,
        vitals=vitals,
        sleep_records=sleep_records,
        wellbeing_records=wellbeing_records,
        radiation_records=radiation_records,
        alerts=alerts,
        astronaut_id=payload.astronaut_id,
    )


# ==========================================
# NASA RESEARCH INTEGRATION ROUTES
# ==========================================


@app.get("/api/nasa/research")
def get_nasa_research(
    q: Optional[str] = Query(default=None, description="Optional search keyword for NASA OSDR"),
    limit: int = Query(default=8, ge=1, le=20),
):
    return fetch_nasa_osdr_research(query=q, limit=limit)


# ==========================================
# GLOBAL SEARCH ROUTE
# ==========================================


@app.get("/api/search")
def global_search(
    q: str = Query(..., min_length=1, description="Search query across AstroHealth records"),
    db: Session = Depends(get_db),
):
    term = q.strip().lower()
    astronauts = [
        serialize_astronaut(a, db)
        for a in db.query(AstronautModel).order_by(AstronautModel.id.asc()).all()
    ]
    astronauts_map = {a["id"]: a["name"] for a in astronauts}

    matched_astronauts = [
        a
        for a in astronauts
        if term in a["name"].lower()
        or term in a["role"].lower()
        or term in a["code"].lower()
        or term in a["status"].lower()
        or term in a["specialty"].lower()
    ]

    all_vitals = [
        serialize_vital(v, astronauts_map.get(v.astronaut_id))
        for v in db.query(VitalReadingModel).all()
    ]
    matched_vitals = [
        v
        for v in all_vitals
        if term in v["astronaut_name"].lower()
        or term in v["activity_context"].lower()
        or term in str(v["heart_rate"])
        or term in (v.get("note") or "").lower()
    ][:10]

    all_wellbeing = [
        serialize_wellbeing(w, astronauts_map.get(w.astronaut_id))
        for w in db.query(WellbeingRecordModel).all()
    ]
    matched_wellbeing = [
        w
        for w in all_wellbeing
        if term in w["astronaut_name"].lower()
        or term in w["mood_label"].lower()
        or term in w["fatigue_level"].lower()
        or term in w["note"].lower()
    ]

    all_alerts = [
        serialize_alert(al, astronauts_map.get(al.astronaut_id))
        for al in db.query(AlertModel).all()
    ]
    matched_alerts = [
        al
        for al in all_alerts
        if term in al["title"].lower()
        or term in al["description"].lower()
        or term in al["explanation"].lower()
        or term in al["priority"].lower()
    ]

    nasa_data = fetch_nasa_osdr_research(query=term, limit=6)
    matched_datasets = nasa_data.get("datasets", [])

    return {
        "query": q,
        "total_matches": (
            len(matched_astronauts)
            + len(matched_vitals)
            + len(matched_wellbeing)
            + len(matched_alerts)
            + len(matched_datasets)
        ),
        "astronauts": matched_astronauts,
        "vitals": matched_vitals,
        "wellbeing": matched_wellbeing,
        "alerts": matched_alerts,
        "nasa_datasets": matched_datasets,
    }


# ==========================================
# PROJECT INFORMATION
# ==========================================


@app.get("/api/about")
def about():
    return {
        "name": "AstroHealth",
        "tagline": "Intelligent Health Monitoring Beyond Earth.",
        "project_type": "Independent student innovation prototype",
        "challenge": "NASA Space Apps Challenge 2026 — Challenge 5: Create Health Monitoring Software for Astronauts on Space Missions",
        "purpose": (
            "Support astronaut health monitoring through "
            "health records, trend analysis, wellbeing check-ins, radiation logs, and space-health research."
        ),
        "medical_notice": (
            "This prototype does not diagnose, treat or replace "
            "professional medical judgment."
        ),
        "data_notice": (
            "SIMULATED DEMONSTRATION DATA — NOT REAL ASTRONAUT MEDICAL RECORDS."
        ),
        "nasa_notice": (
            "AstroHealth is an independent student prototype and is not an official NASA product or endorsed by NASA."
        ),
        "supported_classifications": [
            "NASA_RESEARCH",
            "SIMULATED",
            "MANUAL",
            "SENSOR",
            "AI_DERIVED",
        ],
        "database": get_database_status(),
    }
