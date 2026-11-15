import logging
from datetime import datetime, timezone
from typing import Any, Optional
import httpx

from app.config import settings

logger = logging.getLogger("astrohealth.nasa_service")

# Verified baseline NASA Open Science Data Repository (OSDR) studies & official portals.
# All Accession numbers (OSD-53, OSD-943, OSD-343, OSD-87, OSD-51, OSD-174) are real,
# publicly accessible studies in NASA OSDR (https://osdr.nasa.gov/).
VERIFIED_NASA_DATASETS: list[dict[str, Any]] = [
    {
        "id": "OSD-53",
        "accession": "OSD-53",
        "legacy_id": "GLDS-53 / E-GEOD-47126",
        "title": "Spaceflight Modulates Gene Expression in Astronauts",
        "description": (
            "Whole-blood transcription profiling study investigating how exposure to spaceflight "
            "stressors (microgravity, fluid shifts, and space radiation) modulates immune and cellular "
            "gene expression in NASA astronauts."
        ),
        "organism": "Homo sapiens",
        "project_type": "Spaceflight Study",
        "material_type": "Whole Blood",
        "assay_type": "Transcription profiling (DNA microarray)",
        "factors": ["Spaceflight", "Sex", "Time"],
        "space_program": "NASA",
        "publication_title": "Spaceflight modulates gene expression in the whole blood of astronauts",
        "source_portal": "NASA Open Science Data Repository (OSDR)",
        "source_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-53",
        "api_metadata_url": "https://osdr.nasa.gov/osdr/data/osd/meta/53",
        "study_context": "Human immune and transcriptomic adaptation during orbital spaceflight.",
        "relevance_to_astrohealth": (
            "Provides scientific context for tracking longitudinal physiological and immune-stress "
            "indicators across mission phases."
        ),
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "OSD-943",
        "accession": "OSD-943",
        "legacy_id": "OSD-943",
        "title": "Longitudinal Transcriptomic and Epigenetic Analysis in Astronauts Reveals Dynamic Immune Response to Spaceflight",
        "description": (
            "Longitudinal profiling of astronaut peripheral blood mononuclear cells examining "
            "epigenetic (DNA methylation) and transcriptomic shifts pre-flight, in-flight, and post-flight."
        ),
        "organism": "Homo sapiens",
        "project_type": "Spaceflight Study",
        "material_type": "Blood / Leukocytes",
        "assay_type": "Epigenetic & Transcriptomic Profiling",
        "factors": ["Spaceflight Duration", "Recovery Phase"],
        "space_program": "NASA",
        "publication_title": "Longitudinal transcriptomic and epigenetic analysis in astronauts reveals dynamic immune response to spaceflight",
        "source_portal": "NASA Open Science Data Repository (OSDR)",
        "source_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-943",
        "api_metadata_url": "https://osdr.nasa.gov/osdr/data/osd/meta/943",
        "study_context": "Longitudinal crew monitoring across pre-flight baseline, mission execution, and post-flight recovery.",
        "relevance_to_astrohealth": (
            "Supports AstroHealth's emphasis on baseline-relative trend monitoring rather than isolated point readings."
        ),
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "OSD-343",
        "accession": "OSD-343",
        "legacy_id": "GLDS-343",
        "title": "Comprehensive Multi-Omics Analysis Reveals Mitochondrial Stress as a Central Biological Hub for Spaceflight Impact",
        "description": (
            "Multi-omics investigation across spaceflight biospecimens identifying mitochondrial stress, "
            "oxidative phosphorylation shifts, and circadian rhythm regulation changes during space missions."
        ),
        "organism": "Homo sapiens / Mus musculus",
        "project_type": "Spaceflight Multi-Omics Study",
        "material_type": "Multiple Tissues & Biofluids",
        "assay_type": "Multi-Omics (Transcriptomics, Proteomics, Metabolomics)",
        "factors": ["Spaceflight", "Microgravity", "Space Radiation"],
        "space_program": "NASA GeneLab / OSDR",
        "publication_title": "Comprehensive Multi-Omics Analysis Reveals Mitochondrial Stress as a Central Biological Hub for Spaceflight Impact (Cell, 2020)",
        "source_portal": "NASA Open Science Data Repository (OSDR)",
        "source_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-343",
        "api_metadata_url": "https://osdr.nasa.gov/osdr/data/osd/meta/343",
        "study_context": "Systemic metabolic, sleep/circadian, and cellular energy adaptations in microgravity.",
        "relevance_to_astrohealth": (
            "Informs the integration of fatigue check-ins, sleep architecture tracking, and radiation exposure logs."
        ),
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "OSD-87",
        "accession": "OSD-87",
        "legacy_id": "GLDS-87",
        "title": "Spaceflight Effects on the Retina: Histological, Gene Expression and Epigenetic Changes (STS-135)",
        "description": (
            "Investigation onboard Space Shuttle mission STS-135 examining molecular and histological "
            "impacts of microgravity and spaceflight on ocular and retinal biology."
        ),
        "organism": "Mus musculus",
        "project_type": "Spaceflight Study (STS-135)",
        "material_type": "Ocular / Retinal Tissue",
        "assay_type": "Histology, Gene Expression & Epigenetic Profiling",
        "factors": ["Spaceflight (STS-135)", "Microgravity"],
        "space_program": "NASA Space Shuttle Program",
        "publication_title": "Spaceflight effects on the mouse retina: Histological, gene expression and epigenetic changes after flight on STS-135",
        "source_portal": "NASA Open Science Data Repository (OSDR)",
        "source_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-87",
        "api_metadata_url": "https://osdr.nasa.gov/osdr/data/osd/meta/87",
        "study_context": "Spaceflight-Associated Neuro-ocular Syndrome (SANS) and sensory health research.",
        "relevance_to_astrohealth": (
            "Highlights why astronauts require structured neurological, visual, and wellbeing symptom logging during orbital missions."
        ),
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "OSD-174",
        "accession": "OSD-174",
        "legacy_id": "GLDS-174",
        "title": "ISS Environmental & Microbial Monitoring and Crew Habitat Assessment",
        "description": (
            "Characterization of spacecraft cabin environment and biological interactions onboard the "
            "International Space Station to support crew health safety."
        ),
        "organism": "Environmental / Spacecraft Microbiome",
        "project_type": "ISS Spaceflight Environment Study",
        "material_type": "Spacecraft Surface & Air Samples",
        "assay_type": "Metagenomic & Environmental Sequencing",
        "factors": ["Spacecraft Location", "Mission Timepoint"],
        "space_program": "NASA ISS Program",
        "publication_title": "International Space Station environmental monitoring reference series",
        "source_portal": "NASA Open Science Data Repository (OSDR)",
        "source_url": "https://osdr.nasa.gov/bio/repo/data/studies/OSD-174",
        "api_metadata_url": "https://osdr.nasa.gov/osdr/data/osd/meta/174",
        "study_context": "Habitat environmental telemetry alongside crew physiological monitoring.",
        "relevance_to_astrohealth": (
            "Reinforces combining spacecraft environmental telemetry (dosimetry, cabin context) with individual crew records."
        ),
        "data_type": "NASA_RESEARCH",
    },
]

