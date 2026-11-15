# Database Setup & Schema Documentation

## 1. Architecture Overview

AstroHealth uses **SQLAlchemy 2.x** (`backend/app/database.py` and `backend/app/models.py`) with **PyMySQL** (`pymysql`) and **Pydantic Settings** (`backend/app/config.py`) to provide a clean, production-style relational database layer that supports:

1. **MySQL / MariaDB** (configured via environment variables in `backend/.env`).
2. **Automatic Local SQLite Persistence (`astrohealth_demo.db`)** when MySQL is not configured or unreachable, ensuring the prototype runs out-of-the-box during hackathon evaluation without requiring evaluators to install and configure a local MySQL server first.

On application startup (`lifespan` in `backend/app/main.py`), `init_and_seed_db()` (`backend/app/seed.py`) automatically creates all tables and seeds the initial demonstration dataset if the tables are empty.

---

## 2. Connecting to a MySQL Database

### Step 1: Create the Database in MySQL
Run the following SQL statement in your MySQL client (MySQL Workbench, CLI, or phpMyAdmin):

```sql
CREATE DATABASE IF NOT EXISTS astrohealth
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### Step 2: Configure Environment Variables (`backend/.env`)
Copy `.env.example` to `backend/.env` and set your MySQL connection parameters (never hardcode passwords in source files):

```env
DB_ENGINE=mysql
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=astrohealth
```

Alternatively, you can provide a full SQLAlchemy connection URL:

```env
DATABASE_URL=mysql+pymysql://your_mysql_user:your_mysql_password@127.0.0.1:3306/astrohealth
```

### Step 3: Start the Backend
When `uvicorn app.main:app` starts:
- `backend/app/database.py` tests the MySQL connection (`SELECT 1`).
- If reachable, SQLAlchemy binds to MySQL (`mode: "mysql"`), creates all 7 tables, and seeds the demonstration records.
- If MySQL is unreachable, `database.py` logs a warning and falls back to `backend/astrohealth_demo.db` (`mode: "sqlite_fallback"`) so the application never crashes.
- You can verify the active database mode at any time via `GET /api/health` or on the frontend **Settings** page.

---

## 3. Relational Database Schema (7 Tables)

### 3.1 `missions` (`MissionModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `VARCHAR(32)` | `PRIMARY KEY` | Mission identifier (e.g., `ORBITAL-01`) |
| `name` | `VARCHAR(120)` | `NOT NULL` | Mission name |
| `location` | `VARCHAR(120)` | `NOT NULL` | Orbital regime (e.g., `Low Earth Orbit`) |
| `status` | `VARCHAR(64)` | `NOT NULL` | Mission status (`Demonstration`) |
| `duration_days` | `INTEGER` | `NOT NULL` | Elapsed mission days (`142`) |
| `target_days` | `INTEGER` | `NOT NULL` | Total planned mission days (`210`) |
| `progress_percent` | `INTEGER` | `NOT NULL` | Completion percentage (`68`) |
| `vehicle` | `VARCHAR(120)` | `NOT NULL` | Spacecraft/habitat name |
| `objective` | `TEXT` | `NOT NULL` | Mission health-monitoring objective |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | Source classification (`SIMULATED`) |

### 3.2 `astronauts` (`AstronautModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY` | Numeric astronaut ID (`1`–`4`) |
| `code` | `VARCHAR(32)` | `UNIQUE, NOT NULL` | Crew code (`AST-01`–`AST-04`) |
| `name` | `VARCHAR(120)` | `NOT NULL` | Crew member name |
| `role` | `VARCHAR(120)` | `NOT NULL` | Mission role (`Commander`, `Flight Engineer`, etc.) |
| `specialty` | `VARCHAR(160)` | `NOT NULL` | Technical/scientific specialty |
| `status` | `VARCHAR(64)` | `NOT NULL` | Demonstration status (`Stable` or `Review`) |
| `mission_id` | `VARCHAR(32)` | `FOREIGN KEY (missions.id)` | Associated mission ID |
| `assigned_day` | `INTEGER` | `NOT NULL` | Current mission day |
| `eva_hours` | `FLOAT` | `NOT NULL` | Logged simulated EVA hours |
| `summary_note` | `TEXT` | `NOT NULL` | Profile context summary |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | Source classification (`SIMULATED`) |

### 3.3 `vital_readings` (`VitalReadingModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTO_INCREMENT` | Reading ID |
| `astronaut_id` | `INTEGER` | `FOREIGN KEY (astronauts.id)` | Astronaut reference |
| `mission_day` | `INTEGER` | `NOT NULL` | Mission day number |
| `time` | `VARCHAR(16)` | `NOT NULL` | Time label (`HH:MM`) |
| `timestamp` | `VARCHAR(64)` | `NOT NULL` | ISO-8601 UTC timestamp |
| `heart_rate` | `INTEGER` | `NOT NULL` | Heart rate (`BPM`) |
| `spo2` | `FLOAT` | `NOT NULL` | Blood oxygen saturation (`%`) |
| `systolic_bp` | `INTEGER` | `NOT NULL` | Systolic blood pressure (`mmHg`) |
| `diastolic_bp` | `INTEGER` | `NOT NULL` | Diastolic blood pressure (`mmHg`) |
| `respiration_rate` | `FLOAT` | `NOT NULL` | Respiration rate (`breaths/min`) |
| `skin_temp_c` | `FLOAT` | `NOT NULL` | Skin temperature (`°C`) |
| `activity_context` | `VARCHAR(64)` | `NOT NULL` | Activity context during measurement |
| `unit` | `VARCHAR(16)` | `NOT NULL` | Primary unit (`BPM`) |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | `SIMULATED` or `MANUAL` |
| `note` | `TEXT` | `NULLABLE` | Optional observation note |

