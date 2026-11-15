# AstroHealth — NASA Space Apps Challenge 2026 Final Submission Package

**Project Title:** AstroHealth — Intelligent Health Monitoring Beyond Earth  
**Challenge:** NASA Space Apps Challenge 2026 — Challenge 5: *"Create Health Monitoring Software for Astronauts on Space Missions"*  
**Project Type:** Independent Student Innovation Prototype (Non-Clinical / Educational Demonstration)

---

## PART 1: 7-SLIDE PRESENTATION DECK

---

### SLIDE 1: Title & Project Identity
- **Headline:** **ASTROHEALTH** — *Intelligent Health Monitoring Beyond Earth*
- **Subtitle:** NASA Space Apps Challenge 2026 · Challenge 5: *Create Health Monitoring Software for Astronauts on Space Missions*
- **Visual Concept:** Dark aerospace mission-control dashboard (`#07111F` background, `#39C5E8` cyan accents) displaying the `ORBITAL-01` mission card, crew status indicators, and the prominent `SIMULATED DEMONSTRATION DATA` integrity banner.
- **Key Notice:** Independent student innovation prototype. Not an official NASA product and not a certified medical device.

---

### SLIDE 2: Why Astronaut Health Monitoring Matters (The Problem)
- **Spaceflight Hazards:** Astronauts on orbital, lunar, and deep-space missions face microgravity cardiovascular deconditioning, circadian rhythm disruption, isolation/workload fatigue, and space radiation exposure.
- **Communication Delays & Autonomy:** As missions extend beyond Low Earth Orbit, crews and ground support teams need unified, offline-resilient software that consolidates disparate health logs into clear longitudinal trends.
- **Data Fragmentation Risk:** Without a unified workspace that pairs daily vital readings, sleep architecture, subjective wellbeing check-ins, and habitat radiation records with scientific reference studies, early trend changes can be harder to spot during busy mission timelines.

---

### SLIDE 3: The Proposed Solution — AstroHealth
- **Unified Mission-Control Health Workspace:** A full-stack web platform (React + TypeScript + FastAPI + SQLAlchemy) that brings together physiological trends, sleep recovery, subjective wellbeing logs, environmental radiation records, and NASA space-health research in one cohesive interface.
- **Strict Data Integrity by Design:** Every record in AstroHealth carries an explicit source badge:
  - `SIMULATED` — Pre-loaded fictional demonstration crew records.
  - `MANUAL` — Interactive crew/operator entries logged during a session.
  - `NASA_RESEARCH` — Verified scientific studies from NASA OSDR, HRP, and NLSP.
  - `AI_DERIVED` — Explainable, rule-based observations for human review.
  - `SENSOR` — Reserved strictly for verified hardware telemetry streams.

---

### SLIDE 4: Main Working Features
1. **Mission Overview Dashboard:** Live KPI cards (active crew, reading counts, review queue, mission duration/progress), dynamic multi-astronaut heart-rate trends, sleep efficiency bars, and radiation summary.
2. **Selectable Astronaut Profiles:** Dedicated individual views for all 4 crew members (`Alex Rivera`, `Sarah Chen`, `James Miller`, `Lisa Park`) aggregating their vitals, sleep history, wellbeing notes, and alerts.
3. **Multi-Parameter Vital Signs, Sleep, Wellbeing & Radiation Modules:** Interactive Recharts visualizations (Heart Rate, SpO2, BP, Respiration, Skin Temp, Sleep Stages, Dosimetry) plus real-time manual logging forms (`POST /api/vitals`, `/api/sleep`, `/api/wellbeing`, `/api/radiation`).
4. **Global Search, Notifications & Offline Queue:** Instant cross-domain search, read/unread notification management, and `localStorage` offline caching with queued entry synchronization.

---