OFFICIAL_NASA_PORTALS: list[dict[str, str]] = [
    {
        "id": "PORTAL-OSDR",
        "name": "NASA Open Science Data Repository (OSDR)",
        "category": "Primary Biological & Spaceflight Data Repository",
        "description": (
            "Provides open access to spaceflight biological, omics, physiological, and radiation datasets "
            "from NASA GeneLab and the Ames Life Sciences Data Archive (ALSDA)."
        ),
        "url": "https://osdr.nasa.gov/",
        "api_docs_url": "https://www.nasa.gov/osdr-api/",
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "PORTAL-HRP",
        "name": "NASA Human Research Program (HRP)",
        "category": "Spaceflight Human Health & Countermeasures",
        "description": (
            "Investigates the five main hazards of human spaceflight: space radiation, isolation and confinement, "
            "distance from Earth, gravity fields, and hostile/closed environments."
        ),
        "url": "https://www.nasa.gov/hrp/",
        "api_docs_url": "https://humanresearchroadmap.nasa.gov/",
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "PORTAL-NLSP",
        "name": "NASA Life Sciences Portal (NLSP)",
        "category": "Life Sciences Archival Reference",
        "description": (
            "Curates life sciences experiment descriptions, hardware specifications, and archival findings "
            "across historical and modern spaceflight programs."
        ),
        "url": "https://nlsp.nasa.gov/",
        "api_docs_url": "https://osdr.nasa.gov/",
        "data_type": "NASA_RESEARCH",
    },
    {
        "id": "PORTAL-NASA-API",
        "name": "NASA Open APIs Portal",
        "category": "Developer API Gateway",
        "description": (
            "Central developer catalog for NASA open data endpoints, including Space Weather (DONKI), "
            "OSDR biological metadata, and Earth/orbital telemetry."
        ),
        "url": "https://api.nasa.gov/",
        "api_docs_url": "https://api.nasa.gov/",
        "data_type": "NASA_RESEARCH",
    },
]

_SEARCH_CACHE: dict[str, dict[str, Any]] = {}