### 3.4 `sleep_records` (`SleepRecordModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTO_INCREMENT` | Sleep record ID |
| `astronaut_id` | `INTEGER` | `FOREIGN KEY (astronauts.id)` | Astronaut reference |
| `mission_day` | `INTEGER` | `NOT NULL` | Mission day number |
| `date_label` | `VARCHAR(32)` | `NOT NULL` | Display label (`Mission Day 142`) |
| `duration_hours` | `FLOAT` | `NOT NULL` | Total sleep duration (`hours`) |
| `deep_sleep_hours` | `FLOAT` | `NOT NULL` | Deep sleep stage duration (`hours`) |
| `rem_sleep_hours` | `FLOAT` | `NOT NULL` | REM sleep stage duration (`hours`) |
| `light_sleep_hours` | `FLOAT` | `NOT NULL` | Light sleep stage duration (`hours`) |
| `sleep_efficiency` | `INTEGER` | `NOT NULL` | Sleep efficiency percentage (`%`) |
| `interruptions` | `INTEGER` | `NOT NULL` | Number of wake interruptions |
| `quality_label` | `VARCHAR(32)` | `NOT NULL` | `Optimal`, `Adequate`, or `Review` |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | `SIMULATED` or `MANUAL` |
| `note` | `TEXT` | `NULLABLE` | Optional sleep note |

### 3.5 `wellbeing_records` (`WellbeingRecordModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTO_INCREMENT` | Wellbeing record ID |
| `astronaut_id` | `INTEGER` | `FOREIGN KEY (astronauts.id)` | Astronaut reference |
| `mission_day` | `INTEGER` | `NOT NULL` | Mission day number |
| `timestamp` | `VARCHAR(64)` | `NOT NULL` | ISO-8601 UTC timestamp |
| `mood_label` | `VARCHAR(64)` | `NOT NULL` | Self-reported mood descriptor |
| `mood_score` | `INTEGER` | `NOT NULL` | Subjective scale (`1`–`5`) |
| `fatigue_level` | `VARCHAR(32)` | `NOT NULL` | `Low`, `Moderate`, or `Elevated` |
| `fatigue_score` | `INTEGER` | `NOT NULL` | Subjective scale (`1`–`5`) |
| `stress_level` | `VARCHAR(32)` | `NOT NULL` | `Low`, `Moderate`, or `Elevated` |
| `workload_rating` | `VARCHAR(32)` | `NOT NULL` | `Light`, `Balanced`, or `High` |
| `note` | `TEXT` | `NOT NULL` | Crew check-in reflection note |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | `SIMULATED` or `MANUAL` |

### 3.6 `radiation_records` (`RadiationRecordModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTO_INCREMENT` | Radiation record ID |
| `mission_id` | `VARCHAR(32)` | `NOT NULL` | Mission ID (`ORBITAL-01`) |
| `mission_day` | `INTEGER` | `NOT NULL` | Mission day number |
| `timestamp` | `VARCHAR(64)` | `NOT NULL` | ISO-8601 UTC timestamp |
| `value` | `FLOAT` | `NOT NULL` | Recorded daily value (`mSv`) |
| `cumulative_msv` | `FLOAT` | `NOT NULL` | Cumulative mission exposure (`mSv`) |
| `unit` | `VARCHAR(16)` | `NOT NULL` | Measurement unit (`mSv`) |
| `dosimeter_location` | `VARCHAR(64)` | `NOT NULL` | Habitat location |
| `solar_activity` | `VARCHAR(32)` | `NOT NULL` | Space weather context (`Quiet`, etc.) |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | `SIMULATED` or `MANUAL` |
| `note` | `TEXT` | `NOT NULL` | Explanatory note |

### 3.7 `alerts` (`AlertModel`)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | `PRIMARY KEY, AUTO_INCREMENT` | Alert ID |
| `astronaut_id` | `INTEGER` | `FOREIGN KEY (astronauts.id), NULLABLE` | Optional astronaut link |
| `mission_id` | `VARCHAR(32)` | `NOT NULL` | Mission ID (`ORBITAL-01`) |
| `title` | `VARCHAR(160)` | `NOT NULL` | Alert headline |
| `description` | `TEXT` | `NOT NULL` | Short summary |
| `explanation` | `TEXT` | `NOT NULL` | Detailed non-clinical explanation |
| `category` | `VARCHAR(64)` | `NOT NULL` | Domain category |
| `priority` | `VARCHAR(32)` | `NOT NULL` | `Review`, `Warning`, or `Information` |
| `timestamp` | `VARCHAR(64)` | `NOT NULL` | ISO-8601 UTC timestamp |
| `is_read` | `BOOLEAN` | `NOT NULL` | Read/unread toggle state |
| `data_type` | `VARCHAR(32)` | `NOT NULL` | `SIMULATED` or `NASA_RESEARCH` |