### SLIDE 5: NASA Research & Open Data Connection
- **Live NASA OSDR API Integration (`GET /api/nasa/research`):** Queries the public NASA Open Science Data Repository Search API (`https://osdr.nasa.gov/osdr/data/search`) with a verified offline fallback catalogue.
- **Verified Space-Health Studies Included:**
  - `OSD-53` (*Spaceflight Modulates Gene Expression in Astronauts*)
  - `OSD-943` (*Longitudinal Transcriptomic and Epigenetic Analysis in Astronauts*)
  - `OSD-343` (*Comprehensive Multi-Omics Analysis Reveals Mitochondrial Stress as a Central Biological Hub for Spaceflight Impact*)
  - `OSD-87` (*Spaceflight Effects on the Retina — STS-135*)
  - `OSD-174` (*ISS Environmental & Microbial Monitoring*)
- **Scientific Honesty:** Historical NASA research is clearly separated from simulated crew logs and is never presented as live astronaut vital signs.

---

### SLIDE 6: Technical Implementation & Transparent AI Assistant
- **Frontend Stack:** React 19, TypeScript, Vite, Recharts, Lucide React icons, Axios, responsive CSS (`#07111F` aerospace theme), and local offline cache/sync queue.
- **Backend & Database Stack:** Python FastAPI, Uvicorn, Pydantic v2 validation, HTTPX, and SQLAlchemy 2.x ORM (MySQL-compatible via PyMySQL with automatic zero-config SQLite fallback).
- **Transparent AI Health Assistant (`RULE_BASED_LOCAL`):**
  - Analyzes recorded crew vitals, sleep durations, wellbeing check-ins, and review alerts to produce explainable summaries and interactive Q&A answers (`AI_DERIVED`).
  - Makes no false claims of live clinical LLM connections and strictly uses non-diagnostic "observation for review" phrasing.

---

### SLIDE 7: Impact, Limitations & Future Potential
- **Educational & Operational Impact:** Demonstrates how human-centered software design, transparent rule-based analytics, and open NASA science repositories can work together to support crew health awareness.
- **Current Honest Limitations:**
  - Uses fictional demonstration crew records (`SIMULATED`) because real astronaut medical telemetry is private.
  - Not a certified medical device; does not diagnose or prescribe treatment.
- **Future Roadmap:**
  - Wearable sensor integration (`SENSOR` classification via WebBluetooth / HL7 FHIR).
  - Server-side flight-surgeon LLM summarization connected to full NASA OSDR multi-omics tables.
  - Multi-mission synchronization with simulated Mars communication latency (`4–24 min` one-way light time).

---

## PART 2: 30-SECOND DEMO VIDEO SCRIPT & STORYBOARD

| Time | Visual / Screen Action | Voiceover Script |
| :--- | :--- | :--- |
| **0:00–0:06** | Show **Overview Dashboard** (`http://localhost:5173`) with `ORBITAL-01` mission progress, heart-rate chart, and `SIMULATED DEMONSTRATION DATA` banner. | *"On long-duration space missions, monitoring crew health requires unifying physiological trends, sleep recovery, and environmental context. Meet AstroHealth."* |
| **0:06–0:13** | Click **Astronauts** → Select **James Miller (`Review`)** to reveal his personal vital trend, 6.2-hour sleep log, and moderate fatigue check-in. | *"Flight surgeons and crew can inspect individual astronaut profiles, tracking heart rate, SpO2, sleep stages, and self-reported wellbeing check-ins."* |
| **0:13–0:20** | Open **Vital Signs** (log a `MANUAL` reading) → Switch to **AI Health Assistant** and click a prompt chip to generate an `AI_DERIVED` summary. | *"Crew members can log manual readings with offline sync support, while our transparent rule-based assistant summarizes observations for human review."* |
| **0:20–0:26** | Open **NASA Research** page showing verified `OSD-53` and `OSD-943` studies (`NASA_RESEARCH`) with direct links to `osdr.nasa.gov`. | *"Grounded in verified NASA Open Science Data Repository studies and built with strict data integrity."* |
| **0:26–0:30** | Return to **Overview** showing the full mission-control interface. | *"AstroHealth: Intelligent Health Monitoring Beyond Earth."* |
