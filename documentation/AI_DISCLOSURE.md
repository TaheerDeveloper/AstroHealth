# AI Disclosure & Transparency Statement

## 1. AI Usage in the AstroHealth Product (`AI Health Assistant`)

### Actual Product Architecture
The **AI Health Assistant** inside AstroHealth (`GET /api/ai/summary` and `POST /api/ai/ask`, implemented in `backend/app/ai_service.py`) uses a **transparent, deterministic, local rule-based analytical engine (`engine_mode: "RULE_BASED_LOCAL"`)** by default.

- **No False Generative AI Claims:** AstroHealth does **not** claim to be connected to a live clinical Large Language Model (LLM) when running out-of-the-box without an external API key.
- **How the Local Engine Works:**
  1. Aggregates recorded crew vital signs (mean/min/max heart rate, net BPM change, mean SpO2), sleep records (mean duration, sleep stages, efficiency %, records below the 6.5-hour illustrative rest target), subjective wellbeing check-ins (mood score, perceived fatigue level), radiation dosimetry logs, and unread/pending review alerts.
  2. Generates structured, explainable observations categorized into *Crew Overview*, *Vital Signs Trend*, *Sleep & Circadian Rhythm*, *Wellbeing & Fatigue Check-ins*, and *Space Environment & Dosimetry*.
  3. Answers natural-language questions about specific astronauts (e.g., *James Miller*, *Alex Rivera*), sleep comparisons, radiation exposure logs, wellbeing check-ins, and NASA OSDR research distinctions.
  4. Tags every generated insight and Q&A response with `data_type: "AI_DERIVED"` and lists the underlying record classifications referenced (`SIMULATED`, `MANUAL`, `NASA_RESEARCH`).
- **Server-Side Extensibility:** `backend/app/config.py` includes optional server-side environment variables (`AI_PROVIDER` and `ASTROHEALTH_AI_API_KEY`) so an external LLM provider can be connected on the backend in the future without ever exposing API keys in frontend code.

---

## 2. Medical & Clinical Safety Boundaries

- **Non-Diagnostic Prototype:** AstroHealth is an independent student educational prototype, **not** a certified medical device.
- **No Diagnosis or Treatment:** The AI Health Assistant never diagnoses medical or psychological conditions, never prescribes medication or clinical countermeasures, and never replaces flight-surgeon or physician judgment.
- **Terminology Standard:** All flagged items use non-clinical phrasing such as **"Observation for Review"** or **"Schedule Review Requested"**, and any reference ranges (such as 60–85 BPM resting heart rate or 6.5–7.5 hours of sleep) are explicitly identified as illustrative demonstration ranges rather than validated clinical thresholds.

---

## 3. AI Tools Used During Software Development

In accordance with NASA Space Apps Challenge transparency guidelines, the following AI-assisted software engineering tools were used during development and project completion:

- **AI Coding Assistant (Antigravity / Gemini):** Assisted with inspecting the existing React + TypeScript + FastAPI codebase, designing SQLAlchemy ORM models, building the NASA OSDR API service integration (`nasa_service.py`), implementing the rule-based analytical assistant (`ai_service.py`), completing interactive frontend views and offline caching (`App.tsx`, `fallbackData.ts`), running automated build and endpoint tests, and structuring project documentation.
- **Human Verification & Data Integrity:** All scientific study accessions (`OSD-53`, `OSD-943`, `OSD-343`, `OSD-87`, `OSD-174`) were verified against the live public NASA Open Science Data Repository API (`https://osdr.nasa.gov/osdr/data/search`), and all demonstration crew records are prominently marked as simulated.
