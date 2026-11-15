import type {
  AlertItem,
  AstronautProfile,
  Mission,
  NasaDataset,
  NasaPortal,
  OfflineQueueItem,
  RadiationRecord,
  SleepRecord,
  VitalReading,
  WellbeingRecord,
} from "./types";

const CACHE_KEY_PREFIX = "astrohealth_cache_v1_";
const OFFLINE_QUEUE_KEY = "astrohealth_offline_queue_v1";

export function saveCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadCache<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineQueueItem[];
  } catch {
    return [];
  }
}

export function enqueueOfflineItem(item: Omit<OfflineQueueItem, "id" | "created_at">): OfflineQueueItem[] {
  const current = getOfflineQueue();
  const entry: OfflineQueueItem = {
    ...item,
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
  };
  const updated = [...current, entry];
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
  return updated;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {
    // Ignore
  }
}

export function clearAllAstroHealthCache(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(CACHE_KEY_PREFIX) || k === OFFLINE_QUEUE_KEY) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // Ignore
  }
}

export const FALLBACK_MISSION: Mission = {
  id: "ORBITAL-01",
  name: "Orbital Research Mission",
  location: "Low Earth Orbit",
  status: "Demonstration",
  duration_days: 142,
  target_days: 210,
  progress_percent: 68,
  vehicle: "Orbital Research Habitat Haven-1",
  objective:
    "Demonstration mission tracking crew vital signs, circadian sleep patterns, subjective wellbeing check-ins, and orbital radiation dosimetry logs.",
  data_type: "SIMULATED",
};

export const FALLBACK_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 1,
    code: "AST-01",
    name: "Alex Rivera",
    role: "Commander",
    specialty: "Command & Flight Systems",
    status: "Stable",
    mission_id: "ORBITAL-01",
    assigned_day: 142,
    eva_hours: 18.5,
    summary_note:
      "Simulated demonstration profile. Consistent resting heart rate and sleep efficiency across Mission Days 138–142.",
    data_type: "SIMULATED",
    avg_heart_rate: 71.4,
    avg_sleep_hours: 7.3,
  },
  {
    id: 2,
    code: "AST-02",
    name: "Sarah Chen",
    role: "Flight Engineer",
    specialty: "Environmental Control & Life Support Systems",
    status: "Stable",
    mission_id: "ORBITAL-01",
    assigned_day: 142,
    eva_hours: 14.0,
    summary_note:
      "Simulated demonstration profile. Nominal cardiovascular and sleep recovery records during station maintenance.",
    data_type: "SIMULATED",
    avg_heart_rate: 69.3,
    avg_sleep_hours: 7.1,
  },
  {
    id: 3,
    code: "AST-03",
    name: "James Miller",
    role: "Research Specialist",
    specialty: "Microgravity Payload & Bio-Experiments",
    status: "Review",
    mission_id: "ORBITAL-01",
    assigned_day: 142,
    eva_hours: 6.5,
    summary_note:
      "Simulated demonstration profile. Flagged for routine schedule review due to 6.2h sleep duration and mild afternoon heart-rate elevation.",
    data_type: "SIMULATED",
    avg_heart_rate: 78.0,
    avg_sleep_hours: 6.15,
  },
  {
    id: 4,
    code: "AST-04",
    name: "Lisa Park",
    role: "Mission Specialist",
    specialty: "Robotics, Dosimetry & Habitat Telemetry",
    status: "Stable",
    mission_id: "ORBITAL-01",
    assigned_day: 142,
    eva_hours: 12.0,
    summary_note:
      "Simulated demonstration profile. Steady vital readings and balanced workload check-ins.",
    data_type: "SIMULATED",
    avg_heart_rate: 69.3,
    avg_sleep_hours: 7.6,
  },
];

