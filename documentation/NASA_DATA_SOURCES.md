# NASA Data Sources & Space-Health Research Attribution

## 1. Overview & Purpose

**AstroHealth** integrates official space-health research references to ground its astronaut health monitoring workflow in verified scientific literature. In accordance with the requirements of **NASA Space Apps Challenge 2026 — Challenge 5 ("Create Health Monitoring Software for Astronauts on Space Missions")**, AstroHealth strictly separates **historical scientific research datasets (`NASA_RESEARCH`)** from **simulated demonstration crew telemetry (`SIMULATED`)** and **manually entered records (`MANUAL`)**.

> **Important Attribution & Non-Endorsement Notice:**
> AstroHealth is an independent student innovation prototype. It is **not** an official NASA product and does not claim NASA endorsement. Research metadata and study links are provided courtesy of the NASA Open Science Data Repository (OSDR), NASA Human Research Program (HRP), and NASA Life Sciences Portal (NLSP).

---

## 2. Official NASA Resources Investigated & Integrated

| Resource Name | Official URL | Integration Status in AstroHealth |
| :--- | :--- | :--- |
| **NASA Open Science Data Repository (OSDR)** | https://osdr.nasa.gov/ | **Live API + Verified Baseline Catalogue**: Backend queries `https://osdr.nasa.gov/osdr/data/search` and links directly to `https://osdr.nasa.gov/bio/repo/data/studies/{Accession}` and `https://osdr.nasa.gov/osdr/data/osd/meta/{id}`. |
| **NASA OSDR API Documentation** | https://www.nasa.gov/osdr-api/ | **Integrated**: Used in `backend/app/nasa_service.py` to query study metadata and search hits. |
| **NASA Human Research Program (HRP)** | https://www.nasa.gov/hrp/ | **Integrated in Portal Catalogue**: Referenced for the five hazards of human spaceflight (radiation, isolation, distance, gravity fields, hostile environments). |
| **NASA Life Sciences Portal (NLSP)** | https://nlsp.nasa.gov/ | **Integrated in Portal Catalogue**: Linked for archival spaceflight life-sciences investigations. |
| **NASA Open APIs** | https://api.nasa.gov/ | **Integrated in Portal Catalogue**: Documented via `NASA_API_KEY` environment configuration. |

---

## 3. Verified NASA OSDR Datasets Indexed in AstroHealth

Every dataset below is a real, publicly verifiable study archived in the NASA Open Science Data Repository (`https://osdr.nasa.gov/`):

1. **`OSD-53` (`GLDS-53` / `E-GEOD-47126`) — *Spaceflight Modulates Gene Expression in Astronauts***
   - **Organism:** *Homo sapiens*
   - **Material Type:** Whole Blood
   - **Assay:** Transcription profiling (DNA microarray)
   - **Study URL:** https://osdr.nasa.gov/bio/repo/data/studies/OSD-53
   - **OSDR API Metadata URL:** https://osdr.nasa.gov/osdr/data/osd/meta/53
   - **Relevance to AstroHealth:** Demonstrates longitudinal immune and cellular adaptation in human astronauts exposed to spaceflight stressors.

2. **`OSD-943` — *Longitudinal Transcriptomic and Epigenetic Analysis in Astronauts Reveals Dynamic Immune Response to Spaceflight***
   - **Organism:** *Homo sapiens*
   - **Material Type:** Peripheral Blood / Leukocytes
   - **Assay:** DNA Methylation & Transcriptomic Profiling
   - **Study URL:** https://osdr.nasa.gov/bio/repo/data/studies/OSD-943
   - **OSDR API Metadata URL:** https://osdr.nasa.gov/osdr/data/osd/meta/943
   - **Relevance to AstroHealth:** Supports baseline-relative longitudinal trend monitoring across pre-flight, in-flight, and recovery phases.

