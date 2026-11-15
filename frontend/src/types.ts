export type DataSourceType =
  | "NASA_RESEARCH"
  | "SIMULATED"
  | "MANUAL"
  | "SENSOR"
  | "AI_DERIVED";

export interface Mission {
  id: string;
  name: string;
  location: string;
  status: string;
  duration_days: number;
  target_days?: number;
  progress_percent: number;
  vehicle?: string;
  objective?: string;
  data_type: DataSourceType;
}

export interface VitalReading {
  id?: number;
  astronaut_id: number;
  astronaut_name?: string;
  mission_day?: number;
  time: string;
  timestamp?: string;
  heart_rate: number;
  spo2?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  respiration_rate?: number;
  skin_temp_c?: number;
  activity_context?: string;
  unit?: string;
  data_type: DataSourceType;
  note?: string;
}

export interface SleepRecord {
  id?: number;
  astronaut_id: number;
  astronaut_name?: string;
  mission_day?: number;
  date_label?: string;
  duration_hours: number;
  deep_sleep_hours?: number;
  rem_sleep_hours?: number;
  light_sleep_hours?: number;
  sleep_efficiency?: number;
  interruptions?: number;
  quality_label?: string;
  data_type: DataSourceType;
  note?: string;
}

export interface WellbeingRecord {
  id?: number;
  astronaut_id: number;
  astronaut_name?: string;
  mission_day: number;
  timestamp: string;
  mood_label: string;
  mood_score: number;
  fatigue_level: "Low" | "Moderate" | "Elevated";
  fatigue_score: number;
  stress_level: "Low" | "Moderate" | "Elevated";
  workload_rating: "Light" | "Balanced" | "High";
  note: string;
  data_type: DataSourceType;
}

export interface RadiationRecord {
  id?: number;
  mission_id: string;
  mission_day?: number;
  timestamp?: string;
  value: number;
  cumulative_msv?: number;
  unit: string;
  dosimeter_location?: string;
  solar_activity?: string;
  data_type: DataSourceType;
  note: string;
}

export interface AlertItem {
  id: number;
  astronaut_id?: number | null;
  astronaut_name?: string | null;
  mission_id?: string;
  title: string;
  description: string;
  explanation?: string;
  category?: string;
  priority: "Review" | "Warning" | "Information";
  timestamp?: string;
  is_read?: boolean;
  data_type: DataSourceType;
}

export interface AstronautProfile {
  id: number;
  code?: string;
  name: string;
  role: string;
  specialty?: string;
  status: string;
  mission_id?: string;
  assigned_day?: number;
  eva_hours?: number;
  summary_note?: string;
  data_type: DataSourceType;
  latest_vital?: VitalReading | null;
  avg_heart_rate?: number | null;
  latest_sleep?: SleepRecord | null;
  avg_sleep_hours?: number | null;
  latest_wellbeing?: WellbeingRecord | null;
  vitals_count?: number;
  sleep_count?: number;
  wellbeing_count?: number;
  alerts_count?: number;
  vitals?: VitalReading[];
  sleep_records?: SleepRecord[];
  wellbeing_records?: WellbeingRecord[];
  alerts?: AlertItem[];
}

export interface AIObservation {
  id: string;
  category: string;
  title: string;
  detail: string;
  level: "review" | "info";
  data_type: DataSourceType;
  based_on: string;
}

export interface AISummary {
  scope_title: string;
  astronaut_id?: number | null;
  engine_mode: string;
  engine_description: string;
  data_type: DataSourceType;
  generated_at: string;
  medical_disclaimer: string;
  metrics_snapshot: {
    vital_readings_analyzed: number;
    avg_heart_rate_bpm: number;
    avg_spo2_percent: number;
    sleep_records_analyzed: number;
    avg_sleep_hours: number;
    avg_sleep_efficiency: number;
    wellbeing_entries_analyzed: number;
    pending_review_count: number;
    unread_alert_count: number;
  };
  observations: AIObservation[];
  suggested_questions: string[];
}

export interface AIAnswer {
  question: string;
  headline: string;
  bullet_points: string[];
  engine_mode: string;
  data_type: DataSourceType;
  source_classifications_referenced: string[];
  answered_at: string;
  medical_disclaimer: string;
}

export interface NasaDataset {
  id: string;
  accession: string;
  legacy_id: string;
  title: string;
  description: string;
  organism: string;
  project_type: string;
  material_type: string;
  assay_type: string;
  factors: string[];
  space_program: string;
  publication_title: string;
  source_portal: string;
  source_url: string;
  api_metadata_url: string;
  study_context: string;
  relevance_to_astrohealth: string;
  data_type: DataSourceType;
}

export interface NasaPortal {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  api_docs_url: string;
  data_type: DataSourceType;
}

export interface OfflineQueueItem {
  id: string;
  endpoint: "/api/vitals" | "/api/sleep" | "/api/wellbeing" | "/api/radiation";
  label: string;
  payload: Record<string, unknown>;
  created_at: string;
}
