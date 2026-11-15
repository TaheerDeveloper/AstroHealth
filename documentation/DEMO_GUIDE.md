# AstroHealth — Demonstration & User Journey Guide

## 1. Quick Start (Running the Complete Application)

### Step 1: Start the FastAPI Backend (Port 8000)
Open PowerShell in `C:\Users\lenovo\Desktop\AstroHealth\backend`:

```powershell
cd C:\Users\lenovo\Desktop\AstroHealth\backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

- **Backend Base URL:** `http://127.0.0.1:8000/`
- **Interactive Swagger API Docs:** `http://127.0.0.1:8000/docs`

### Step 2: Start the React + Vite Frontend (Port 5173)
Open a second PowerShell window in `C:\Users\lenovo\Desktop\AstroHealth\frontend`:

```powershell
cd C:\Users\lenovo\Desktop\AstroHealth\frontend
npm.cmd run dev
```

- **Frontend Application URL:** `http://localhost:5173/`

---

## 2. Main Features to Demonstrate (3-Minute Judge Walkthrough)

### A. Mission Control Overview (`Overview`)
1. Point out the prominent top banner: **`SIMULATED DEMONSTRATION DATA — NOT REAL ASTRONAUT MEDICAL RECORDS`**.
2. Show the four live mission KPI cards loaded from the backend:
   - **Active astronauts:** `04` (3 Stable, 1 flagged for Review).
   - **Health readings:** `16` multi-parameter readings across the crew (`7` diurnal timepoints on the primary 24h series).
   - **Pending reviews:** `02` observations marked for human review.
   - **Mission duration:** `142 days` (`68%` progress on Mission `ORBITAL-01`).
3. Use the **Astronaut dropdown** on the Heart Rate Trends chart to switch between the primary 24h diurnal curve and individual astronauts (`Alex Rivera`, `Sarah Chen`, `James Miller`, `Lisa Park`), observing the dynamically calculated mean BPM.

### B. Selectable Astronaut Profiles (`Astronauts`)
1. Click **Astronauts** in the sidebar (or click any astronaut row on the Overview).
2. Review the 4 crew cards showing astronaut code (`AST-01`–`AST-04`), role, specialty, latest heart rate, latest sleep duration, and latest wellbeing check-in.
3. Click **James Miller (`AST-03` · Research Specialist · `Review`)** to open his **Individual Astronaut Profile View**:
   - Inspect his personal heart-rate trend chart, sleep logs (`6.2 hrs`, `78%` efficiency), moderate fatigue wellbeing check-in, and specific schedule-review alerts.
   - Click **"AI Summary for James"** to jump directly to an astronaut-scoped AI Health Assistant summary.

### C. Multi-Parameter Vital Signs & Manual Logging (`Vital Signs`)
1. Switch between physiological parameters using the metric selector: **Heart Rate (`BPM`)**, **SpO2 (`%`)**, **Systolic Blood Pressure (`mmHg`)**, **Respiration Rate (`br/min`)**, and **Skin Temperature (`°C`)**.
2. Use the **"Log manual vital sign reading"** form on the left to submit a new reading for any astronaut.
3. Observe that the newly added entry immediately appears in the chart and Reading Log with a green **`MANUAL`** source classification badge.

### D. Sleep Architecture & Wellbeing Check-ins (`Sleep Monitor` & `Wellbeing`)
1. On **Sleep Monitor**, inspect the stacked bar chart comparing **Deep**, **REM**, and **Light** sleep hours across the crew, and log a manual sleep session.
2. On **Wellbeing**, review subjective mood scores (`1–5`), fatigue levels (`Low`, `Moderate`, `Elevated`), and workload ratings, and submit a manual crew check-in. Point out the non-diagnostic safety notice.

### E. Space Environment Radiation Logs (`Radiation`)
1. View the daily habitat dosimetry trend (`mSv`) across Mission Days `138–142` alongside cumulative mission exposure (`58.4 mSv`) and solar activity context (`Quiet` vs. `Minor Fluctuation`).

### F. AI Health Assistant (`AI Health Assistant`)
1. Show the transparent architecture disclosure: **`RULE_BASED_LOCAL`** engine producing observations tagged **`AI_DERIVED`**.
2. Switch the scope selector between **Full Mission Crew** and individual astronauts.
3. Click any suggested question chip (e.g., *"How are James Miller's sleep and heart-rate records trending?"* or *"How do the manual or simulated crew records differ from NASA OSDR research?"*) or type a custom question to generate a structured bullet-point analysis.

### G. NASA Open Science Data Repository Integration (`NASA Research`)
1. Show the verified NASA OSDR studies (`OSD-53`, `OSD-943`, `OSD-343`, `OSD-87`, `OSD-174`) tagged **`NASA_RESEARCH`**.
2. Use the live search box (e.g., query `immune` or `astronaut`) to query `GET /api/nasa/research` (connected to `https://osdr.nasa.gov/osdr/data/search`).
3. Click **"Open Study in NASA OSDR"** or **"OSDR API Metadata JSON"** to open the official NASA resource in a new browser tab.

### H. Global Search, Notifications & Offline Support (`Search`, `Notifications`, `Settings`)
1. Click **"Search records..."** in the top bar and type `James`, `OSD-53`, or `Review` to search across astronauts, alerts, and NASA datasets simultaneously.
2. Click the **Bell icon** in the top bar to open the Notifications drawer and toggle read/unread status.
3. Open **Settings** to inspect the SQLAlchemy database status and Offline Sync Queue controls.

---

## 3. Summary of Simulated vs. Real Data

| Data Category | Classification Badge | Source Description |
| :--- | :--- | :--- |
| Pre-seeded Crew, Vitals, Sleep, Wellbeing, Radiation, Alerts | `SIMULATED` | Fictional demonstration records created for Mission `ORBITAL-01`. |
| User-Submitted Form Entries | `MANUAL` | Logged interactively during a demonstration session; persisted in SQLAlchemy DB (or queued offline). |
| NASA OSDR Studies & Space-Health Portals | `NASA_RESEARCH` | Real scientific study metadata and links from `https://osdr.nasa.gov/`, `https://www.nasa.gov/hrp/`, and `https://nlsp.nasa.gov/`. |
| Assistant Summaries & Q&A Responses | `AI_DERIVED` | Generated by AstroHealth's deterministic local rule-based engine from recorded data. |