3. **`OSD-343` (`GLDS-343`) — *Comprehensive Multi-Omics Analysis Reveals Mitochondrial Stress as a Central Biological Hub for Spaceflight Impact***
   - **Organism:** *Homo sapiens* / *Mus musculus*
   - **Material Type:** Multiple Tissues & Biofluids
   - **Assay:** Multi-Omics (Transcriptomics, Proteomics, Metabolomics)
   - **Study URL:** https://osdr.nasa.gov/bio/repo/data/studies/OSD-343
   - **OSDR API Metadata URL:** https://osdr.nasa.gov/osdr/data/osd/meta/343
   - **Relevance to AstroHealth:** Connects circadian rhythm disruption, fatigue, and metabolic stress to daily sleep and wellbeing monitoring.

4. **`OSD-87` (`GLDS-87`) — *Spaceflight Effects on the Retina: Histological, Gene Expression and Epigenetic Changes (STS-135)***
   - **Organism:** *Mus musculus*
   - **Material Type:** Ocular / Retinal Tissue
   - **Assay:** Histology, Gene Expression & Epigenetic Profiling
   - **Study URL:** https://osdr.nasa.gov/bio/repo/data/studies/OSD-87
   - **OSDR API Metadata URL:** https://osdr.nasa.gov/osdr/data/osd/meta/87
   - **Relevance to AstroHealth:** Provides scientific context on Spaceflight-Associated Neuro-ocular Syndrome (SANS) and ocular health tracking.

5. **`OSD-174` (`GLDS-174`) — *ISS Environmental & Microbial Monitoring and Crew Habitat Assessment***
   - **Organism:** Spacecraft Microbiome / Environmental
   - **Material Type:** Spacecraft Surface & Air Samples
   - **Study URL:** https://osdr.nasa.gov/bio/repo/data/studies/OSD-174
   - **OSDR API Metadata URL:** https://osdr.nasa.gov/osdr/data/osd/meta/174
   - **Relevance to AstroHealth:** Highlights the importance of pairing spacecraft habitat telemetry with individual crew health logs.

---

## 4. Strict Data Classification Standard

AstroHealth enforces five explicit data classifications across both backend schemas (`backend/app/schemas.py`) and frontend badges (`<DataBadge />`):

- **`NASA_RESEARCH`**: Verified scientific studies and metadata retrieved from or linked to NASA OSDR, HRP, and NLSP.
- **`SIMULATED`**: Fictional demonstration records for the four sample crew members (`Alex Rivera`, `Sarah Chen`, `James Miller`, `Lisa Park`) on Mission `ORBITAL-01`.
- **`MANUAL`**: Records entered interactively by users through the Vital Signs, Sleep, Wellbeing, or Radiation logging forms.
- **`AI_DERIVED`**: Analytical summaries and Q&A responses generated by AstroHealth's rule-based observation engine.
- **`SENSOR`**: Reserved strictly for physical sensor hardware connections (not used for simulated data).

---

## 5. Scientific & Privacy Limitations

1. **No Real Astronaut Medical Telemetry:** Individual astronaut medical records are protected by strict medical privacy regulations (such as the Privacy Act and HIPAA/medical confidentiality rules) and are not publicly streamed. Therefore, all individual crew vital signs, sleep logs, wellbeing check-ins, and radiation doses in AstroHealth are explicitly labelled **`SIMULATED`** or **`MANUAL`**.
2. **Historical Research vs. Live Telemetry:** Historical NASA OSDR datasets (`NASA_RESEARCH`) are never mixed with or displayed as live astronaut vital signs.
3. **Resilient Offline Fallback:** When live queries to `https://osdr.nasa.gov/osdr/data/search` succeed, the backend returns `integration_status: "LIVE_NASA_OSDR_API"`. If the user's machine is offline or NASA's API experiences downtime, AstroHealth seamlessly serves the verified baseline OSDR catalogue (`VERIFIED_OFFLINE_CATALOGUE`) without fabricating studies or citations.