export const FALLBACK_VITALS: VitalReading[] = [
  { id: 1, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "00:00", timestamp: "2026-11-15T00:00:00Z", heart_rate: 66, spo2: 98.6, systolic_bp: 116, diastolic_bp: 74, respiration_rate: 13.5, skin_temp_c: 36.4, activity_context: "Sleep cycle", unit: "BPM", data_type: "SIMULATED", note: "Illustrative overnight resting reading." },
  { id: 2, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "04:00", timestamp: "2026-11-15T04:00:00Z", heart_rate: 69, spo2: 98.4, systolic_bp: 117, diastolic_bp: 75, respiration_rate: 14.0, skin_temp_c: 36.5, activity_context: "Late sleep / wake transition", unit: "BPM", data_type: "SIMULATED", note: "Illustrative pre-wake reading." },
  { id: 3, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "08:00", timestamp: "2026-11-15T08:00:00Z", heart_rate: 73, spo2: 98.8, systolic_bp: 119, diastolic_bp: 76, respiration_rate: 15.0, skin_temp_c: 36.6, activity_context: "Morning station briefing", unit: "BPM", data_type: "SIMULATED", note: "Illustrative morning duty reading." },
  { id: 4, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "12:00", timestamp: "2026-11-15T12:00:00Z", heart_rate: 78, spo2: 98.2, systolic_bp: 122, diastolic_bp: 78, respiration_rate: 16.2, skin_temp_c: 36.8, activity_context: "Resistive exercise countermeasure", unit: "BPM", data_type: "SIMULATED", note: "Illustrative midday post-exercise reading." },
  { id: 5, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "16:00", timestamp: "2026-11-15T16:00:00Z", heart_rate: 75, spo2: 98.5, systolic_bp: 120, diastolic_bp: 77, respiration_rate: 15.2, skin_temp_c: 36.7, activity_context: "Systems inspection", unit: "BPM", data_type: "SIMULATED", note: "Illustrative afternoon duty reading." },
  { id: 6, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "20:00", timestamp: "2026-11-15T20:00:00Z", heart_rate: 71, spo2: 98.7, systolic_bp: 118, diastolic_bp: 75, respiration_rate: 14.4, skin_temp_c: 36.6, activity_context: "Evening crew debrief", unit: "BPM", data_type: "SIMULATED", note: "Illustrative evening rest transition." },
  { id: 7, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, time: "23:00", timestamp: "2026-11-15T23:00:00Z", heart_rate: 68, spo2: 98.9, systolic_bp: 115, diastolic_bp: 74, respiration_rate: 13.8, skin_temp_c: 36.5, activity_context: "Pre-sleep rest", unit: "BPM", data_type: "SIMULATED", note: "Illustrative pre-sleep baseline reading." },
  { id: 8, astronaut_id: 2, astronaut_name: "Sarah Chen", mission_day: 142, time: "08:00", timestamp: "2026-11-15T08:00:00Z", heart_rate: 70, spo2: 98.9, systolic_bp: 116, diastolic_bp: 74, respiration_rate: 14.5, skin_temp_c: 36.6, activity_context: "ECLSS diagnostics", unit: "BPM", data_type: "SIMULATED", note: "Simulated morning duty reading." },
  { id: 9, astronaut_id: 3, astronaut_name: "James Miller", mission_day: 142, time: "16:00", timestamp: "2026-11-15T16:00:00Z", heart_rate: 84, spo2: 97.6, systolic_bp: 127, diastolic_bp: 82, respiration_rate: 16.8, skin_temp_c: 36.9, activity_context: "Extended lab timeline", unit: "BPM", data_type: "SIMULATED", note: "Flagged as observation for review following consecutive busy shifts." },
  { id: 10, astronaut_id: 4, astronaut_name: "Lisa Park", mission_day: 142, time: "16:00", timestamp: "2026-11-15T16:00:00Z", heart_rate: 72, spo2: 98.9, systolic_bp: 118, diastolic_bp: 75, respiration_rate: 14.6, skin_temp_c: 36.6, activity_context: "Dosimeter calibration", unit: "BPM", data_type: "SIMULATED", note: "Simulated afternoon reading." },
];

