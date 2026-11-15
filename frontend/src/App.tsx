import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock,
  Database,
  ExternalLink,
  HeartPulse,
  Home,
  Menu,
  Moon,
  Orbit,
  PlusCircle,
  Radiation,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

import type {
  AIAnswer,
  AISummary,
  AlertItem,
  AstronautProfile,
  DataSourceType,
  Mission,
  NasaDataset,
  NasaPortal,
  OfflineQueueItem,
  RadiationRecord,
  SleepRecord,
  VitalReading,
  WellbeingRecord,
} from "./types";

import {
  clearAllAstroHealthCache,
  clearOfflineQueue,
  enqueueOfflineItem,
  FALLBACK_ALERTS,
  FALLBACK_ASTRONAUTS,
  FALLBACK_MISSION,
  FALLBACK_NASA_DATASETS,
  FALLBACK_NASA_PORTALS,
  FALLBACK_RADIATION,
  FALLBACK_SLEEP,
  FALLBACK_VITALS,
  FALLBACK_WELLBEING,
  getOfflineQueue,
  loadCache,
  saveCache,
} from "./fallbackData";

const DEFAULT_API_BASE = "http://127.0.0.1:8000";

const navigation = [
  { name: "Overview", icon: Home },
  { name: "Astronauts", icon: Users },
  { name: "Vital Signs", icon: HeartPulse },
  { name: "Sleep Monitor", icon: Moon },
  { name: "Wellbeing", icon: Brain },
  { name: "Radiation", icon: Radiation },
  { name: "AI Health Assistant", icon: Sparkles },
  { name: "NASA Research", icon: Database },
  { name: "Notifications", icon: Bell },
];

function DataBadge({ type }: { type?: DataSourceType | string }) {
  const normalized = (type || "SIMULATED").toUpperCase();
  const cls = `badge-${normalized.toLowerCase()}`;
  return <span className={`data-badge ${cls}`}>{normalized}</span>;
}