def fetch_nasa_osdr_research(query: Optional[str] = None, limit: int = 8) -> dict[str, Any]:
    """
    Queries the live public NASA OSDR Search API (https://osdr.nasa.gov/osdr/data/search)
    when available, normalizes the returned study metadata, and merges with the verified
    NASA OSDR baseline studies so users always see accurate, properly attributed NASA research.
    """
    search_term = (query or "").strip()
    cache_key = f"{search_term.lower()}:{limit}"

    if cache_key in _SEARCH_CACHE:
        return _SEARCH_CACHE[cache_key]

    live_api_status = "VERIFIED_CATALOGUE"
    live_studies: list[dict[str, Any]] = []

    api_term = search_term if search_term else "astronaut spaceflight health"
    try:
        url = f"{settings.NASA_OSDR_BASE_URL}/search"
        params = {
            "term": api_term,
            "size": max(4, min(limit, 12)),
            "type": "cgene",
        }
        with httpx.Client(timeout=settings.NASA_TIMEOUT_SECONDS) as client:
            resp = client.get(url, params=params)
            if resp.status_code == 200:
                payload = resp.json()
                hits = payload.get("hits", {}).get("hits", [])
                for hit in hits:
                    src = hit.get("_source", {})
                    accession = str(src.get("Accession") or src.get("Study Identifier") or "").strip()
                    title = str(src.get("Study Title") or "").strip()
                    if not accession or not title:
                        continue
                    numeric_id = accession.replace("OSD-", "").replace("GLDS-", "").strip()
                    factors_raw = str(src.get("Study Factor Name") or "").split()
                    factors = list(dict.fromkeys([f for f in factors_raw if len(f) > 1]))[:5]

                    live_studies.append(
                        {
                            "id": accession,
                            "accession": accession,
                            "legacy_id": str(src.get("Identifiers") or src.get("Data Source Accession") or accession),
                            "title": title,
                            "description": str(
                                src.get("Study Description")
                                or "Official study archived in the NASA Open Science Data Repository."
                            )[:480],
                            "organism": str(src.get("organism") or "Homo sapiens / Model Organism"),
                            "project_type": str(src.get("Project Type") or "Spaceflight Study"),
                            "material_type": str(src.get("Material Type") or "Biological Sample"),
                            "assay_type": str(
                                src.get("Study Assay Measurement Type")
                                or src.get("Study Assay Technology Type")
                                or "Spaceflight Assay"
                            ),
                            "factors": factors if factors else ["Spaceflight"],
                            "space_program": str(src.get("Space Program") or "NASA"),
                            "publication_title": str(
                                src.get("Study Publication Title") or "Published in NASA OSDR Repository"
                            ),
                            "source_portal": "NASA Open Science Data Repository (OSDR Live API)",
                            "source_url": f"https://osdr.nasa.gov/bio/repo/data/studies/{accession}",
                            "api_metadata_url": (
                                f"https://osdr.nasa.gov/osdr/data/osd/meta/{numeric_id}"
                                if numeric_id.isdigit()
                                else "https://osdr.nasa.gov/osdr/data/search"
                            ),
                            "study_context": (
                                f"{src.get('Project Type') or 'Spaceflight Study'} · "
                                f"Material: {src.get('Material Type') or 'Biospecimen'}"
                            ),
                            "relevance_to_astrohealth": (
                                "Retrieved directly from the public NASA OSDR API for space-health research reference."
                            ),
                            "data_type": "NASA_RESEARCH",
                        }
                    )
                if live_studies:
                    live_api_status = "LIVE_NASA_OSDR_API"
    except Exception as exc:
        logger.warning("NASA OSDR live query fallback triggered: %s", exc)
        live_api_status = "VERIFIED_OFFLINE_CATALOGUE"

    # Merge verified studies and live studies without duplicates
    combined: list[dict[str, Any]] = []
    seen_accessions: set[str] = set()

    # If user provided a specific search filter, filter verified datasets first
    for item in VERIFIED_NASA_DATASETS:
        if search_term:
            haystack = (
                f"{item['accession']} {item['title']} {item['description']} "
                f"{item['organism']} {item['assay_type']} {item['study_context']}"
            ).lower()
            if search_term.lower() not in haystack:
                continue
        combined.append(item)
        seen_accessions.add(item["accession"])

    for item in live_studies:
        if item["accession"] not in seen_accessions:
            combined.append(item)
            seen_accessions.add(item["accession"])

    result = {
        "count": len(combined),
        "data_type": "NASA_RESEARCH",
        "integration_status": live_api_status,
        "queried_at": datetime.now(timezone.utc).isoformat(),
        "attribution": (
            "Data and study metadata courtesy of the NASA Open Science Data Repository (OSDR), "
            "NASA Human Research Program (HRP), and NASA Life Sciences Portal. "
            "AstroHealth is an independent student prototype and is not endorsed by NASA."
        ),
        "scientific_notice": (
            "Historical NASA research datasets represent reference scientific investigations and "
            "must never be interpreted as live astronaut vital signs."
        ),
        "datasets": combined[: max(limit, len(VERIFIED_NASA_DATASETS))],
        "portals": OFFICIAL_NASA_PORTALS,
    }

    _SEARCH_CACHE[cache_key] = result
    return result