export const FALLBACK_SLEEP: SleepRecord[] = [
  { id: 1, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, date_label: "Mission Day 142", duration_hours: 7.4, deep_sleep_hours: 1.8, rem_sleep_hours: 1.9, light_sleep_hours: 3.7, sleep_efficiency: 91, interruptions: 1, quality_label: "Optimal", data_type: "SIMULATED", note: "Simulated sleep cycle log in crew quarters." },
  { id: 2, astronaut_id: 2, astronaut_name: "Sarah Chen", mission_day: 142, date_label: "Mission Day 142", duration_hours: 7.1, deep_sleep_hours: 1.6, rem_sleep_hours: 1.8, light_sleep_hours: 3.7, sleep_efficiency: 89, interruptions: 1, quality_label: "Adequate", data_type: "SIMULATED", note: "Simulated sleep cycle log." },
  { id: 3, astronaut_id: 3, astronaut_name: "James Miller", mission_day: 142, date_label: "Mission Day 142", duration_hours: 6.2, deep_sleep_hours: 1.1, rem_sleep_hours: 1.4, light_sleep_hours: 3.7, sleep_efficiency: 78, interruptions: 3, quality_label: "Review", data_type: "SIMULATED", note: "Shorter rest period following late payload experiment schedule." },
  { id: 4, astronaut_id: 4, astronaut_name: "Lisa Park", mission_day: 142, date_label: "Mission Day 142", duration_hours: 7.6, deep_sleep_hours: 1.9, rem_sleep_hours: 2.0, light_sleep_hours: 3.7, sleep_efficiency: 93, interruptions: 0, quality_label: "Optimal", data_type: "SIMULATED", note: "Simulated uninterrupted sleep cycle." },
];

export const FALLBACK_WELLBEING: WellbeingRecord[] = [
  { id: 1, astronaut_id: 1, astronaut_name: "Alex Rivera", mission_day: 142, timestamp: "2026-11-15T08:30:00Z", mood_label: "Focused & Steady", mood_score: 5, fatigue_level: "Low", fatigue_score: 1, stress_level: "Low", workload_rating: "Balanced", note: "Simulated crew check-in: Rested after 7.4h sleep; station schedule running smoothly.", data_type: "SIMULATED" },
  { id: 2, astronaut_id: 2, astronaut_name: "Sarah Chen", mission_day: 142, timestamp: "2026-11-15T08:45:00Z", mood_label: "Calm & Engaged", mood_score: 4, fatigue_level: "Low", fatigue_score: 2, stress_level: "Low", workload_rating: "Balanced", note: "Simulated crew check-in: Completed life-support filter inspection with normal energy levels.", data_type: "SIMULATED" },
  { id: 3, astronaut_id: 3, astronaut_name: "James Miller", mission_day: 142, timestamp: "2026-11-15T09:10:00Z", mood_label: "Slightly Fatigued", mood_score: 3, fatigue_level: "Moderate", fatigue_score: 3, stress_level: "Moderate", workload_rating: "High", note: "Simulated crew check-in: Mild fatigue noted after two consecutive late payload shifts; requesting timeline buffer.", data_type: "SIMULATED" },
  { id: 4, astronaut_id: 4, astronaut_name: "Lisa Park", mission_day: 142, timestamp: "2026-11-15T09:20:00Z", mood_label: "Positive & Alert", mood_score: 5, fatigue_level: "Low", fatigue_score: 1, stress_level: "Low", workload_rating: "Balanced", note: "Simulated crew check-in: Good sleep recovery and positive crew cohesion.", data_type: "SIMULATED" },
];

export const FALLBACK_RADIATION: RadiationRecord[] = [
  { id: 1, mission_id: "ORBITAL-01", mission_day: 142, timestamp: "2026-11-15T12:00:00Z", value: 0.42, cumulative_msv: 58.4, unit: "mSv", dosimeter_location: "Habitat Crew Quarters", solar_activity: "Quiet", data_type: "SIMULATED", note: "Illustrative value, not a real measurement. Daily demonstration habitat log." },
  { id: 2, mission_id: "ORBITAL-01", mission_day: 141, timestamp: "2026-11-14T12:00:00Z", value: 0.41, cumulative_msv: 57.98, unit: "mSv", dosimeter_location: "Habitat Crew Quarters", solar_activity: "Quiet", data_type: "SIMULATED", note: "Illustrative daily demonstration log (Mission Day 141)." },
  { id: 3, mission_id: "ORBITAL-01", mission_day: 140, timestamp: "2026-11-13T12:00:00Z", value: 0.45, cumulative_msv: 57.57, unit: "mSv", dosimeter_location: "Science Lab Module", solar_activity: "Minor Fluctuation", data_type: "SIMULATED", note: "Illustrative demonstration log during South Atlantic Anomaly transit simulation." },
];

