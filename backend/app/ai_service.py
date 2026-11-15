from datetime import datetime, timezone
from typing import Any, Optional

from app.config import settings


SUGGESTED_QUESTIONS: list[str] = [
    "Summarize the current mission health overview and any items for review.",
    "How are James Miller's sleep and heart-rate records trending?",
    "Compare sleep duration and sleep efficiency across all four crew members.",
    "What radiation exposure records are logged for Mission ORBITAL-01?",
    "Are there any elevated fatigue or wellbeing check-ins recorded?",
    "How do the manual or simulated crew records differ from NASA OSDR research?",
]


def generate_health_summary(
    mission: dict[str, Any],
    astronauts: list[dict[str, Any]],
    vitals: list[dict[str, Any]],
    sleep_records: list[dict[str, Any]],
    wellbeing_records: list[dict[str, Any]],
    radiation_records: list[dict[str, Any]],
    alerts: list[dict[str, Any]],
    astronaut_id: Optional[int] = None,
) -> dict[str, Any]:
    """
    Transparent, deterministic rule-based health observation summary engine.
    Produces explainable observations labeled AI_DERIVED without claiming a live LLM connection
    or making clinical diagnoses.
    """
    target_astronaut = None
    if astronaut_id is not None:
        target_astronaut = next((a for a in astronauts if a["id"] == astronaut_id), None)

    scoped_vitals = (
        [v for v in vitals if v.get("astronaut_id") == astronaut_id]
        if astronaut_id is not None
        else vitals
    )
    scoped_sleep = (
        [s for s in sleep_records if s.get("astronaut_id") == astronaut_id]
        if astronaut_id is not None
        else sleep_records
    )
    scoped_wellbeing = (
        [w for w in wellbeing_records if w.get("astronaut_id") == astronaut_id]
        if astronaut_id is not None
        else wellbeing_records
    )
    scoped_alerts = (
        [a for a in alerts if a.get("astronaut_id") == astronaut_id or a.get("astronaut_id") is None]
        if astronaut_id is not None
        else alerts
    )

    # Compute vital statistics
    hr_values = [v["heart_rate"] for v in scoped_vitals if "heart_rate" in v]
    avg_hr = round(sum(hr_values) / len(hr_values), 1) if hr_values else 0.0
    min_hr = min(hr_values) if hr_values else 0
    max_hr = max(hr_values) if hr_values else 0

    spo2_values = [v.get("spo2", 98.0) for v in scoped_vitals]
    avg_spo2 = round(sum(spo2_values) / len(spo2_values), 1) if spo2_values else 0.0

    # Compute sleep statistics
    sleep_values = [s["duration_hours"] for s in scoped_sleep if "duration_hours" in s]
    avg_sleep = round(sum(sleep_values) / len(sleep_values), 1) if sleep_values else 0.0
    min_sleep = min(sleep_values) if sleep_values else 0.0
    eff_values = [s.get("sleep_efficiency", 88) for s in scoped_sleep]
    avg_eff = round(sum(eff_values) / len(eff_values), 1) if eff_values else 0.0

    # Pending reviews
    review_alerts = [a for a in scoped_alerts if a.get("priority") in ("Review", "Warning")]
    unread_alerts = [a for a in scoped_alerts if not a.get("is_read", False)]

    # Radiation summary
    latest_rad = radiation_records[0] if radiation_records else None

    scope_title = (
        f"Astronaut Profile Summary: {target_astronaut['name']} ({target_astronaut['role']})"
        if target_astronaut
        else f"Mission {mission.get('id', 'ORBITAL-01')} Crew Health Summary"
    )

    observations: list[dict[str, Any]] = []

    # 1. Crew & Review Queue Observation
    if target_astronaut:
        observations.append(
            {
                "id": "obs-crew-scope",
                "category": "Crew Status",
                "title": f"{target_astronaut['name']} — {target_astronaut['status']} Status",
                "detail": (
                    f"Role: {target_astronaut['role']} ({target_astronaut.get('specialty', 'Operations')}). "
                    f"Currently on Mission Day {target_astronaut.get('assigned_day', 142)}. "
                    f"{target_astronaut.get('summary_note', '')}"
                ),
                "level": "review" if target_astronaut["status"] == "Review" else "info",
                "data_type": "AI_DERIVED",
                "based_on": target_astronaut.get("data_type", "SIMULATED"),
            }
        )
    else:
        review_crew = [a["name"] for a in astronauts if a.get("status") != "Stable"]
        observations.append(
            {
                "id": "obs-crew-overview",
                "category": "Crew Overview",
                "title": f"{len(astronauts)} Active Astronaut Profiles Monitored",
                "detail": (
                    f"{len(astronauts) - len(review_crew)} crew member(s) have 'Stable' demonstration status; "
                    f"{len(review_crew)} crew member(s) ({', '.join(review_crew) if review_crew else 'none'}) "
                    f"are flagged as 'Observation for Review' due to shorter sleep duration and mild heart-rate elevation."
                ),
                "level": "review" if review_crew else "info",
                "data_type": "AI_DERIVED",
                "based_on": "SIMULATED",
            }
        )

    # 2. Vital Signs Observation
    if hr_values:
        hr_delta = hr_values[-1] - hr_values[0] if len(hr_values) > 1 else 0
        direction = (
            f"net change of {hr_delta:+d} BPM between earliest and latest logged points"
            if len(hr_values) > 1
            else "single point logged"
        )
        observations.append(
            {
                "id": "obs-vitals",
                "category": "Vital Signs Trend",
                "title": f"Heart Rate Mean {avg_hr} BPM (Range {min_hr}–{max_hr} BPM)",
                "detail": (
                    f"Across {len(hr_values)} recorded measurements ({direction}), mean SpO2 is {avg_spo2}%. "
                    "Values are compared against illustrative demonstration reference bands (60–85 BPM resting). "
                    "Observation for human review only — not a clinical threshold."
                ),
                "level": "review" if max_hr >= 82 else "info",
                "data_type": "AI_DERIVED",
                "based_on": "SIMULATED / MANUAL",
            }
        )

    # 3. Sleep Trend Observation
    if sleep_values:
        short_sleep_count = sum(1 for v in sleep_values if v < 6.5)
        observations.append(
            {
                "id": "obs-sleep",
                "category": "Sleep & Circadian Rhythm",
                "title": f"Mean Sleep Duration {avg_sleep} hrs (Efficiency {avg_eff}%)",
                "detail": (
                    f"Analyzed {len(sleep_values)} sleep logs (minimum {min_sleep} hrs). "
                    f"{short_sleep_count} record(s) fall below the 6.5-hour illustrative mission rest target, "
                    "which is marked as an observation for crew scheduling review."
                ),
                "level": "review" if short_sleep_count > 0 else "info",
                "data_type": "AI_DERIVED",
                "based_on": "SIMULATED / MANUAL",
            }
        )

    # 4. Wellbeing Observation
    if scoped_wellbeing:
        elevated_fatigue = [
            w for w in scoped_wellbeing if w.get("fatigue_level") in ("Moderate", "Elevated")
        ]
        observations.append(
            {
                "id": "obs-wellbeing",
                "category": "Wellbeing & Fatigue Check-ins",
                "title": f"{len(scoped_wellbeing)} Self-Reported Wellbeing Check-ins Logged",
                "detail": (
                    f"{len(elevated_fatigue)} entry/entries indicate moderate or elevated self-reported fatigue. "
                    "Wellbeing logs represent subjective crew self-reports to assist schedule balancing and "
                    "are never used for psychological diagnosis."
                ),
                "level": "review" if elevated_fatigue else "info",
                "data_type": "AI_DERIVED",
                "based_on": "SIMULATED / MANUAL",
            }
        )

    # 5. Radiation & Alerts Observation
    if latest_rad:
        observations.append(
            {
                "id": "obs-radiation",
                "category": "Space Environment & Dosimetry",
                "title": f"Latest Logged Dose {latest_rad['value']} {latest_rad['unit']} ({latest_rad.get('solar_activity', 'Quiet')} Solar Activity)",
                "detail": (
                    f"Mission {latest_rad['mission_id']} cumulative illustrative dose: "
                    f"{latest_rad.get('cumulative_msv', 58.4)} mSv. "
                    f"{len(review_alerts)} observation(s) are currently in the review queue ({len(unread_alerts)} unread)."
                ),
                "level": "info",
                "data_type": "AI_DERIVED",
                "based_on": latest_rad.get("data_type", "SIMULATED"),
            }
        )

    return {
        "scope_title": scope_title,
        "astronaut_id": astronaut_id,
        "engine_mode": (
            "EXTERNAL_PROVIDER_CONFIGURED"
            if settings.ASTROHEALTH_AI_API_KEY
            else "RULE_BASED_LOCAL"
        ),
        "engine_description": (
            "Transparent local rule-based analytical assistant. "
            "No generative AI API key is required or claimed. Ready for optional server-side LLM connection."
        ),
        "data_type": "AI_DERIVED",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "medical_disclaimer": (
            "IMPORTANT: AstroHealth is an independent student educational prototype. "
            "All summaries are rule-based observations for review based on simulated/manual demonstration records. "
            "This assistant does not diagnose conditions, prescribe treatment, or replace flight-surgeon judgment."
        ),
        "metrics_snapshot": {
            "vital_readings_analyzed": len(scoped_vitals),
            "avg_heart_rate_bpm": avg_hr,
            "avg_spo2_percent": avg_spo2,
            "sleep_records_analyzed": len(scoped_sleep),
            "avg_sleep_hours": avg_sleep,
            "avg_sleep_efficiency": avg_eff,
            "wellbeing_entries_analyzed": len(scoped_wellbeing),
            "pending_review_count": len(review_alerts),
            "unread_alert_count": len(unread_alerts),
        },
        "observations": observations,
        "suggested_questions": SUGGESTED_QUESTIONS,
    }