function App() {
  const [activePage, setActivePage] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(() =>
    loadCache("api_base_url", DEFAULT_API_BASE)
  );

  // Core data states (initialized from local cache or fallback so UI is never blank)
  const [mission, setMission] = useState<Mission | null>(() =>
    loadCache("mission", FALLBACK_MISSION)
  );
  const [astronauts, setAstronauts] = useState<AstronautProfile[]>(() =>
    loadCache("astronauts", FALLBACK_ASTRONAUTS)
  );
  const [heartData, setHeartData] = useState<VitalReading[]>(() =>
    loadCache("vitals_primary", FALLBACK_VITALS.filter((v) => v.astronaut_id === 1))
  );
  const [allVitals, setAllVitals] = useState<VitalReading[]>(() =>
    loadCache("vitals_all", FALLBACK_VITALS)
  );
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(() =>
    loadCache("sleep", FALLBACK_SLEEP)
  );
  const [wellbeingRecords, setWellbeingRecords] = useState<WellbeingRecord[]>(
    () => loadCache("wellbeing", FALLBACK_WELLBEING)
  );
  const [radiationRecords, setRadiationRecords] = useState<RadiationRecord[]>(
    () => loadCache("radiation", FALLBACK_RADIATION)
  );
  const [alerts, setAlerts] = useState<AlertItem[]>(() =>
    loadCache("alerts", FALLBACK_ALERTS)
  );
  const [nasaDatasets, setNasaDatasets] = useState<NasaDataset[]>(() =>
    loadCache("nasa_datasets", FALLBACK_NASA_DATASETS)
  );
  const [nasaPortals, setNasaPortals] = useState<NasaPortal[]>(() =>
    loadCache("nasa_portals", FALLBACK_NASA_PORTALS)
  );
  const [nasaIntegrationStatus, setNasaIntegrationStatus] = useState<string>(
    "VERIFIED_CATALOGUE"
  );
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [dbStatus, setDbStatus] = useState<{
    mode?: string;
    description?: string;
    orm?: string;
  }>({
    mode: "sqlite_local",
    description: "Local SQLite persistence (MySQL-compatible SQLAlchemy schema)",
  });

  // Connection, loading & offline queue states
  const [apiStatus, setApiStatus] = useState<
    "Connecting..." | "Connected" | "Offline"
  >("Connecting...");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusBannerMsg, setStatusBannerMsg] = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() =>
    getOfflineQueue()
  );

  // Interactive selection & filter states
  const [selectedAstronautId, setSelectedAstronautId] = useState<number | null>(
    null
  );
  const [selectedAstronautDetail, setSelectedAstronautDetail] =
    useState<AstronautProfile | null>(null);

  const [overviewAstronautFilter, setOverviewAstronautFilter] = useState<
    number | "all"
  >("all");
  const [overviewDayFilter, setOverviewDayFilter] = useState<number | "all">(
    142
  );

  const [vitalsAstronautFilter, setVitalsAstronautFilter] = useState<
    number | "all"
  >("all");
  const [vitalsMetric, setVitalsMetric] = useState<
    "heart_rate" | "spo2" | "systolic_bp" | "respiration_rate" | "skin_temp_c"
  >("heart_rate");

  const [sleepAstronautFilter, setSleepAstronautFilter] = useState<
    number | "all"
  >("all");
  const [wellbeingAstronautFilter, setWellbeingAstronautFilter] = useState<
    number | "all"
  >("all");
  const [alertPriorityFilter, setAlertPriorityFilter] = useState<
    "All" | "Review" | "Information"
  >("All");

  // AI Health Assistant states
  const [aiScopeAstronautId, setAiScopeAstronautId] = useState<number | "all">(
    "all"
  );
  const [aiQuestionInput, setAiQuestionInput] = useState("");
  const [aiAnswer, setAiAnswer] = useState<AIAnswer | null>(null);
  const [aiAsking, setAiAsking] = useState(false);

  // NASA Research search state
  const [nasaQueryInput, setNasaQueryInput] = useState("");
  const [nasaSearching, setNasaSearching] = useState(false);

  // Global Search & Notification Modals
  const [searchOpen, setSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);

  // Manual Entry Form states
  const [newVital, setNewVital] = useState({
    astronaut_id: 1,
    heart_rate: 72,
    spo2: 98.5,
    systolic_bp: 118,
    diastolic_bp: 76,
    respiration_rate: 14.5,
    skin_temp_c: 36.6,
    activity_context: "Manual Crew Check",
    note: "",
  });

  const [newSleep, setNewSleep] = useState({
    astronaut_id: 1,
    mission_day: 142,
    duration_hours: 7.5,
    deep_sleep_hours: 1.7,
    rem_sleep_hours: 1.9,
    sleep_efficiency: 90,
    interruptions: 1,
    quality_label: "Optimal",
    note: "",
  });

  const [newWellbeing, setNewWellbeing] = useState<{
    astronaut_id: number;
    mood_label: string;
    mood_score: number;
    fatigue_level: "Low" | "Moderate" | "Elevated";
    stress_level: "Low" | "Moderate" | "Elevated";
    workload_rating: "Light" | "Balanced" | "High";
    note: string;
  }>({
    astronaut_id: 1,
    mood_label: "Focused & Calm",
    mood_score: 4,
    fatigue_level: "Low",
    stress_level: "Low",
    workload_rating: "Balanced",
    note: "",
  });

  const [newRadiation, setNewRadiation] = useState({
    mission_day: 142,
    value: 0.41,
    dosimeter_location: "Habitat Crew Quarters",
    solar_activity: "Quiet",
    note: "Manual crew dosimeter check.",
  });

  // Load all data from backend
  const loadDashboard = useCallback(
    async (customBase?: string) => {
      const targetBase = customBase || apiBaseUrl;
      setIsLoading(true);
      try {
        const [
          vitalsResponse,
          astronautsResponse,
          missionResponse,
          sleepResponse,
          wellbeingResponse,
          radiationResponse,
          alertsResponse,
          aiResponse,
          nasaResponse,
          healthResponse,
        ] = await Promise.all([
          axios.get(`${targetBase}/api/vitals`),
          axios.get(`${targetBase}/api/astronauts`),
          axios.get(`${targetBase}/api/mission`),
          axios.get(`${targetBase}/api/sleep`),
          axios.get(`${targetBase}/api/wellbeing`),
          axios.get(`${targetBase}/api/radiation`),
          axios.get(`${targetBase}/api/alerts`),
          axios.get(`${targetBase}/api/ai/summary`),
          axios.get(`${targetBase}/api/nasa/research`),
          axios.get(`${targetBase}/api/health`),
        ]);

        const primaryReadings: VitalReading[] =
          vitalsResponse.data.readings || [];
        const fullReadings: VitalReading[] =
          vitalsResponse.data.all_readings || primaryReadings;
        const crewList: AstronautProfile[] =
          astronautsResponse.data.astronauts || [];
        const missionObj: Mission = missionResponse.data;
        const sleepList: SleepRecord[] = sleepResponse.data.records || [];
        const wellbeingList: WellbeingRecord[] =
          wellbeingResponse.data.records || [];
        const radList: RadiationRecord[] = radiationResponse.data.records || [];
        const alertList: AlertItem[] = alertsResponse.data.alerts || [];
        const summaryObj: AISummary = aiResponse.data;
        const datasetsList: NasaDataset[] = nasaResponse.data.datasets || [];
        const portalsList: NasaPortal[] = nasaResponse.data.portals || [];

        setHeartData(primaryReadings);
        setAllVitals(fullReadings);
        setAstronauts(crewList);
        setMission(missionObj);
        setSleepRecords(sleepList);
        setWellbeingRecords(wellbeingList);
        setRadiationRecords(radList);
        setAlerts(alertList);
        setAiSummary(summaryObj);
        setNasaDatasets(datasetsList);
        setNasaPortals(portalsList);
        setNasaIntegrationStatus(
          nasaResponse.data.integration_status || "LIVE_NASA_OSDR_API"
        );
        if (healthResponse.data?.database) {
          setDbStatus(healthResponse.data.database);
        }

        // Persist in localStorage for offline support
        saveCache("vitals_primary", primaryReadings);
        saveCache("vitals_all", fullReadings);
        saveCache("astronauts", crewList);
        saveCache("mission", missionObj);
        saveCache("sleep", sleepList);
        saveCache("wellbeing", wellbeingList);
        saveCache("radiation", radList);
        saveCache("alerts", alertList);
        saveCache("nasa_datasets", datasetsList);
        saveCache("nasa_portals", portalsList);

        setApiStatus("Connected");
      } catch (error) {
        console.error("AstroHealth API connection failed (using cached data):", error);
        setApiStatus("Offline");
      } finally {
        setIsLoading(false);
      }
    },
    [apiBaseUrl]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Load individual astronaut details when selected
  const openAstronautProfile = useCallback(
    async (astronautId: number) => {
      setSelectedAstronautId(astronautId);
      setActivePage("Astronauts");
      try {
        const resp = await axios.get(
          `${apiBaseUrl}/api/astronauts/${astronautId}`
        );
        setSelectedAstronautDetail(resp.data);
      } catch {
        // Offline fallback assembly
        const base =
          astronauts.find((a) => a.id === astronautId) ||
          FALLBACK_ASTRONAUTS[0];
        setSelectedAstronautDetail({
          ...base,
          vitals: allVitals.filter((v) => v.astronaut_id === astronautId),
          sleep_records: sleepRecords.filter(
            (s) => s.astronaut_id === astronautId
          ),
          wellbeing_records: wellbeingRecords.filter(
            (w) => w.astronaut_id === astronautId
          ),
          alerts: alerts.filter((al) => al.astronaut_id === astronautId),
        });
      }
    },
    [apiBaseUrl, astronauts, allVitals, sleepRecords, wellbeingRecords, alerts]
  );

  // Sync offline queue to backend when connected
  const syncOfflineQueue = async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    try {
      for (const item of queue) {
        await axios.post(`${apiBaseUrl}${item.endpoint}`, item.payload);
      }
      clearOfflineQueue();
      setOfflineQueue([]);
      setStatusBannerMsg(
        `Synchronized ${queue.length} queued manual record(s) with the backend.`
      );
      await loadDashboard();
    } catch {
      setStatusBannerMsg(
        "Backend still unreachable. Queued records remain safely stored in local cache."
      );
    }
  };

  // Fetch AI summary when scope changes
  const handleAiScopeChange = async (scope: number | "all") => {
    setAiScopeAstronautId(scope);
    try {
      const params = scope === "all" ? {} : { astronaut_id: scope };
      const resp = await axios.get(`${apiBaseUrl}/api/ai/summary`, { params });
      setAiSummary(resp.data);
    } catch {
      // Keep local summary when offline
    }
  };

  // Ask AI assistant a question
  const handleAskQuestion = async (qText?: string) => {
    const query = (qText ?? aiQuestionInput).trim();
    if (!query) return;
    setAiQuestionInput(query);
    setAiAsking(true);
    try {
      const resp = await axios.post(`${apiBaseUrl}/api/ai/ask`, {
        question: query,
        astronaut_id:
          aiScopeAstronautId === "all" ? null : aiScopeAstronautId,
      });
      setAiAnswer(resp.data);
    } catch {
      // Local fallback rule-based answer when offline
      setAiAnswer({
        question: query,
        headline: "Local Offline Rule-Based Observation Summary",
        bullet_points: [
          `Analyzed ${allVitals.length} cached vital readings and ${sleepRecords.length} sleep logs.`,
          `Crew status: ${astronauts.filter((a) => a.status === "Stable").length} Stable, ${astronauts.filter((a) => a.status !== "Stable").length} flagged for Review.`,
          "All records are simulated or manually entered demonstration entries.",
        ],
        engine_mode: "RULE_BASED_LOCAL (OFFLINE_CACHE)",
        data_type: "AI_DERIVED",
        source_classifications_referenced: ["SIMULATED", "MANUAL", "AI_DERIVED"],
        answered_at: new Date().toISOString(),
        medical_disclaimer:
          "Observation for human review only. Not medical advice or diagnosis.",
      });
    } finally {
      setAiAsking(false);
    }
  };

  // Query NASA OSDR research
  const handleNasaSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setNasaSearching(true);
    try {
      const resp = await axios.get(`${apiBaseUrl}/api/nasa/research`, {
        params: { q: nasaQueryInput.trim() || undefined, limit: 10 },
      });
      setNasaDatasets(resp.data.datasets || []);
      setNasaIntegrationStatus(
        resp.data.integration_status || "LIVE_NASA_OSDR_API"
      );
    } catch {
      const q = nasaQueryInput.trim().toLowerCase();
      setNasaDatasets(
        FALLBACK_NASA_DATASETS.filter(
          (d) =>
            !q ||
            d.title.toLowerCase().includes(q) ||
            d.description.toLowerCase().includes(q) ||
            d.accession.toLowerCase().includes(q)
        )
      );
      setNasaIntegrationStatus("VERIFIED_OFFLINE_CATALOGUE");
    } finally {
      setNasaSearching(false);
    }
  };

  // Toggle alert read state
  const handleToggleAlertRead = async (alertId: number) => {
    try {
      const resp = await axios.patch(
        `${apiBaseUrl}/api/alerts/${alertId}/read`
      );
      const updated = resp.data.alert;
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? updated : a))
      );
    } catch {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, is_read: !a.is_read } : a
        )
      );
    }
  };

  const handleMarkAllAlertsRead = async () => {
    try {
      await axios.post(`${apiBaseUrl}/api/alerts/mark-all-read`);
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    } catch {
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    }
  };

  // Submit manual Vital Reading
  const handleCreateVital = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newVital,
      mission_day: mission?.duration_days || 142,
      data_type: "MANUAL" as const,
    };
    try {
      await axios.post(`${apiBaseUrl}/api/vitals`, payload);
      setStatusBannerMsg("Manual vital reading saved to backend (MANUAL).");
      setNewVital((prev) => ({ ...prev, note: "" }));
      await loadDashboard();
    } catch {
      const person = astronauts.find((a) => a.id === newVital.astronaut_id);
      const fallbackItem: VitalReading = {
        id: Date.now(),
        ...payload,
        astronaut_name: person?.name || `Astronaut ${newVital.astronaut_id}`,
        time: new Date().toTimeString().slice(0, 5),
        timestamp: new Date().toISOString(),
        unit: "BPM",
      };
      setAllVitals((prev) => [...prev, fallbackItem]);
      setHeartData((prev) => [...prev, fallbackItem]);
      const q = enqueueOfflineItem({
        endpoint: "/api/vitals",
        label: `Vital reading (${newVital.heart_rate} BPM) for ${person?.name || "Astronaut"}`,
        payload,
      });
      setOfflineQueue(q);
      setStatusBannerMsg(
        "Offline mode: Manual vital reading saved locally and queued for sync (MANUAL)."
      );
    }
  };

  // Submit manual Sleep Record
  const handleCreateSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newSleep,
      data_type: "MANUAL" as const,
    };
    try {
      await axios.post(`${apiBaseUrl}/api/sleep`, payload);
      setStatusBannerMsg("Manual sleep record saved to backend (MANUAL).");
      setNewSleep((prev) => ({ ...prev, note: "" }));
      await loadDashboard();
    } catch {
      const person = astronauts.find((a) => a.id === newSleep.astronaut_id);
      const fallbackRecord: SleepRecord = {
        id: Date.now(),
        ...payload,
        astronaut_name: person?.name || `Astronaut ${newSleep.astronaut_id}`,
        date_label: `Mission Day ${newSleep.mission_day}`,
        light_sleep_hours: Math.max(
          0.5,
          Number(
            (
              newSleep.duration_hours -
              newSleep.deep_sleep_hours -
              newSleep.rem_sleep_hours
            ).toFixed(1)
          )
        ),
      };
      setSleepRecords((prev) => [fallbackRecord, ...prev]);
      const q = enqueueOfflineItem({
        endpoint: "/api/sleep",
        label: `Sleep log (${newSleep.duration_hours} hrs) for ${person?.name || "Astronaut"}`,
        payload,
      });
      setOfflineQueue(q);
      setStatusBannerMsg(
        "Offline mode: Manual sleep log saved locally and queued for sync (MANUAL)."
      );
    }
  };

  // Submit manual Wellbeing Check-in
  const handleCreateWellbeing = async (e: React.FormEvent) => {
    e.preventDefault();
    const fatigueScoreMap = { Low: 1, Moderate: 3, Elevated: 4 };
    const payload = {
      ...newWellbeing,
      mission_day: mission?.duration_days || 142,
      fatigue_score: fatigueScoreMap[newWellbeing.fatigue_level],
      note:
        newWellbeing.note.trim() ||
        "Manual crew wellbeing self-report logged during mission shift.",
      data_type: "MANUAL" as const,
    };
    try {
      await axios.post(`${apiBaseUrl}/api/wellbeing`, payload);
      setStatusBannerMsg("Manual wellbeing check-in saved (MANUAL).");
      setNewWellbeing((prev) => ({ ...prev, note: "" }));
      await loadDashboard();
    } catch {
      const person = astronauts.find((a) => a.id === newWellbeing.astronaut_id);
      const fallbackEntry: WellbeingRecord = {
        id: Date.now(),
        ...payload,
        astronaut_name:
          person?.name || `Astronaut ${newWellbeing.astronaut_id}`,
        timestamp: new Date().toISOString(),
      };
      setWellbeingRecords((prev) => [fallbackEntry, ...prev]);
      const q = enqueueOfflineItem({
        endpoint: "/api/wellbeing",
        label: `Wellbeing check-in (${newWellbeing.mood_label}) for ${person?.name || "Astronaut"}`,
        payload,
      });
      setOfflineQueue(q);
      setStatusBannerMsg(
        "Offline mode: Manual wellbeing check-in saved locally and queued for sync (MANUAL)."
      );
    }
  };

  // Submit manual Radiation Log
  const handleCreateRadiation = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      mission_id: mission?.id || "ORBITAL-01",
      ...newRadiation,
      unit: "mSv",
      data_type: "MANUAL" as const,
    };
    try {
      await axios.post(`${apiBaseUrl}/api/radiation`, payload);
      setStatusBannerMsg("Manual radiation dosimetry entry saved (MANUAL).");
      await loadDashboard();
    } catch {
      const prevCum = radiationRecords[0]?.cumulative_msv || 58.4;
      const fallbackRad: RadiationRecord = {
        id: Date.now(),
        ...payload,
        cumulative_msv: Number((prevCum + newRadiation.value).toFixed(2)),
        timestamp: new Date().toISOString(),
      };
      setRadiationRecords((prev) => [fallbackRad, ...prev]);
      const q = enqueueOfflineItem({
        endpoint: "/api/radiation",
        label: `Radiation log (${newRadiation.value} mSv) on Day ${newRadiation.mission_day}`,
        payload,
      });
      setOfflineQueue(q);
      setStatusBannerMsg(
        "Offline mode: Manual radiation entry saved locally and queued for sync (MANUAL)."
      );
    }
  };

  // Derived data for Overview & pages
  const overviewChartReadings = useMemo(() => {
    if (overviewAstronautFilter === "all") {
      return heartData;
    }
    return allVitals.filter(
      (v) => v.astronaut_id === overviewAstronautFilter
    );
  }, [overviewAstronautFilter, heartData, allVitals]);

  const overviewAvgHeartRate = useMemo(() => {
    if (overviewChartReadings.length === 0) return 0;
    const sum = overviewChartReadings.reduce((acc, r) => acc + r.heart_rate, 0);
    return Math.round(sum / overviewChartReadings.length);
  }, [overviewChartReadings]);

  const avgSleepHours = useMemo(() => {
    if (sleepRecords.length === 0) return 0;
    return (
      sleepRecords.reduce((acc, r) => acc + r.duration_hours, 0) /
      sleepRecords.length
    );
  }, [sleepRecords]);

  const sleepBarPercent = useMemo(() => {
    return Math.min(100, Math.max(8, Math.round((avgSleepHours / 12) * 100)));
  }, [avgSleepHours]);

  const filteredVitals = useMemo(() => {
    if (vitalsAstronautFilter === "all") return allVitals;
    return allVitals.filter((v) => v.astronaut_id === vitalsAstronautFilter);
  }, [allVitals, vitalsAstronautFilter]);

  const filteredSleep = useMemo(() => {
    if (sleepAstronautFilter === "all") return sleepRecords;
    return sleepRecords.filter((s) => s.astronaut_id === sleepAstronautFilter);
  }, [sleepRecords, sleepAstronautFilter]);

  const filteredWellbeing = useMemo(() => {
    if (wellbeingAstronautFilter === "all") return wellbeingRecords;
    return wellbeingRecords.filter(
      (w) => w.astronaut_id === wellbeingAstronautFilter
    );
  }, [wellbeingRecords, wellbeingAstronautFilter]);

  const filteredAlerts = useMemo(() => {
    if (alertPriorityFilter === "All") return alerts;
    return alerts.filter((a) => a.priority === alertPriorityFilter);
  }, [alerts, alertPriorityFilter]);

  const unreadAlertsCount = useMemo(
    () => alerts.filter((a) => !a.is_read).length,
    [alerts]
  );

  const pendingReviewsCount = useMemo(
    () => alerts.filter((a) => a.priority === "Review").length,
    [alerts]
  );

  // Client-side instant global search across all loaded domains
  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    if (!q) return null;
    return {
      astronauts: astronauts.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          (a.specialty || "").toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q)
      ),
      vitals: allVitals
        .filter(
          (v) =>
            (v.astronaut_name || "").toLowerCase().includes(q) ||
            (v.activity_context || "").toLowerCase().includes(q) ||
            String(v.heart_rate).includes(q)
        )
        .slice(0, 5),
      alerts: alerts.filter(
        (al) =>
          al.title.toLowerCase().includes(q) ||
          al.description.toLowerCase().includes(q) ||
          (al.explanation || "").toLowerCase().includes(q)
      ),
      datasets: nasaDatasets.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.accession.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.organism.toLowerCase().includes(q)
      ),
    };
  }, [globalSearchQuery, astronauts, allVitals, alerts, nasaDatasets]);

  const metricMeta = {
    heart_rate: { label: "Heart Rate", unit: "BPM", color: "#39C5E8" },
    spo2: { label: "Blood Oxygen (SpO2)", unit: "%", color: "#35C98A" },
    systolic_bp: { label: "Systolic BP", unit: "mmHg", color: "#F2B84B" },
    respiration_rate: {
      label: "Respiration Rate",
      unit: "br/min",
      color: "#8BE5F5",
    },
    skin_temp_c: { label: "Skin Temperature", unit: "°C", color: "#AD9AFF" },
  }[vitalsMetric];

  const renderOtherPage = () => {
    switch (activePage) {
      case "Astronauts":
        if (selectedAstronautId && selectedAstronautDetail) {
          const person = selectedAstronautDetail;
          const pVitals =
            person.vitals ||
            allVitals.filter((v) => v.astronaut_id === person.id);
          const pSleep =
            person.sleep_records ||
            sleepRecords.filter((s) => s.astronaut_id === person.id);
          const pWellbeing =
            person.wellbeing_records ||
            wellbeingRecords.filter((w) => w.astronaut_id === person.id);
          const pAlerts =
            person.alerts ||
            alerts.filter((al) => al.astronaut_id === person.id);

          return (
            <>
              <section className="welcome-section">
                <div>
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setSelectedAstronautId(null);
                      setSelectedAstronautDetail(null);
                    }}
                  >
                    <ArrowLeft size={15} /> Back to Crew Roster
                  </button>
                  <div className="eyebrow" style={{ marginTop: "14px" }}>
                    INDIVIDUAL ASTRONAUT PROFILE · {person.code || `AST-0${person.id}`}
                  </div>
                  <h2>{person.name}</h2>
                  <p>
                    {person.role} · {person.specialty || "Spaceflight Operations"} ·{" "}
                    Mission {person.mission_id || "ORBITAL-01"} (Day{" "}
                    {person.assigned_day || 142})
                  </p>
                </div>

                <div className="welcome-actions">
                  <DataBadge type={person.data_type} />
                  <span
                    className={`crew-status ${
                      person.status === "Stable" ? "healthy" : "review"
                    }`}
                  >
                    Status: {person.status}
                  </span>
                  <button
                    className="primary-button"
                    onClick={() => {
                      handleAiScopeChange(person.id);
                      setActivePage("AI Health Assistant");
                    }}
                  >
                    <Sparkles size={14} /> AI Summary for {person.name.split(" ")[0]}
                  </button>
                </div>
              </section>

              <div className="notice-box">
                <strong>Profile Context ({person.data_type}):</strong>{" "}
                {person.summary_note ||
                  "Fictional demonstration profile created for NASA Space Apps Challenge 2026."}
              </div>

              <section className="stats-grid" style={{ marginTop: "16px" }}>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Mean Heart Rate</span>
                    <div className="stat-icon cyan">
                      <HeartPulse size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {pVitals.length > 0
                      ? (
                          pVitals.reduce((s, r) => s + r.heart_rate, 0) /
                          pVitals.length
                        ).toFixed(0)
                      : "—"}{" "}
                    <small>BPM</small>
                  </div>
                  <div className="stat-bottom">
                    <span>{pVitals.length} logged readings</span>
                    <DataBadge type="SIMULATED" />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Latest SpO2 &amp; BP</span>
                    <div className="stat-icon green">
                      <Activity size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {pVitals.length > 0
                      ? `${pVitals[pVitals.length - 1].spo2 ?? 98}%`
                      : "—"}{" "}
                    <small>
                      {pVitals.length > 0
                        ? `${pVitals[pVitals.length - 1].systolic_bp ?? 118}/${
                            pVitals[pVitals.length - 1].diastolic_bp ?? 76
                          } mmHg`
                        : ""}
                    </small>
                  </div>
                  <div className="stat-bottom">
                    <span>Latest recorded point</span>
                    <DataBadge type="SIMULATED" />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Sleep Duration Avg</span>
                    <div className="stat-icon purple">
                      <Moon size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {pSleep.length > 0
                      ? (
                          pSleep.reduce((s, r) => s + r.duration_hours, 0) /
                          pSleep.length
                        ).toFixed(1)
                      : "—"}{" "}
                    <small>hrs</small>
                  </div>
                  <div className="stat-bottom">
                    <span>
                      Efficiency:{" "}
                      {pSleep[0]?.sleep_efficiency
                        ? `${pSleep[0].sleep_efficiency}%`
                        : "—"}
                    </span>
                    <DataBadge type={pSleep[0]?.data_type || "SIMULATED"} />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Wellbeing &amp; EVA</span>
                    <div className="stat-icon amber">
                      <Brain size={18} />
                    </div>
                  </div>
                  <div className="stat-value">
                    {pWellbeing[0]?.mood_score ?? "—"}
                    <small>/5 mood</small>
                  </div>
                  <div className="stat-bottom">
                    <span>Fatigue: {pWellbeing[0]?.fatigue_level || "Low"}</span>
                    <span>EVA: {person.eva_hours ?? 12}h</span>
                  </div>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">
                        INDIVIDUAL PHYSIOLOGICAL TREND
                      </div>
                      <h3>{person.name} — Heart rate &amp; SpO2 history</h3>
                    </div>
                    <DataBadge type="SIMULATED" />
                  </div>

                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pVitals}>
                        <defs>
                          <linearGradient
                            id="profileHrGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#39C5E8"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="95%"
                              stopColor="#39C5E8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="#23374B"
                          strokeDasharray="3 5"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="time"
                          stroke="#8194AA"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#8194AA"
                          tickLine={false}
                          axisLine={false}
                          domain={[50, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#122238",
                            border: "1px solid #29425C",
                            borderRadius: "10px",
                            color: "#F3F7FC",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="heart_rate"
                          name="Heart Rate (BPM)"
                          stroke="#39C5E8"
                          strokeWidth={2.5}
                          fill="url(#profileHrGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-footer">
                    <span>
                      <i className="legend-dot cyan-dot" /> Illustrative readings for{" "}
                      {person.name}
                    </span>
                    <span>Not real astronaut medical telemetry</span>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">CREW OBSERVATIONS &amp; LOGS</div>
                      <h3>Sleep, wellbeing &amp; alert records</h3>
                    </div>
                  </div>

                  {pSleep.map((s, idx) => (
                    <div className="alert-item" key={`sl-${idx}`}>
                      <div className="alert-icon info-alert">
                        <Moon size={16} />
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <strong>
                            Sleep: {s.duration_hours} hrs ({s.quality_label || "Logged"})
                          </strong>
                          <DataBadge type={s.data_type} />
                        </div>
                        <p>
                          {s.date_label || `Mission Day ${s.mission_day || 142}`} · Deep:{" "}
                          {s.deep_sleep_hours ?? 1.6}h · REM: {s.rem_sleep_hours ?? 1.8}h ·
                          Efficiency: {s.sleep_efficiency ?? 88}%
                        </p>
                      </div>
                    </div>
                  ))}

                  {pWellbeing.map((w, idx) => (
                    <div className="alert-item" key={`wb-${idx}`}>
                      <div className="alert-icon success-alert">
                        <Brain size={16} />
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <strong>
                            Wellbeing: {w.mood_label} (Fatigue: {w.fatigue_level})
                          </strong>
                          <DataBadge type={w.data_type} />
                        </div>
                        <p>{w.note}</p>
                      </div>
                    </div>
                  ))}

                  {pAlerts.map((al) => (
                    <div className="alert-item unread" key={`al-${al.id}`}>
                      <div className="alert-icon warning-alert">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <strong>
                            {al.title} ({al.priority})
                          </strong>
                          <DataBadge type={al.data_type} />
                        </div>
                        <p>{al.explanation || al.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          );
        }

        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">CREW MANAGEMENT</div>
                <h2>Astronaut records &amp; profiles</h2>
                <p>
                  Select any astronaut below to inspect their full demonstration
                  health profile, vital trends, sleep logs, wellbeing check-ins,
                  and observations.
                </p>
              </div>
              <DataBadge type="SIMULATED" />
            </section>

            <div className="crew-cards-grid">
              {astronauts.map((astronaut, index) => {
                const aVitals = allVitals.filter(
                  (v) => v.astronaut_id === astronaut.id
                );
                const latestHr =
                  astronaut.latest_vital?.heart_rate ??
                  (aVitals.length > 0
                    ? aVitals[aVitals.length - 1].heart_rate
                    : 72);
                const aSleep = sleepRecords.filter(
                  (s) => s.astronaut_id === astronaut.id
                );
                const latestSleepHrs =
                  astronaut.latest_sleep?.duration_hours ??
                  (aSleep.length > 0 ? aSleep[0].duration_hours : 7.2);
                const aWell = wellbeingRecords.filter(
                  (w) => w.astronaut_id === astronaut.id
                );
                const latestMood =
                  astronaut.latest_wellbeing?.mood_label ??
                  (aWell.length > 0 ? aWell[0].mood_label : "Steady");

                return (
                  <div
                    className="crew-card"
                    key={astronaut.id}
                    onClick={() => openAstronautProfile(astronaut.id)}
                  >
                    <div className="crew-card-header">
                      <div
                        className={`astronaut-avatar avatar-${
                          ["one", "two", "three", "four"][index % 4]
                        }`}
                      >
                        {astronaut.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </div>

                      <div className="crew-card-title">
                        <h3>{astronaut.name}</h3>
                        <p>
                          {astronaut.code || `AST-0${astronaut.id}`} ·{" "}
                          {astronaut.role} ·{" "}
                          {astronaut.specialty || "Orbital Operations"}
                        </p>
                      </div>

                      <span
                        className={`crew-status ${
                          astronaut.status === "Stable" ? "healthy" : "review"
                        }`}
                      >
                        {astronaut.status}
                      </span>
                    </div>

                    <div className="crew-metrics-row">
                      <div className="crew-metric-item">
                        <span>Latest Heart Rate</span>
                        <strong>{latestHr} BPM</strong>
                      </div>
                      <div className="crew-metric-item">
                        <span>Latest Sleep</span>
                        <strong>{latestSleepHrs} hrs</strong>
                      </div>
                      <div className="crew-metric-item">
                        <span>Wellbeing Check-in</span>
                        <strong>{latestMood}</strong>
                      </div>
                    </div>

                    <div className="crew-card-footer">
                      <DataBadge type={astronaut.data_type} />
                      <span className="text-link">
                        Open full astronaut profile <ArrowUpRight size={14} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        );

      case "Vital Signs":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">PHYSIOLOGICAL MONITORING</div>
                <h2>Vital signs &amp; multi-parameter telemetry</h2>
                <p>
                  Filter by astronaut or physiological metric, inspect reading
                  logs, or record a manual demonstration entry.
                </p>
              </div>

              <div className="welcome-actions">
                <select
                  className="select-input"
                  value={vitalsAstronautFilter}
                  onChange={(e) =>
                    setVitalsAstronautFilter(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">All Crew Members ({allVitals.length})</option>
                  {astronauts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.role})
                    </option>
                  ))}
                </select>

                <select
                  className="select-input"
                  value={vitalsMetric}
                  onChange={(e) =>
                    setVitalsMetric(
                      e.target.value as
                        | "heart_rate"
                        | "spo2"
                        | "systolic_bp"
                        | "respiration_rate"
                        | "skin_temp_c"
                    )
                  }
                >
                  <option value="heart_rate">Heart Rate (BPM)</option>
                  <option value="spo2">SpO2 (%)</option>
                  <option value="systolic_bp">Systolic Blood Pressure (mmHg)</option>
                  <option value="respiration_rate">Respiration Rate (br/min)</option>
                  <option value="skin_temp_c">Skin Temperature (°C)</option>
                </select>
              </div>
            </section>

            <section className="panel heart-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">
                    {metricMeta.label.toUpperCase()} TREND
                  </div>
                  <h3>
                    Recorded {metricMeta.label.toLowerCase()} ({metricMeta.unit})
                  </h3>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <DataBadge type="SIMULATED" />
                  <span className="alert-count">
                    {filteredVitals.length.toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredVitals}>
                    <defs>
                      <linearGradient
                        id="vitalsGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={metricMeta.color}
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="95%"
                          stopColor={metricMeta.color}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#23374B"
                      strokeDasharray="3 5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="time"
                      stroke="#8194AA"
                      tickLine={false}
                      axisLine={false}
                    />

                    <YAxis
                      stroke="#8194AA"
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "#122238",
                        border: "1px solid #29425C",
                        borderRadius: "10px",
                        color: "#F3F7FC",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey={vitalsMetric}
                      name={metricMeta.label}
                      unit={` ${metricMeta.unit}`}
                      stroke={metricMeta.color}
                      strokeWidth={2.5}
                      fill="url(#vitalsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="notice-box">
                <strong>Illustrative Reference Note:</strong> Any reference
                ranges discussed in this demonstration (e.g., 60–85 BPM resting
                heart rate, 96–100% SpO2) are strictly illustrative for software
                visualization and are NOT validated clinical spaceflight limits.
              </div>
            </section>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">MANUAL CREW LOGGING</div>
                    <h3>Log manual vital sign reading</h3>
                  </div>
                  <DataBadge type="MANUAL" />
                </div>

                <form onSubmit={handleCreateVital}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Astronaut</label>
                      <select
                        value={newVital.astronaut_id}
                        onChange={(e) =>
                          setNewVital({
                            ...newVital,
                            astronaut_id: Number(e.target.value),
                          })
                        }
                      >
                        {astronauts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Heart Rate (BPM)</label>
                      <input
                        type="number"
                        min={40}
                        max={200}
                        value={newVital.heart_rate}
                        onChange={(e) =>
                          setNewVital({
                            ...newVital,
                            heart_rate: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>SpO2 (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={80}
                        max={100}
                        value={newVital.spo2}
                        onChange={(e) =>
                          setNewVital({
                            ...newVital,
                            spo2: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Systolic / Diastolic BP (mmHg)</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          type="number"
                          style={{ width: "50%" }}
                          value={newVital.systolic_bp}
                          onChange={(e) =>
                            setNewVital({
                              ...newVital,
                              systolic_bp: Number(e.target.value),
                            })
                          }
                        />
                        <input
                          type="number"
                          style={{ width: "50%" }}
                          value={newVital.diastolic_bp}
                          onChange={(e) =>
                            setNewVital({
                              ...newVital,
                              diastolic_bp: Number(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="form-field">
                      <label>Activity Context</label>
                      <input
                        type="text"
                        value={newVital.activity_context}
                        onChange={(e) =>
                          setNewVital({
                            ...newVital,
                            activity_context: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Observation Note</label>
                      <input
                        type="text"
                        placeholder="Optional note..."
                        value={newVital.note}
                        onChange={(e) =>
                          setNewVital({ ...newVital, note: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <button type="submit" className="primary-button">
                      <PlusCircle size={15} /> Record Vital Entry (MANUAL)
                    </button>
                  </div>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">READING LOG</div>
                    <h3>Recorded measurements ({filteredVitals.length})</h3>
                  </div>
                </div>

                <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                  {filteredVitals.map((reading, index) => (
                    <div
                      className="alert-item"
                      key={`${reading.id || index}-${reading.time}`}
                    >
                      <div className="alert-icon info-alert">
                        <HeartPulse size={17} />
                      </div>

                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <strong>
                            {reading.astronaut_name ||
                              `Astronaut ${reading.astronaut_id}`}{" "}
                            · {reading.heart_rate} BPM
                          </strong>
                          <DataBadge type={reading.data_type} />
                        </div>
                        <p>
                          Time: {reading.time} · SpO2: {reading.spo2 ?? 98}% · BP:{" "}
                          {reading.systolic_bp ?? 118}/{reading.diastolic_bp ?? 76}{" "}
                          mmHg · Temp: {reading.skin_temp_c ?? 36.6}°C
                        </p>
                        <p>
                          Context: {reading.activity_context || "Station duty"}{" "}
                          {reading.note ? `— ${reading.note}` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );

      case "Sleep Monitor":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">SLEEP &amp; RECOVERY</div>
                <h2>Sleep &amp; circadian rhythm monitoring</h2>
                <p>
                  Review simulated and manually logged crew sleep durations,
                  sleep architecture stages, and efficiency metrics.
                </p>
              </div>

              <div className="welcome-actions">
                <select
                  className="select-input"
                  value={sleepAstronautFilter}
                  onChange={(e) =>
                    setSleepAstronautFilter(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">All Crew Members ({sleepRecords.length})</option>
                  {astronauts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">SLEEP ARCHITECTURE COMPARISON</div>
                  <h3>Sleep stages (Deep, REM, Light hours) across logs</h3>
                </div>
                <DataBadge type="SIMULATED" />
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredSleep}>
                    <CartesianGrid
                      stroke="#23374B"
                      strokeDasharray="3 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="astronaut_name"
                      stroke="#8194AA"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#8194AA"
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#122238",
                        border: "1px solid #29425C",
                        borderRadius: "10px",
                        color: "#F3F7FC",
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="deep_sleep_hours"
                      name="Deep Sleep (hrs)"
                      stackId="a"
                      fill="#39C5E8"
                    />
                    <Bar
                      dataKey="rem_sleep_hours"
                      name="REM Sleep (hrs)"
                      stackId="a"
                      fill="#AD9AFF"
                    />
                    <Bar
                      dataKey="light_sleep_hours"
                      name="Light Sleep (hrs)"
                      stackId="a"
                      fill="#2A5C8A"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">LOG SLEEP SESSION</div>
                    <h3>Manual sleep record entry</h3>
                  </div>
                  <DataBadge type="MANUAL" />
                </div>

                <form onSubmit={handleCreateSleep}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Astronaut</label>
                      <select
                        value={newSleep.astronaut_id}
                        onChange={(e) =>
                          setNewSleep({
                            ...newSleep,
                            astronaut_id: Number(e.target.value),
                          })
                        }
                      >
                        {astronauts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Total Sleep Duration (hrs)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={1}
                        max={14}
                        value={newSleep.duration_hours}
                        onChange={(e) =>
                          setNewSleep({
                            ...newSleep,
                            duration_hours: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Deep Sleep (hrs)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={6}
                        value={newSleep.deep_sleep_hours}
                        onChange={(e) =>
                          setNewSleep({
                            ...newSleep,
                            deep_sleep_hours: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>REM Sleep (hrs)</label>
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        max={6}
                        value={newSleep.rem_sleep_hours}
                        onChange={(e) =>
                          setNewSleep({
                            ...newSleep,
                            rem_sleep_hours: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Sleep Efficiency (%)</label>
                      <input
                        type="number"
                        min={40}
                        max={100}
                        value={newSleep.sleep_efficiency}
                        onChange={(e) =>
                          setNewSleep({
                            ...newSleep,
                            sleep_efficiency: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Note</label>
                      <input
                        type="text"
                        placeholder="Optional sleep log note..."
                        value={newSleep.note}
                        onChange={(e) =>
                          setNewSleep({ ...newSleep, note: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <button type="submit" className="primary-button">
                      <PlusCircle size={15} /> Save Sleep Log (MANUAL)
                    </button>
                  </div>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">CREW SLEEP RECORDS</div>
                    <h3>{filteredSleep.length} sleep records</h3>
                  </div>
                  <Moon size={20} className="muted-icon" />
                </div>

                <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                  {filteredSleep.map((record, index) => {
                    const astronaut = astronauts.find(
                      (person) => person.id === record.astronaut_id
                    );

                    return (
                      <div
                        className="alert-item"
                        key={`${record.id || index}-${record.astronaut_id}`}
                      >
                        <div className="alert-icon info-alert">
                          <Moon size={17} />
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <strong>
                              {record.astronaut_name ||
                                astronaut?.name ||
                                `Astronaut ${record.astronaut_id}`}{" "}
                              · {record.duration_hours} hrs
                            </strong>
                            <DataBadge type={record.data_type} />
                          </div>
                          <p>
                            {record.date_label ||
                              `Mission Day ${record.mission_day || 142}`}{" "}
                            · Efficiency: {record.sleep_efficiency ?? 88}% · Deep:{" "}
                            {record.deep_sleep_hours ?? 1.6}h · REM:{" "}
                            {record.rem_sleep_hours ?? 1.8}h
                          </p>
                          {record.note && <p>{record.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        );

      case "Wellbeing":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">CREW WELLBEING &amp; SELF-REPORTS</div>
                <h2>Wellbeing &amp; fatigue check-ins</h2>
                <p>
                  Review timestamped crew self-reports on mood, perceived
                  fatigue, and schedule workload, or submit a manual check-in.
                </p>
              </div>

              <div className="welcome-actions">
                <select
                  className="select-input"
                  value={wellbeingAstronautFilter}
                  onChange={(e) =>
                    setWellbeingAstronautFilter(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">
                    All Crew Members ({wellbeingRecords.length})
                  </option>
                  {astronauts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <div className="notice-box">
              <strong>Non-Diagnostic Safety Notice:</strong> Wellbeing entries
              represent subjective self-reports intended solely to assist crew
              schedule awareness. AstroHealth does not perform psychological
              assessments or clinical diagnoses.
            </div>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">CREW CHECK-IN FORM</div>
                    <h3>Submit manual wellbeing check-in</h3>
                  </div>
                  <DataBadge type="MANUAL" />
                </div>

                <form onSubmit={handleCreateWellbeing}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Astronaut</label>
                      <select
                        value={newWellbeing.astronaut_id}
                        onChange={(e) =>
                          setNewWellbeing({
                            ...newWellbeing,
                            astronaut_id: Number(e.target.value),
                          })
                        }
                      >
                        {astronauts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Mood Check-in Descriptor</label>
                      <input
                        type="text"
                        value={newWellbeing.mood_label}
                        onChange={(e) =>
                          setNewWellbeing({
                            ...newWellbeing,
                            mood_label: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Self-Reported Mood Scale (1–5)</label>
                      <select
                        value={newWellbeing.mood_score}
                        onChange={(e) =>
                          setNewWellbeing({
                            ...newWellbeing,
                            mood_score: Number(e.target.value),
                          })
                        }
                      >
                        <option value={5}>5 — Energized &amp; Focused</option>
                        <option value={4}>4 — Calm &amp; Steady</option>
                        <option value={3}>3 — Neutral / Busy</option>
                        <option value={2}>2 — Tired / Needs Buffer</option>
                        <option value={1}>1 — High Fatigue</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Perceived Fatigue Level</label>
                      <select
                        value={newWellbeing.fatigue_level}
                        onChange={(e) =>
                          setNewWellbeing({
                            ...newWellbeing,
                            fatigue_level: e.target.value as
                              | "Low"
                              | "Moderate"
                              | "Elevated",
                          })
                        }
                      >
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Elevated">Elevated</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Schedule Workload</label>
                      <select
                        value={newWellbeing.workload_rating}
                        onChange={(e) =>
                          setNewWellbeing({
                            ...newWellbeing,
                            workload_rating: e.target.value as
                              | "Light"
                              | "Balanced"
                              | "High",
                          })
                        }
                      >
                        <option value="Light">Light</option>
                        <option value="Balanced">Balanced</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label>Crew Note</label>
                      <input
                        type="text"
                        placeholder="Add check-in reflection..."
                        value={newWellbeing.note}
                        onChange={(e) =>
                          setNewWellbeing({
                            ...newWellbeing,
                            note: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <button type="submit" className="primary-button">
                      <PlusCircle size={15} /> Log Wellbeing Check-in (MANUAL)
                    </button>
                  </div>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">WELLBEING LOGS</div>
                    <h3>{filteredWellbeing.length} recorded check-ins</h3>
                  </div>
                  <Brain size={20} className="muted-icon" />
                </div>

                <div style={{ maxHeight: "360px", overflowY: "auto" }}>
                  {filteredWellbeing.map((entry, idx) => (
                    <div
                      className="alert-item"
                      key={`${entry.id || idx}-${entry.timestamp}`}
                    >
                      <div
                        className={`alert-icon ${
                          entry.fatigue_level === "Low"
                            ? "success-alert"
                            : "warning-alert"
                        }`}
                      >
                        <Brain size={17} />
                      </div>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "8px",
                          }}
                        >
                          <strong>
                            {entry.astronaut_name ||
                              `Astronaut ${entry.astronaut_id}`}{" "}
                            · {entry.mood_label} ({entry.mood_score}/5)
                          </strong>
                          <DataBadge type={entry.data_type} />
                        </div>
                        <p>
                          Mission Day {entry.mission_day} · Fatigue:{" "}
                          <strong>{entry.fatigue_level}</strong> · Workload:{" "}
                          {entry.workload_rating}
                        </p>
                        <p>{entry.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        );

      case "Radiation":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">SPACE ENVIRONMENT &amp; DOSIMETRY</div>
                <h2>Radiation exposure records</h2>
                <p>
                  Review simulated habitat dosimetry logs for Mission{" "}
                  {mission?.id || "ORBITAL-01"} across mission days.
                </p>
              </div>
              <DataBadge type="SIMULATED" />
            </section>

            <div className="notice-box">
              <strong>Data Integrity Notice:</strong> All radiation entries
              displayed here are illustrative demonstration values (`mSv`) for
              software prototyping. AstroHealth does not invent regulatory dose
              limits or claim live spacecraft telemetry connection.
            </div>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">DAILY HABITAT DOSIMETRY TREND</div>
                  <h3>Recorded daily dose (mSv) by Mission Day</h3>
                </div>
                <DataBadge type="SIMULATED" />
              </div>

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={[...radiationRecords].reverse()}
                  >
                    <defs>
                      <linearGradient
                        id="radGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#F2B84B"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F2B84B"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#23374B"
                      strokeDasharray="3 5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="mission_day"
                      stroke="#8194AA"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `Day ${v}`}
                    />
                    <YAxis
                      stroke="#8194AA"
                      tickLine={false}
                      axisLine={false}
                      domain={[0.2, 0.7]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#122238",
                        border: "1px solid #29425C",
                        borderRadius: "10px",
                        color: "#F3F7FC",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Daily Dose"
                      unit=" mSv"
                      stroke="#F2B84B"
                      strokeWidth={2.5}
                      fill="url(#radGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">MANUAL DOSIMETER ENTRY</div>
                    <h3>Log demonstration radiation entry</h3>
                  </div>
                  <DataBadge type="MANUAL" />
                </div>

                <form onSubmit={handleCreateRadiation}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Mission Day</label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={newRadiation.mission_day}
                        onChange={(e) =>
                          setNewRadiation({
                            ...newRadiation,
                            mission_day: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Recorded Value (mSv)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        max={20}
                        value={newRadiation.value}
                        onChange={(e) =>
                          setNewRadiation({
                            ...newRadiation,
                            value: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label>Dosimeter Location</label>
                      <input
                        type="text"
                        value={newRadiation.dosimeter_location}
                        onChange={(e) =>
                          setNewRadiation({
                            ...newRadiation,
                            dosimeter_location: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-field">
                      <label>Solar Activity Context</label>
                      <select
                        value={newRadiation.solar_activity}
                        onChange={(e) =>
                          setNewRadiation({
                            ...newRadiation,
                            solar_activity: e.target.value,
                          })
                        }
                      >
                        <option value="Quiet">Quiet</option>
                        <option value="Minor Fluctuation">Minor Fluctuation</option>
                        <option value="SAA Transit">SAA Transit</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <button type="submit" className="primary-button">
                      <PlusCircle size={15} /> Log Dosimeter Entry (MANUAL)
                    </button>
                  </div>
                </form>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">MISSION ENVIRONMENT</div>
                    <h3>{radiationRecords.length} radiation records</h3>
                  </div>
                  <Radiation size={20} className="muted-icon" />
                </div>

                {radiationRecords.map((record, index) => (
                  <div
                    className="alert-item"
                    key={`${record.id || index}-${record.mission_day}`}
                  >
                    <div className="alert-icon warning-alert">
                      <Radiation size={17} />
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <strong>
                          {record.value} {record.unit} · Mission Day{" "}
                          {record.mission_day ?? 142}
                        </strong>
                        <DataBadge type={record.data_type} />
                      </div>
                      <p>
                        {record.mission_id} · Location:{" "}
                        {record.dosimeter_location || "Habitat"} · Cumulative:{" "}
                        {record.cumulative_msv ?? 58.4} mSv · Solar:{" "}
                        {record.solar_activity || "Quiet"}
                      </p>
                      <p>{record.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        );

      case "AI Health Assistant":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">ASTROHEALTH INTELLIGENCE</div>
                <h2>AI-Assisted Health Insights &amp; Summary Engine</h2>
                <p>
                  Transparent, rule-based analytical summaries of crew vital
                  signs, sleep records, wellbeing check-ins, and review items.
                </p>
              </div>

              <div className="welcome-actions">
                <select
                  className="select-input"
                  value={aiScopeAstronautId}
                  onChange={(e) =>
                    handleAiScopeChange(
                      e.target.value === "all" ? "all" : Number(e.target.value)
                    )
                  }
                >
                  <option value="all">Scope: Full Mission Crew (ORBITAL-01)</option>
                  {astronauts.map((a) => (
                    <option key={a.id} value={a.id}>
                      Scope: {a.name} ({a.role})
                    </option>
                  ))}
                </select>
                <DataBadge type="AI_DERIVED" />
              </div>
            </section>

            <div className="notice-box">
              <strong>Architecture &amp; Safety Disclosure:</strong>{" "}
              {aiSummary?.engine_description ||
                "Currently running AstroHealth's deterministic local rule-based observation engine (RULE_BASED_LOCAL). No external generative LLM is claimed."}
              <br />
              {aiSummary?.medical_disclaimer ||
                "This assistant generates non-clinical observations for human review and never diagnoses or prescribes treatment."}
            </div>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">AUTOMATED OBSERVATIONS</div>
                    <h3>
                      {aiSummary?.scope_title || "Mission health observations"}
                    </h3>
                  </div>
                  <Sparkles size={20} className="muted-icon" />
                </div>

                {(aiSummary?.observations || []).map((obs) => (
                  <div className="alert-item" key={obs.id}>
                    <div
                      className={`alert-icon ${
                        obs.level === "review" ? "warning-alert" : "info-alert"
                      }`}
                    >
                      {obs.level === "review" ? (
                        <AlertTriangle size={17} />
                      ) : (
                        <Activity size={17} />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <strong>
                          [{obs.category}] {obs.title}
                        </strong>
                        <DataBadge type={obs.data_type} />
                      </div>
                      <p>{obs.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">INTERACTIVE DATA Q&amp;A</div>
                    <h3>Ask about recorded crew health data</h3>
                  </div>
                  <DataBadge type="AI_DERIVED" />
                </div>

                <p style={{ marginTop: "10px", fontSize: "11px", color: "#9fb0c4" }}>
                  Select a prompt below or ask a question about crew vitals,
                  sleep trends, wellbeing check-ins, radiation logs, or NASA
                  OSDR research:
                </p>

                <div className="chip-list">
                  {(
                    aiSummary?.suggested_questions || [
                      "Summarize the current mission health overview and any items for review.",
                      "How are James Miller's sleep and heart-rate records trending?",
                      "Compare sleep duration and sleep efficiency across all four crew members.",
                      "What radiation exposure records are logged for Mission ORBITAL-01?",
                      "How do the manual or simulated crew records differ from NASA OSDR research?",
                    ]
                  ).map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="prompt-chip"
                      onClick={() => handleAskQuestion(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <form
                  style={{ display: "flex", gap: "8px", marginTop: "14px" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAskQuestion();
                  }}
                >
                  <input
                    type="text"
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      background: "#0b1726",
                      border: "1px solid #263f58",
                      borderRadius: "8px",
                      color: "#f3f7fc",
                      fontSize: "12px",
                    }}
                    placeholder="Ask a question about recorded mission data..."
                    value={aiQuestionInput}
                    onChange={(e) => setAiQuestionInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={aiAsking}
                  >
                    <Send size={14} /> {aiAsking ? "Analyzing..." : "Ask"}
                  </button>
                </form>

                {aiAnswer && (
                  <div className="dataset-card" style={{ marginTop: "16px" }}>
                    <div className="dataset-card-top">
                      <strong>{aiAnswer.headline}</strong>
                      <DataBadge type={aiAnswer.data_type} />
                    </div>
                    <ul
                      style={{
                        marginTop: "10px",
                        paddingLeft: "18px",
                        color: "#d4e2f0",
                        fontSize: "11px",
                        lineHeight: "1.7",
                      }}
                    >
                      {aiAnswer.bullet_points.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                    <div className="dataset-meta-tags">
                      <span className="meta-tag">
                        Engine: {aiAnswer.engine_mode}
                      </span>
                      {aiAnswer.source_classifications_referenced.map((sc) => (
                        <span className="meta-tag" key={sc}>
                          Ref: {sc}
                        </span>
                      ))}
                    </div>
                    <p
                      style={{
                        marginTop: "10px",
                        fontSize: "10px",
                        color: "#8194aa",
                      }}
                    >
                      {aiAnswer.medical_disclaimer}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </>
        );

      case "NASA Research":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">SPACE HEALTH RESEARCH CATALOGUE</div>
                <h2>NASA Open Science Data Repository (OSDR) &amp; Portals</h2>
                <p>
                  Explore verified spaceflight biology and human health studies
                  from NASA OSDR, NASA Human Research Program (HRP), and NASA
                  Life Sciences Portal.
                </p>
              </div>

              <div className="welcome-actions">
                <span className="meta-tag">
                  Integration: {nasaIntegrationStatus}
                </span>
                <DataBadge type="NASA_RESEARCH" />
              </div>
            </section>

            <div className="notice-box">
              <strong>Strict Data Separation &amp; Attribution:</strong>{" "}
              Historical NASA research datasets (<DataBadge type="NASA_RESEARCH" />)
              represent reference scientific studies and are{" "}
              <strong>never presented as live astronaut vital signs</strong>.
              AstroHealth is an independent student prototype and is not
              endorsed by NASA.
            </div>

            <section className="panel" style={{ marginTop: "16px" }}>
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">
                    NASA OSDR DATASET CATALOGUE ({nasaDatasets.length} STUDIES)
                  </div>
                  <h3>Verified Spaceflight &amp; Astronaut Health Studies</h3>
                </div>

                <form
                  onSubmit={handleNasaSearch}
                  style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}
                >
                  <input
                    type="text"
                    style={{
                      padding: "8px 12px",
                      background: "#0b1726",
                      border: "1px solid #294056",
                      borderRadius: "8px",
                      color: "#f3f7fc",
                      fontSize: "11px",
                      minWidth: "230px",
                    }}
                    placeholder="Search NASA OSDR (e.g. astronaut, immune, OSD-53)..."
                    value={nasaQueryInput}
                    onChange={(e) => setNasaQueryInput(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={nasaSearching}
                  >
                    <Search size={14} />{" "}
                    {nasaSearching ? "Searching OSDR..." : "Query OSDR"}
                  </button>
                </form>
              </div>

              {nasaDatasets.map((ds) => (
                <div className="dataset-card" key={ds.id}>
                  <div className="dataset-card-top">
                    <div>
                      <span
                        style={{
                          color: "#39c5e8",
                          fontSize: "10px",
                          fontWeight: 800,
                        }}
                      >
                        {ds.accession} ({ds.legacy_id}) · {ds.source_portal}
                      </span>
                      <h4 style={{ marginTop: "4px", fontSize: "14px" }}>
                        {ds.title}
                      </h4>
                    </div>
                    <DataBadge type={ds.data_type} />
                  </div>

                  <p
                    style={{
                      marginTop: "8px",
                      color: "#9fb0c4",
                      fontSize: "11px",
                      lineHeight: "1.6",
                    }}
                  >
                    {ds.description}
                  </p>

                  <div className="dataset-meta-tags">
                    <span className="meta-tag">Organism: {ds.organism}</span>
                    <span className="meta-tag">Material: {ds.material_type}</span>
                    <span className="meta-tag">Assay: {ds.assay_type}</span>
                    <span className="meta-tag">Program: {ds.space_program}</span>
                  </div>

                  <p
                    style={{
                      marginTop: "8px",
                      color: "#8be5f5",
                      fontSize: "10px",
                    }}
                  >
                    <strong>Study Context:</strong> {ds.study_context} —{" "}
                    {ds.relevance_to_astrohealth}
                  </p>

                  <div className="dataset-links">
                    <a
                      href={ds.source_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Study in NASA OSDR <ExternalLink size={12} />
                    </a>
                    <a
                      href={ds.api_metadata_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      OSDR API Metadata JSON <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </section>

            <section className="panel" style={{ marginTop: "16px" }}>
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">OFFICIAL NASA PORTALS</div>
                  <h3>Primary space-health data &amp; research repositories</h3>
                </div>
                <Database size={20} className="muted-icon" />
              </div>

              {nasaPortals.map((portal) => (
                <div className="alert-item" key={portal.id}>
                  <div className="alert-icon info-alert">
                    <Database size={17} />
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <strong>
                        {portal.name} ({portal.category})
                      </strong>
                      <DataBadge type={portal.data_type} />
                    </div>
                    <p>{portal.description}</p>
                    <div className="dataset-links">
                      <a href={portal.url} target="_blank" rel="noreferrer">
                        Visit Official Portal <ExternalLink size={12} />
                      </a>
                      <a
                        href={portal.api_docs_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Documentation / Roadmap <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          </>
        );

      case "Notifications":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">MISSION OBSERVATIONS &amp; ALERTS</div>
                <h2>Notifications &amp; review queue</h2>
                <p>
                  Filter observations by priority, inspect explanations, and
                  toggle read/unread status.
                </p>
              </div>

              <div className="welcome-actions">
                <select
                  className="select-input"
                  value={alertPriorityFilter}
                  onChange={(e) =>
                    setAlertPriorityFilter(
                      e.target.value as "All" | "Review" | "Information"
                    )
                  }
                >
                  <option value="All">All Notifications ({alerts.length})</option>
                  <option value="Review">Review Priority ({pendingReviewsCount})</option>
                  <option value="Information">Information Only</option>
                </select>

                <button
                  className="secondary-button"
                  onClick={handleMarkAllAlertsRead}
                >
                  <CheckCircle2 size={14} /> Mark all as read
                </button>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">NOTIFICATION LOG</div>
                  <h3>
                    {filteredAlerts.length} notifications ({unreadAlertsCount}{" "}
                    unread)
                  </h3>
                </div>
                <Bell size={20} className="muted-icon" />
              </div>

              {filteredAlerts.map((alert) => (
                <div
                  className={`alert-item ${!alert.is_read ? "unread" : ""}`}
                  key={alert.id}
                >
                  <div
                    className={`alert-icon ${
                      alert.priority === "Review"
                        ? "warning-alert"
                        : "info-alert"
                    }`}
                  >
                    {alert.priority === "Review" ? (
                      <AlertTriangle size={17} />
                    ) : (
                      <Activity size={17} />
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>
                        {alert.title} · [{alert.priority}]{" "}
                        {!alert.is_read && (
                          <span style={{ color: "#f2b84b", fontSize: "10px" }}>
                            (UNREAD)
                          </span>
                        )}
                      </strong>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <DataBadge type={alert.data_type} />
                        <button
                          className="text-link"
                          onClick={() => handleToggleAlertRead(alert.id)}
                        >
                          {alert.is_read ? "Mark unread" : "Mark read"}
                        </button>
                      </div>
                    </div>
                    <p>
                      <strong>{alert.description}</strong> · Category:{" "}
                      {alert.category || "General"} · Mission:{" "}
                      {alert.mission_id || "ORBITAL-01"}
                    </p>
                    {alert.explanation && <p>{alert.explanation}</p>}
                    {alert.astronaut_id && (
                      <button
                        className="text-link"
                        style={{ marginTop: "6px" }}
                        onClick={() =>
                          openAstronautProfile(alert.astronaut_id as number)
                        }
                      >
                        Inspect Astronaut Profile <ArrowUpRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        );

      case "Settings":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">SYSTEM CONFIGURATION</div>
                <h2>Settings, database &amp; offline synchronization</h2>
                <p>
                  Configure the backend API endpoint, inspect database persistence
                  status, and manage local offline caches.
                </p>
              </div>
            </section>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">API &amp; DATABASE STATUS</div>
                    <h3>Backend &amp; SQLAlchemy persistence</h3>
                  </div>
                  <Settings size={20} className="muted-icon" />
                </div>

                <div className="alert-item">
                  <div className="alert-icon info-alert">
                    <Wifi size={17} />
                  </div>
                  <div>
                    <strong>Connection State: {apiStatus}</strong>
                    <p>Active API Endpoint: {apiBaseUrl}</p>
                  </div>
                </div>

                <div className="alert-item">
                  <div className="alert-icon success-alert">
                    <Database size={17} />
                  </div>
                  <div>
                    <strong>Database Engine: {dbStatus.mode || "sqlite_local"}</strong>
                    <p>{dbStatus.description}</p>
                    <p>
                      Configure MySQL credentials in <code>backend/.env</code> (see{" "}
                      <code>.env.example</code>) to switch from local SQLite to a
                      MySQL server.
                    </p>
                  </div>
                </div>

                <div className="form-field" style={{ marginTop: "14px" }}>
                  <label>Backend API Base URL</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      style={{ flex: 1 }}
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => {
                        saveCache("api_base_url", apiBaseUrl);
                        loadDashboard(apiBaseUrl);
                        setStatusBannerMsg("API endpoint updated and refreshed.");
                      }}
                    >
                      <RefreshCw size={14} /> Reconnect
                    </button>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">OFFLINE SUPPORT &amp; CACHE</div>
                    <h3>Local cache &amp; queued manual entries</h3>
                  </div>
                </div>

                <p style={{ marginTop: "10px", fontSize: "11px", color: "#9fb0c4" }}>
                  AstroHealth caches API responses in <code>localStorage</code>{" "}
                  so the dashboard remains accessible if spacecraft-to-ground or
                  local backend connectivity drops. Manual records entered while
                  offline are queued for synchronization.
                </p>

                <div className="alert-item">
                  <div className="alert-icon warning-alert">
                    <Clock size={17} />
                  </div>
                  <div>
                    <strong>
                      Offline Sync Queue: {offlineQueue.length} item(s) waiting
                    </strong>
                    <p>
                      {offlineQueue.length === 0
                        ? "All manual entries are synchronized with the backend."
                        : offlineQueue.map((q) => q.label).join(" · ")}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    className="primary-button"
                    onClick={syncOfflineQueue}
                    disabled={offlineQueue.length === 0}
                  >
                    <RefreshCw size={14} /> Sync Queued Entries ({offlineQueue.length})
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      clearAllAstroHealthCache();
                      setOfflineQueue([]);
                      setStatusBannerMsg(
                        "Local browser cache cleared and reset to fresh backend state."
                      );
                      loadDashboard();
                    }}
                  >
                    <Trash2 size={14} /> Reset Local Cache
                  </button>
                </div>
              </div>
            </section>
          </>
        );

      case "Help & Support":
        return (
          <>
            <section className="welcome-section">
              <div>
                <div className="eyebrow">DOCUMENTATION &amp; SAFETY GUIDE</div>
                <h2>Help, Data Classifications &amp; Disclaimers</h2>
                <p>
                  Reference guide for AstroHealth — NASA Space Apps Challenge
                  2026 (Challenge 5: Create Health Monitoring Software for
                  Astronauts on Space Missions).
                </p>
              </div>
            </section>

            <section className="two-col-grid">
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">DATA INTEGRITY CLASSIFICATIONS</div>
                    <h3>5-Tier Source Classification Standard</h3>
                  </div>
                  <ShieldCheck size={20} className="muted-icon" />
                </div>

                <div className="alert-item">
                  <DataBadge type="SIMULATED" />
                  <div>
                    <strong>Simulated Demonstration Data</strong>
                    <p>
                      Fictional crew profiles, vital signs, sleep logs, and
                      dosimetry entries created strictly to demonstrate software
                      workflows. Not real astronaut medical records.
                    </p>
                  </div>
                </div>

                <div className="alert-item">
                  <DataBadge type="MANUAL" />
                  <div>
                    <strong>Manually Entered Records</strong>
                    <p>
                      Entries submitted interactively by the user via the Vital
                      Signs, Sleep, Wellbeing, or Radiation logging forms.
                    </p>
                  </div>
                </div>

                <div className="alert-item">
                  <DataBadge type="NASA_RESEARCH" />
                  <div>
                    <strong>NASA Space-Health Research Data</strong>
                    <p>
                      Verified scientific studies and metadata from the NASA Open
                      Science Data Repository (OSDR), HRP, and NLSP. Never
                      presented as live crew vital signs.
                    </p>
                  </div>
                </div>

                <div className="alert-item">
                  <DataBadge type="AI_DERIVED" />
                  <div>
                    <strong>AI-Derived Summaries (Rule-Based)</strong>
                    <p>
                      Analytical summaries and Q&amp;A responses generated by
                      AstroHealth's local rule-based observation engine for
                      human review.
                    </p>
                  </div>
                </div>

                <div className="alert-item">
                  <DataBadge type="SENSOR" />
                  <div>
                    <strong>Hardware Sensor Telemetry</strong>
                    <p>
                      Reserved exclusively for verified physical sensor hardware
                      streams (not claimed in this simulation prototype).
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">MEDICAL &amp; NASA DISCLAIMERS</div>
                    <h3>Project boundaries &amp; quick links</h3>
                  </div>
                  <CircleHelp size={20} className="muted-icon" />
                </div>

                <div className="notice-box">
                  <strong>Independent Student Innovation Prototype:</strong>{" "}
                  AstroHealth is NOT an official NASA product and does not claim
                  NASA endorsement.
                </div>

                <div className="notice-box">
                  <strong>Non-Clinical / Non-Diagnostic Software:</strong>{" "}
                  AstroHealth is an educational prototype, not a certified
                  medical device. It does not diagnose medical or psychological
                  conditions, prescribe treatment, or replace professional
                  medical judgment.
                </div>

                <div className="alert-item">
                  <div className="alert-icon info-alert">
                    <Database size={17} />
                  </div>
                  <div>
                    <strong>Interactive Backend API Documentation (Swagger UI)</strong>
                    <p>
                      Inspect and test all REST endpoints at{" "}
                      <a
                        href={`${apiBaseUrl}/docs`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {apiBaseUrl}/docs <ExternalLink size={11} />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        );

      default:
        return <p>This page is not available.</p>;
    }
  };

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* GLOBAL SEARCH MODAL */}
      {searchOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <div>
                <div className="panel-kicker">GLOBAL MISSION SEARCH</div>
                <h3>Search astronauts, vitals, alerts &amp; NASA OSDR research</h3>
              </div>
              <button
                className="icon-button"
                onClick={() => setSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="search-input-bar">
              <Search size={17} color="#39c5e8" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search (e.g., James Miller, Commander, sleep, OSD-53, immune, review)..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
              />
              {globalSearchQuery && (
                <button
                  className="icon-button"
                  onClick={() => setGlobalSearchQuery("")}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {globalSearchResults ? (
              <div style={{ maxHeight: "420px", overflowY: "auto", marginTop: "12px" }}>
                {globalSearchResults.astronauts.length > 0 && (
                  <div style={{ marginTop: "10px" }}>
                    <div className="panel-kicker">
                      ASTRONAUTS ({globalSearchResults.astronauts.length})
                    </div>
                    {globalSearchResults.astronauts.map((a) => (
                      <div
                        className="astronaut-row"
                        key={a.id}
                        onClick={() => {
                          setSearchOpen(false);
                          openAstronautProfile(a.id);
                        }}
                      >
                        <div className="astronaut-details">
                          <strong>
                            {a.name} ({a.role})
                          </strong>
                          <span>{a.specialty}</span>
                        </div>
                        <DataBadge type={a.data_type} />
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.alerts.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <div className="panel-kicker">
                      NOTIFICATIONS &amp; OBSERVATIONS ({globalSearchResults.alerts.length})
                    </div>
                    {globalSearchResults.alerts.map((al) => (
                      <div
                        className="astronaut-row"
                        key={al.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setActivePage("Notifications");
                        }}
                      >
                        <div className="astronaut-details">
                          <strong>
                            {al.title} [{al.priority}]
                          </strong>
                          <span>{al.description}</span>
                        </div>
                        <DataBadge type={al.data_type} />
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.datasets.length > 0 && (
                  <div style={{ marginTop: "14px" }}>
                    <div className="panel-kicker">
                      NASA OSDR RESEARCH ({globalSearchResults.datasets.length})
                    </div>
                    {globalSearchResults.datasets.map((d) => (
                      <div
                        className="astronaut-row"
                        key={d.id}
                        onClick={() => {
                          setSearchOpen(false);
                          setActivePage("NASA Research");
                        }}
                      >
                        <div className="astronaut-details">
                          <strong>
                            {d.accession}: {d.title}
                          </strong>
                          <span>{d.organism} · {d.assay_type}</span>
                        </div>
                        <DataBadge type={d.data_type} />
                      </div>
                    ))}
                  </div>
                )}

                {globalSearchResults.astronauts.length === 0 &&
                  globalSearchResults.alerts.length === 0 &&
                  globalSearchResults.datasets.length === 0 && (
                    <p style={{ marginTop: "16px", color: "#9fb0c4", fontSize: "12px" }}>
                      No matching astronauts, alerts, or NASA datasets found for "
                      {globalSearchQuery}".
                    </p>
                  )}
              </div>
            ) : (
              <div className="chip-list" style={{ marginTop: "16px" }}>
                {["James Miller", "Alex Rivera", "OSD-53", "Immune", "Review"].map(
                  (term) => (
                    <button
                      key={term}
                      className="prompt-chip"
                      onClick={() => setGlobalSearchQuery(term)}
                    >
                      Search "{term}"
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS QUICK MODAL */}
      {notificationsDrawerOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setNotificationsDrawerOpen(false)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-header">
              <div>
                <div className="panel-kicker">SYSTEM NOTIFICATIONS</div>
                <h3>
                  Active observations ({unreadAlertsCount} unread of {alerts.length})
                </h3>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="secondary-button"
                  onClick={handleMarkAllAlertsRead}
                >
                  Mark all read
                </button>
                <button
                  className="icon-button"
                  onClick={() => setNotificationsDrawerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div style={{ maxHeight: "380px", overflowY: "auto" }}>
              {alerts.map((al) => (
                <div
                  className={`alert-item ${!al.is_read ? "unread" : ""}`}
                  key={al.id}
                >
                  <div
                    className={`alert-icon ${
                      al.priority === "Review" ? "warning-alert" : "info-alert"
                    }`}
                  >
                    {al.priority === "Review" ? (
                      <AlertTriangle size={16} />
                    ) : (
                      <Activity size={16} />
                    )}
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <strong>
                        {al.title} [{al.priority}]
                      </strong>
                      <DataBadge type={al.data_type} />
                    </div>
                    <p>{al.explanation || al.description}</p>
                    <div style={{ display: "flex", gap: "12px", marginTop: "6px" }}>
                      <button
                        className="text-link"
                        onClick={() => handleToggleAlertRead(al.id)}
                      >
                        {al.is_read ? "Mark unread" : "Mark read"}
                      </button>
                      {al.astronaut_id && (
                        <button
                          className="text-link"
                          onClick={() => {
                            setNotificationsDrawerOpen(false);
                            openAstronautProfile(al.astronaut_id as number);
                          }}
                        >
                          Open Astronaut Profile <ArrowUpRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Orbit size={25} />
          </div>

          <div>
            <h2>
              ASTRO<span>HEALTH</span>
            </h2>
            <p>MISSION HEALTH SYSTEM</p>
          </div>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="mission-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  if (item.name !== "Astronauts") {
                    setSelectedAstronautId(null);
                  }
                  setMobileOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.name}</span>

                {item.name === "AI Health Assistant" && (
                  <span className="new-tag">AI</span>
                )}
                {item.name === "Notifications" && unreadAlertsCount > 0 && (
                  <span className="nav-badge">{unreadAlertsCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="mission-card">
            <div className="mission-card-top">
              <span className="status-dot" />
              <span>MISSION ACTIVE</span>
            </div>

            <h3>{mission?.id || "ORBITAL-01"}</h3>
            <p>{mission?.location || "Low Earth Orbit"}</p>

            <div className="mission-progress">
              <div
                style={{
                  width: `${mission?.progress_percent ?? 68}%`,
                }}
              />
            </div>

            <div className="mission-progress-label">
              <span>Day {mission?.duration_days ?? 142}</span>
              <strong>{mission?.progress_percent ?? 68}%</strong>
            </div>
          </div>

          <button
            className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
            onClick={() => {
              setActivePage("Settings");
              setMobileOpen(false);
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
            {offlineQueue.length > 0 && (
              <span className="nav-badge">{offlineQueue.length}</span>
            )}
          </button>

          <button
            className={`nav-item ${
              activePage === "Help & Support" ? "active" : ""
            }`}
            onClick={() => {
              setActivePage("Help & Support");
              setMobileOpen(false);
            }}
          >
            <CircleHelp size={18} />
            <span>Help &amp; Support</span>
          </button>

          <div className="sidebar-footer">
            <ShieldCheck size={15} />
            <span>Independent research prototype</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="breadcrumb">
                MISSION CONTROL / <span>{activePage.toUpperCase()}</span>
              </div>
              <h1>{activePage}</h1>
            </div>
          </div>

          <div className="topbar-right">
            <div
              className={`connection-status ${
                apiStatus === "Offline" ? "offline" : ""
              }`}
              title={
                apiStatus === "Offline"
                  ? "Using cached local demonstration records"
                  : "Connected to FastAPI backend"
              }
            >
              {apiStatus === "Offline" ? (
                <WifiOff size={15} />
              ) : (
                <Wifi size={15} />
              )}
              <span>
                API {apiStatus}
                {isLoading ? " (Syncing...)" : ""}
              </span>
            </div>

            {offlineQueue.length > 0 && (
              <button
                className="secondary-button"
                onClick={syncOfflineQueue}
                title="Synchronize queued offline records"
              >
                <RefreshCw size={13} /> Sync ({offlineQueue.length})
              </button>
            )}

            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label="Search AstroHealth"
            >
              <Search size={16} />
              <span>Search records...</span>
            </button>

            <button
              className="icon-button notification-button"
              onClick={() => setNotificationsDrawerOpen(true)}
              aria-label="Open notifications"
            >
              <Bell size={19} />
              {unreadAlertsCount > 0 && <span className="notification-dot" />}
            </button>

            <div
              className="profile"
              onClick={() => setActivePage("Settings")}
              title="Open Mission Control Settings"
            >
              <div className="avatar">MC</div>

              <div className="profile-info">
                <strong>Mission Control</strong>
                <span>Flight Surgeon Desk</span>
              </div>

              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        <div className="page-content">
          {/* PROMINENT REQUIRED DATA INTEGRITY BANNER ON ALL VIEWS */}
          <div className="demo-banner">
            <div className="demo-banner-left">
              <AlertTriangle size={16} />
              <span>
                SIMULATED DEMONSTRATION DATA — NOT REAL ASTRONAUT MEDICAL RECORDS
              </span>
            </div>
            <span>
              Independent Educational Prototype · Not a Certified Medical Device
            </span>
          </div>

          {statusBannerMsg && (
            <div
              className="notice-box"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{statusBannerMsg}</span>
              <button
                className="icon-button"
                onClick={() => setStatusBannerMsg(null)}
              >
                <X size={15} />
              </button>
            </div>
          )}

          {activePage === "Overview" ? (
            <>
              <section className="welcome-section">
                <div>
                  <div className="eyebrow">
                    <span className="status-dot" />
                    LIVE MISSION OVERVIEW · {mission?.id || "ORBITAL-01"}
                  </div>

                  <h2>Mission health overview</h2>

                  <p>
                    Monitor astronaut wellbeing, physiological trends, circadian
                    sleep recovery, and mission health observations.
                  </p>
                </div>

                <div className="welcome-actions">
                  <CalendarDays size={16} color="#39c5e8" />
                  <select
                    className="select-input"
                    value={overviewDayFilter}
                    onChange={(e) =>
                      setOverviewDayFilter(
                        e.target.value === "all"
                          ? "all"
                          : Number(e.target.value)
                      )
                    }
                  >
                    <option value={142}>Mission Day 142 (Current)</option>
                    <option value={141}>Mission Day 141</option>
                    <option value="all">All Mission Days (138–142)</option>
                  </select>
                </div>
              </section>

              <section className="stats-grid">
                <div
                  className="stat-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setActivePage("Astronauts")}
                >
                  <div className="stat-top">
                    <span>Active astronauts</span>
                    <div className="stat-icon cyan">
                      <Users size={19} />
                    </div>
                  </div>

                  <div className="stat-value">
                    {astronauts.length.toString().padStart(2, "0")}
                  </div>

                  <div className="stat-bottom">
                    <span className="positive">
                      <ArrowUpRight size={15} />{" "}
                      {astronauts.filter((a) => a.status === "Stable").length}{" "}
                      stable
                    </span>
                    <DataBadge type="SIMULATED" />
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setActivePage("Vital Signs")}
                >
                  <div className="stat-top">
                    <span>Health readings</span>
                    <div className="stat-icon green">
                      <HeartPulse size={19} />
                    </div>
                  </div>

                  <div className="stat-value">
                    {allVitals.length.toString().padStart(2, "0")}
                  </div>

                  <div className="stat-bottom">
                    <span className="positive">
                      <Activity size={15} /> {heartData.length} diurnal points
                    </span>
                    <DataBadge type="SIMULATED" />
                  </div>
                </div>

                <div
                  className="stat-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setActivePage("Notifications")}
                >
                  <div className="stat-top">
                    <span>Pending reviews</span>
                    <div className="stat-icon amber">
                      <AlertTriangle size={19} />
                    </div>
                  </div>

                  <div className="stat-value">
                    {pendingReviewsCount.toString().padStart(2, "0")}
                  </div>

                  <div className="stat-bottom">
                    <span className="warning-text">
                      {unreadAlertsCount} unread notifications
                    </span>
                    <span>Review queue</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Mission duration</span>
                    <div className="stat-icon purple">
                      <Clock size={19} />
                    </div>
                  </div>

                  <div className="stat-value">
                    {mission?.duration_days ?? 142} <small>days</small>
                  </div>

                  <div className="stat-bottom">
                    <span className="positive">
                      {mission?.progress_percent ?? 68}% completed
                    </span>
                    <span>{mission?.id || "ORBITAL-01"}</span>
                  </div>
                </div>
              </section>

              <section className="dashboard-grid">
                <div className="panel heart-panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">
                        PHYSIOLOGICAL MONITORING
                      </div>
                      <h3>Heart rate trends</h3>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select
                        className="select-input"
                        value={overviewAstronautFilter}
                        onChange={(e) =>
                          setOverviewAstronautFilter(
                            e.target.value === "all"
                              ? "all"
                              : Number(e.target.value)
                          )
                        }
                      >
                        <option value="all">Primary 24h Diurnal Series</option>
                        {astronauts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <DataBadge type="SIMULATED" />
                    </div>
                  </div>

                  <div className="heart-summary">
                    <div>
                      <strong>
                        {overviewAvgHeartRate || "—"} <small>BPM</small>
                      </strong>
                      <span>
                        Calculated mean from {overviewChartReadings.length}{" "}
                        displayed readings
                      </span>
                    </div>

                    <div className="trend-indicator">
                      <Activity size={16} />
                      Illustrative non-clinical trend
                    </div>
                  </div>

                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overviewChartReadings}>
                        <defs>
                          <linearGradient
                            id="heartGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#39C5E8"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#39C5E8"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          stroke="#23374B"
                          strokeDasharray="3 5"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="time"
                          stroke="#8194AA"
                          tickLine={false}
                          axisLine={false}
                        />

                        <YAxis
                          domain={[50, 100]}
                          stroke="#8194AA"
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          contentStyle={{
                            background: "#122238",
                            border: "1px solid #29425C",
                            borderRadius: "10px",
                            color: "#F3F7FC",
                          }}
                        />

                        <Area
                          type="monotone"
                          dataKey="heart_rate"
                          name="Heart rate"
                          unit=" BPM"
                          stroke="#39C5E8"
                          strokeWidth={2.5}
                          fill="url(#heartGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="chart-footer">
                    <span>
                      <i className="legend-dot cyan-dot" /> Heart rate (BPM)
                    </span>
                    <button
                      className="text-link"
                      onClick={() => setActivePage("Vital Signs")}
                    >
                      Open Vital Signs Monitor <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="panel astronaut-panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">CREW MANAGEMENT</div>
                      <h3>Astronaut overview (Select to inspect)</h3>
                    </div>

                    <button
                      className="text-link"
                      onClick={() => {
                        setSelectedAstronautId(null);
                        setActivePage("Astronauts");
                      }}
                    >
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>

                  <div className="astronaut-list">
                    {astronauts.map((astronaut, index) => (
                      <div
                        className="astronaut-row"
                        key={astronaut.id}
                        onClick={() => openAstronautProfile(astronaut.id)}
                      >
                        <div
                          className={`astronaut-avatar avatar-${
                            ["one", "two", "three", "four"][index % 4]
                          }`}
                        >
                          {astronaut.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")}
                        </div>

                        <div className="astronaut-details">
                          <strong>{astronaut.name}</strong>
                          <span>
                            {astronaut.role} · Avg HR:{" "}
                            {astronaut.avg_heart_rate ?? 72} BPM
                          </span>
                        </div>

                        <span
                          className={`crew-status ${
                            astronaut.status === "Stable"
                              ? "healthy"
                              : "review"
                          }`}
                        >
                          {astronaut.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="dashboard-grid lower-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">SLEEP &amp; RECOVERY</div>
                      <h3>Sleep monitoring</h3>
                    </div>

                    <DataBadge type="SIMULATED" />
                  </div>

                  <div className="sleep-content">
                    <div className="sleep-number">
                      {avgSleepHours.toFixed(1)} <small>hrs</small>
                    </div>

                    <span className="sleep-caption">
                      Average sleep duration from {sleepRecords.length} logged
                      records
                    </span>

                    <div className="sleep-bar">
                      <div style={{ width: `${sleepBarPercent}%` }} />
                    </div>

                    <div className="sleep-scale">
                      <span>0 hrs</span>
                      <span>Target: 7.5 hrs</span>
                      <span>12 hrs</span>
                    </div>
                  </div>

                  <div className="sleep-footer">
                    <span>
                      <Moon size={15} /> Sleep efficiency avg:{" "}
                      {sleepRecords.length > 0
                        ? Math.round(
                            sleepRecords.reduce(
                              (s, r) => s + (r.sleep_efficiency || 88),
                              0
                            ) / sleepRecords.length
                          )
                        : 88}
                      %
                    </span>
                    <button
                      className="text-link"
                      onClick={() => setActivePage("Sleep Monitor")}
                    >
                      Details <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">SPACE ENVIRONMENT</div>
                      <h3>Radiation records</h3>
                    </div>

                    <DataBadge
                      type={radiationRecords[0]?.data_type || "SIMULATED"}
                    />
                  </div>

                  <div className="radiation-content">
                    <div className="radiation-number">
                      {radiationRecords.length > 0
                        ? radiationRecords[0].value
                        : "—"}
                      <small>
                        {radiationRecords.length > 0
                          ? ` ${radiationRecords[0].unit}`
                          : ""}
                      </small>
                    </div>

                    <span>
                      {radiationRecords.length > 0
                        ? `${radiationRecords[0].note} (Cumulative: ${
                            radiationRecords[0].cumulative_msv ?? 58.4
                          } mSv)`
                        : "No radiation records available"}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "18px",
                      }}
                    >
                      <div
                        className="radiation-status"
                        style={{ marginTop: 0 }}
                      >
                        <Database size={14} />
                        <span>
                          {radiationRecords[0]?.dosimeter_location ||
                            "Habitat Dosimeter"}
                        </span>
                      </div>
                      <button
                        className="text-link"
                        onClick={() => setActivePage("Radiation")}
                      >
                        View logs <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="panel alerts-panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-kicker">SYSTEM NOTIFICATIONS</div>
                      <h3>Recent observations</h3>
                    </div>

                    <span className="alert-count">
                      {alerts.length.toString().padStart(2, "0")}
                    </span>
                  </div>

                  <div className="alerts-list">
                    {alerts.slice(0, 3).map((alert) => (
                      <div
                        className={`alert-item ${
                          !alert.is_read ? "unread" : ""
                        }`}
                        key={alert.id}
                      >
                        <div
                          className={`alert-icon ${
                            alert.priority === "Review"
                              ? "warning-alert"
                              : "info-alert"
                          }`}
                        >
                          {alert.priority === "Review" ? (
                            <AlertTriangle size={16} />
                          ) : (
                            <Activity size={16} />
                          )}
                        </div>

                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "6px",
                            }}
                          >
                            <strong>{alert.title}</strong>
                            <DataBadge type={alert.data_type} />
                          </div>
                          <p>{alert.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="insight-panel">
                <div className="insight-icon">
                  <Sparkles size={22} />
                </div>

                <div className="insight-content">
                  <span>ASTROHEALTH INTELLIGENCE · RULE-BASED ENGINE</span>
                  <h3>Understand health trends, not just isolated numbers.</h3>

                  <p>
                    AstroHealth combines physiological records, circadian sleep
                    summaries, subjective wellbeing check-ins, and verified NASA
                    OSDR research references to generate explainable
                    observations for human review.
                  </p>
                </div>

                <button
                  className="insight-button"
                  onClick={() => setActivePage("AI Health Assistant")}
                >
                  Explore AI assistant <ArrowUpRight size={16} />
                </button>
              </section>
            </>
          ) : (
            renderOtherPage()
          )}

          <footer className="page-footer">
            <span>
              ASTROHEALTH © 2026 · Intelligent Health Monitoring Beyond Earth
            </span>
            <span>
              Independent student innovation prototype · Not an official NASA
              product
            </span>
            <span>
              <ShieldCheck size={14} /> Non-diagnostic research demonstration
              only
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