export const FALLBACK_ALERTS: AlertItem[] = [
  {
    id: 1,
    astronaut_id: 3,
    astronaut_name: "James Miller",
    mission_id: "ORBITAL-01",
    title: "Trend review requested",
    description: "James Miller - Sample observation",
    explanation:
      "Simulated observation: Two consecutive sleep logs near 6.1–6.2 hours paired with afternoon heart-rate reading of 84 BPM during payload timeline. Marked for non-clinical crew schedule review.",
    category: "Sleep & Workload",
    priority: "Review",
    timestamp: "2026-11-15T16:15:00Z",
    is_read: false,
    data_type: "SIMULATED",
  },
  {
    id: 2,
    astronaut_id: null,
    astronaut_name: null,
    mission_id: "ORBITAL-01",
    title: "New health records",
    description: "Mission ORBITAL-01 - Sample entry",
    explanation:
      "Simulated notification: Daily vital sign logs, sleep duration summaries, and habitat radiation dosimetry entries for Mission Day 142 have been recorded.",
    category: "Mission Telemetry",
    priority: "Information",
    timestamp: "2026-11-15T12:05:00Z",
    is_read: false,
    data_type: "SIMULATED",
  },
  {
    id: 3,
    astronaut_id: 3,
    astronaut_name: "James Miller",
    mission_id: "ORBITAL-01",
    title: "Self-reported fatigue check-in",
    description: "James Miller - Moderate fatigue logged",
    explanation:
      "Simulated wellbeing log: Crew member reported moderate fatigue (3/5) after extended microgravity payload operations.",
    category: "Wellbeing",
    priority: "Review",
    timestamp: "2026-11-15T09:12:00Z",
    is_read: false,
    data_type: "SIMULATED",
  },
];