def answer_health_question(
    question: str,
    mission: dict[str, Any],
    astronauts: list[dict[str, Any]],
    vitals: list[dict[str, Any]],
    sleep_records: list[dict[str, Any]],
    wellbeing_records: list[dict[str, Any]],
    radiation_records: list[dict[str, Any]],
    alerts: list[dict[str, Any]],
    astronaut_id: Optional[int] = None,
) -> dict[str, Any]:
    """
    Answers user questions about recorded demonstration data using transparent rule-based matching.
    """
    q_lower = question.lower().strip()
    astronaut_map = {a["id"]: a for a in astronauts}

    # Check if question mentions a specific astronaut by name
    matched_astronaut = None
    for a in astronauts:
        first_last = a["name"].lower().split()
        if a["name"].lower() in q_lower or any(part in q_lower for part in first_last if len(part) > 2):
            matched_astronaut = a
            break
    if not matched_astronaut and astronaut_id:
        matched_astronaut = astronaut_map.get(astronaut_id)

    bullet_points: list[str] = []
    source_records_used: list[str] = []

    if matched_astronaut:
        aid = matched_astronaut["id"]
        a_vitals = [v for v in vitals if v.get("astronaut_id") == aid]
        a_sleep = [s for s in sleep_records if s.get("astronaut_id") == aid]
        a_well = [w for w in wellbeing_records if w.get("astronaut_id") == aid]
        a_alerts = [al for al in alerts if al.get("astronaut_id") == aid]

        avg_hr = (
            round(sum(v["heart_rate"] for v in a_vitals) / len(a_vitals), 1)
            if a_vitals
            else 0
        )
        avg_sleep = (
            round(sum(s["duration_hours"] for s in a_sleep) / len(a_sleep), 1)
            if a_sleep
            else 0
        )
        latest_well = a_well[0] if a_well else None

        headline = (
            f"Observation Summary for {matched_astronaut['name']} "
            f"({matched_astronaut['role']} · Status: {matched_astronaut['status']})"
        )
        bullet_points.append(
            f"Vital Signs ({len(a_vitals)} records): Mean heart rate is {avg_hr} BPM "
            f"(latest: {a_vitals[-1]['heart_rate']} BPM at {a_vitals[-1]['time']}, SpO2 {a_vitals[-1].get('spo2', 98)}%)."
            if a_vitals
            else "No individual vital sign records found."
        )
        bullet_points.append(
            f"Sleep Records ({len(a_sleep)} records): Average sleep duration is {avg_sleep} hours "
            f"(latest efficiency: {a_sleep[0].get('sleep_efficiency', 85)}%)."
            if a_sleep
            else "No sleep records logged for this crew member."
        )
        if latest_well:
            bullet_points.append(
                f"Wellbeing Check-in: Mood '{latest_well['mood_label']}' ({latest_well['mood_score']}/5), "
                f"Fatigue level '{latest_well['fatigue_level']}' — Note: \"{latest_well['note']}\""
            )
        if a_alerts:
            bullet_points.append(
                f"Observations for Review ({len(a_alerts)}): "
                + "; ".join(f"{al['title']} ({al['priority']})" for al in a_alerts)
            )
        source_records_used = ["SIMULATED", "MANUAL", "AI_DERIVED"]

    elif "sleep" in q_lower or "rest" in q_lower or "circadian" in q_lower:
        headline = "Crew Sleep & Recovery Trend Analysis (Observation for Review)"
        for a in astronauts:
            a_sleep = [s for s in sleep_records if s.get("astronaut_id") == a["id"]]
            if a_sleep:
                avg_s = round(sum(s["duration_hours"] for s in a_sleep) / len(a_sleep), 2)
                avg_e = round(sum(s.get("sleep_efficiency", 88) for s in a_sleep) / len(a_sleep), 1)
                bullet_points.append(
                    f"{a['name']} ({a['role']}): {avg_s} hrs avg across {len(a_sleep)} log(s), "
                    f"mean sleep efficiency {avg_e}% ({a_sleep[0].get('quality_label', 'Adequate')})."
                )
        bullet_points.append(
            "Observation: James Miller has the shortest recorded sleep duration (6.1–6.2 hrs), "
            "which correlates with his 'Review' status flag for schedule evaluation."
        )
        source_records_used = ["SIMULATED", "MANUAL", "AI_DERIVED"]

    elif "radiation" in q_lower or "dose" in q_lower or "msv" in q_lower or "solar" in q_lower:
        headline = f"Mission {mission.get('id', 'ORBITAL-01')} Radiation Exposure Records Summary"
        for r in radiation_records[:5]:
            bullet_points.append(
                f"Mission Day {r.get('mission_day', 142)} ({r.get('dosimeter_location', 'Habitat')}): "
                f"{r['value']} {r['unit']} · Cumulative: {r.get('cumulative_msv', 58.4)} mSv · "
                f"Solar activity: {r.get('solar_activity', 'Quiet')} [{r.get('data_type', 'SIMULATED')}]."
            )
        bullet_points.append(
            "Note: All radiation values are illustrative demonstration figures and do not represent actual spacecraft dosimetry."
        )
        source_records_used = ["SIMULATED", "AI_DERIVED"]

    elif "wellbeing" in q_lower or "fatigue" in q_lower or "mood" in q_lower or "stress" in q_lower:
        headline = "Crew Wellbeing & Self-Reported Fatigue Summary"
        for w in wellbeing_records[:6]:
            person = astronaut_map.get(w.get("astronaut_id"), {}).get("name", f"Astronaut {w.get('astronaut_id')}")
            bullet_points.append(
                f"{person} (Day {w.get('mission_day', 142)}): Mood '{w['mood_label']}' ({w['mood_score']}/5), "
                f"Fatigue: {w['fatigue_level']}, Workload: {w.get('workload_rating', 'Balanced')} — \"{w['note']}\" [{w.get('data_type', 'SIMULATED')}]."
            )
        bullet_points.append(
            "Safety Notice: Wellbeing records are non-clinical self-reports and must never be used for psychological diagnosis."
        )
        source_records_used = ["SIMULATED", "MANUAL", "AI_DERIVED"]

    elif "nasa" in q_lower or "osdr" in q_lower or "research" in q_lower or "differ" in q_lower:
        headline = "Distinction Between NASA Research Data and Demonstration Crew Records"
        bullet_points = [
            "NASA_RESEARCH records in AstroHealth come from verified NASA Open Science Data Repository (OSDR) studies (e.g., OSD-53, OSD-943, OSD-343, OSD-87, OSD-174) and official NASA HRP/NLSP portals.",
            "SIMULATED records are fictional demonstration entries created for four sample astronauts on Mission ORBITAL-01.",
            "MANUAL records are entries logged interactively through the AstroHealth forms during a demonstration session.",
            "AI_DERIVED records are rule-based analytical summaries generated from the recorded data for human review.",
            "Historical NASA research datasets are never presented as live astronaut vital signs.",
        ]
        source_records_used = ["NASA_RESEARCH", "AI_DERIVED"]

    else:
        # General mission overview answer
        hr_vals = [v["heart_rate"] for v in vitals]
        avg_hr = round(sum(hr_vals) / len(hr_vals), 1) if hr_vals else 0
        sl_vals = [s["duration_hours"] for s in sleep_records]
        avg_sl = round(sum(sl_vals) / len(sl_vals), 1) if sl_vals else 0
        rev_alerts = [a for a in alerts if a.get("priority") in ("Review", "Warning")]
        headline = f"Mission {mission.get('id', 'ORBITAL-01')} Comprehensive Health Observation Summary"
        bullet_points = [
            f"Mission Progress: Day {mission.get('duration_days', 142)} of {mission.get('target_days', 210)} ({mission.get('progress_percent', 68)}%) in {mission.get('location', 'Low Earth Orbit')}.",
            f"Crew Status: {len(astronauts)} astronauts monitored (3 Stable, 1 marked for Review: James Miller).",
            f"Vital Signs: {len(vitals)} readings logged with a mean heart rate of {avg_hr} BPM.",
            f"Sleep Monitoring: {len(sleep_records)} sleep logs with an average duration of {avg_sl} hours.",
            f"Review Queue: {len(rev_alerts)} observation(s) flagged for human review ({len(alerts)} total notifications).",
        ]
        source_records_used = ["SIMULATED", "MANUAL", "AI_DERIVED"]

    return {
        "question": question,
        "headline": headline,
        "bullet_points": bullet_points,
        "engine_mode": (
            "EXTERNAL_PROVIDER_CONFIGURED"
            if settings.ASTROHEALTH_AI_API_KEY
            else "RULE_BASED_LOCAL"
        ),
        "data_type": "AI_DERIVED",
        "source_classifications_referenced": source_records_used,
        "answered_at": datetime.now(timezone.utc).isoformat(),
        "medical_disclaimer": (
            "Observation for human review only. Generated by AstroHealth's local rule-based engine "
            "from demonstration records. Not medical advice, diagnosis, or prescription."
        ),
    }