export const FALLBACK_NASA_DATASETS: NasaDataset[] = [
  {
    id: "OSD-53",
    accession: "OSD-53",
    legacy_id: "GLDS-53 / E-GEOD-47126",
    title: "Spaceflight Modulates Gene Expression in Astronauts",
    description:
      "Whole-blood transcription profiling study investigating how exposure to spaceflight stressors (microgravity, fluid shifts, and space radiation) modulates immune and cellular gene expression in NASA astronauts.",
    organism: "Homo sapiens",
    project_type: "Spaceflight Study",
    material_type: "Whole Blood",
    assay_type: "Transcription profiling (DNA microarray)",
    factors: ["Spaceflight", "Sex", "Time"],
    space_program: "NASA",
    publication_title: "Spaceflight modulates gene expression in the whole blood of astronauts",
    source_portal: "NASA Open Science Data Repository (OSDR)",
    source_url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-53",
    api_metadata_url: "https://osdr.nasa.gov/osdr/data/osd/meta/53",
    study_context: "Human immune and transcriptomic adaptation during orbital spaceflight.",
    relevance_to_astrohealth:
      "Provides scientific context for tracking longitudinal physiological and immune-stress indicators across mission phases.",
    data_type: "NASA_RESEARCH",
  },
  {
    id: "OSD-943",
    accession: "OSD-943",
    legacy_id: "OSD-943",
    title: "Longitudinal Transcriptomic and Epigenetic Analysis in Astronauts Reveals Dynamic Immune Response to Spaceflight",
    description:
      "Longitudinal profiling of astronaut peripheral blood mononuclear cells examining epigenetic (DNA methylation) and transcriptomic shifts pre-flight, in-flight, and post-flight.",
    organism: "Homo sapiens",
    project_type: "Spaceflight Study",
    material_type: "Blood / Leukocytes",
    assay_type: "Epigenetic & Transcriptomic Profiling",
    factors: ["Spaceflight Duration", "Recovery Phase"],
    space_program: "NASA",
    publication_title: "Longitudinal transcriptomic and epigenetic analysis in astronauts reveals dynamic immune response to spaceflight",
    source_portal: "NASA Open Science Data Repository (OSDR)",
    source_url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-943",
    api_metadata_url: "https://osdr.nasa.gov/osdr/data/osd/meta/943",
    study_context: "Longitudinal crew monitoring across pre-flight baseline, mission execution, and post-flight recovery.",
    relevance_to_astrohealth:
      "Supports AstroHealth's emphasis on baseline-relative trend monitoring rather than isolated point readings.",
    data_type: "NASA_RESEARCH",
  },
  {
    id: "OSD-343",
    accession: "OSD-343",
    legacy_id: "GLDS-343",
    title: "Comprehensive Multi-Omics Analysis Reveals Mitochondrial Stress as a Central Biological Hub for Spaceflight Impact",
    description:
      "Multi-omics investigation across spaceflight biospecimens identifying mitochondrial stress, oxidative phosphorylation shifts, and circadian rhythm regulation changes during space missions.",
    organism: "Homo sapiens / Mus musculus",
    project_type: "Spaceflight Multi-Omics Study",
    material_type: "Multiple Tissues & Biofluids",
    assay_type: "Multi-Omics (Transcriptomics, Proteomics, Metabolomics)",
    factors: ["Spaceflight", "Microgravity", "Space Radiation"],
    space_program: "NASA GeneLab / OSDR",
    publication_title: "Comprehensive Multi-Omics Analysis Reveals Mitochondrial Stress as a Central Biological Hub for Spaceflight Impact (Cell, 2020)",
    source_portal: "NASA Open Science Data Repository (OSDR)",
    source_url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-343",
    api_metadata_url: "https://osdr.nasa.gov/osdr/data/osd/meta/343",
    study_context: "Systemic metabolic, sleep/circadian, and cellular energy adaptations in microgravity.",
    relevance_to_astrohealth:
      "Informs the integration of fatigue check-ins, sleep architecture tracking, and radiation exposure logs.",
    data_type: "NASA_RESEARCH",
  },
  {
    id: "OSD-87",
    accession: "OSD-87",
    legacy_id: "GLDS-87",
    title: "Spaceflight Effects on the Retina: Histological, Gene Expression and Epigenetic Changes (STS-135)",
    description:
      "Investigation onboard Space Shuttle mission STS-135 examining molecular and histological impacts of microgravity and spaceflight on ocular and retinal biology.",
    organism: "Mus musculus",
    project_type: "Spaceflight Study (STS-135)",
    material_type: "Ocular / Retinal Tissue",
    assay_type: "Histology, Gene Expression & Epigenetic Profiling",
    factors: ["Spaceflight (STS-135)", "Microgravity"],
    space_program: "NASA Space Shuttle Program",
    publication_title: "Spaceflight effects on the mouse retina: Histological, gene expression and epigenetic changes after flight on STS-135",
    source_portal: "NASA Open Science Data Repository (OSDR)",
    source_url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-87",
    api_metadata_url: "https://osdr.nasa.gov/osdr/data/osd/meta/87",
    study_context: "Spaceflight-Associated Neuro-ocular Syndrome (SANS) and sensory health research.",
    relevance_to_astrohealth:
      "Highlights why astronauts require structured neurological, visual, and wellbeing symptom logging during orbital missions.",
    data_type: "NASA_RESEARCH",
  },
];

export const FALLBACK_NASA_PORTALS: NasaPortal[] = [
  {
    id: "PORTAL-OSDR",
    name: "NASA Open Science Data Repository (OSDR)",
    category: "Primary Biological & Spaceflight Data Repository",
    description:
      "Provides open access to spaceflight biological, omics, physiological, and radiation datasets from NASA GeneLab and the Ames Life Sciences Data Archive (ALSDA).",
    url: "https://osdr.nasa.gov/",
    api_docs_url: "https://www.nasa.gov/osdr-api/",
    data_type: "NASA_RESEARCH",
  },
  {
    id: "PORTAL-HRP",
    name: "NASA Human Research Program (HRP)",
    category: "Spaceflight Human Health & Countermeasures",
    description:
      "Investigates the five main hazards of human spaceflight: space radiation, isolation and confinement, distance from Earth, gravity fields, and hostile/closed environments.",
    url: "https://www.nasa.gov/hrp/",
    api_docs_url: "https://humanresearchroadmap.nasa.gov/",
    data_type: "NASA_RESEARCH",
  },
  {
    id: "PORTAL-NLSP",
    name: "NASA Life Sciences Portal (NLSP)",
    category: "Life Sciences Archival Reference",
    description:
      "Curates life sciences experiment descriptions, hardware specifications, and archival findings across historical and modern spaceflight programs.",
    url: "https://nlsp.nasa.gov/",
    api_docs_url: "https://osdr.nasa.gov/",
    data_type: "NASA_RESEARCH",
  },
];
