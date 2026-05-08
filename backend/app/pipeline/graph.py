"""
graph.py — LangGraph M2M Pipeline Graph

Each node does TWO things:
  1. Runs the worker agent (same as before).
  2. Produces a short narrative snippet stored in state["narrative"] under its stage key.
     This enables incremental report building — the frontend can stream progress text,
     and the ReportGeneratorAgent has pre-written prose ready for each section.

Node order:
  START
    → pharmacodynamic_mapping   (Web Intelligence Agent)
    → merge_data                (data fusion)
    → ip_whitespace_clearance   (Patent Landscape Agent)
    → [INTERRUPT] commercial_viability_screening  (Commercial Viability Agent)
    → iqvia_exim_analysis       (IQVIA Supply Chain Agent)
    → generate_report           (Report Generator Agent)
  END
"""

from langgraph.graph import StateGraph, START, END
from app.pipeline.state import AgentRXState
from app.agents.workers import (
    WebIntelligenceAgent,
    PatentLandscapeAgent,
    CommercialViabilityAgent,
    IQVIASupplyChainAgent,
)
from app.agents.report_generator import ReportGeneratorAgent
from app.agents.telemetry import telemetry
import asyncio

def _thread_id(state: AgentRXState) -> str:
    """Extract thread_id seeded by MasterAgent into narrative at pipeline boot."""
    return state.get("narrative", {}).get("__thread_id__", "unknown")

# ---------------------------------------------------------------------------
# Instantiate workers (module-level singletons)
# ---------------------------------------------------------------------------

web_agent        = WebIntelligenceAgent()
patent_agent     = PatentLandscapeAgent()
commercial_agent = CommercialViabilityAgent()
iqvia_agent      = IQVIASupplyChainAgent()
report_agent     = ReportGeneratorAgent()

# ---------------------------------------------------------------------------
# Node: Pharmacodynamic Mapping (Phase 1 — Discovery)
# ---------------------------------------------------------------------------

async def node_web_discovery(state: AgentRXState):
    tid = _thread_id(state)
    telemetry.emit(tid, "Web Intelligence Agent", "running",
                   f"Querying PubMed for {state.get('molecule', '?')}...")

    result = await web_agent.execute_with_retries(state)
    diseases = result.get("diseases_bio", [])

    # Build discovery narrative snippet
    if diseases:
        candidate_names = [d.get("disease_name", "?") for d in diseases]
        top = diseases[0]
        narrative_text = (
            f"PubMed literature analysis identified {len(diseases)} candidate indication(s) "
            f"for {state.get('molecule', 'the target molecule')}: "
            f"{', '.join(candidate_names)}. "
            f"The highest-confidence candidate is <b>{top.get('disease_name')}</b> "
            f"(pathway overlap score: {top.get('pathway_overlap_score', 0):.2f}). "
            f"{top.get('reasoning', '')}"
        )
        telemetry.emit(tid, "Web Intelligence Agent", "completed",
                       f"{len(diseases)} candidate(s) identified: {', '.join(candidate_names)}")
    else:
        narrative_text = (
            f"PubMed literature scan returned no candidate indications for "
            f"{state.get('molecule', 'the target molecule')}."
        )
        telemetry.emit(tid, "Web Intelligence Agent", "completed", "No candidates found.")

    return {
        "diseases_bio": diseases,
        "narrative": {"discovery": narrative_text},
        "synonyms": result.get("synonyms", "")
    }

# ---------------------------------------------------------------------------
# Node: Merge Data
# ---------------------------------------------------------------------------

async def node_merge_data(state: AgentRXState):
    tid = _thread_id(state)
    telemetry.emit(tid, "Data Fusion Engine", "running", "Merging discovery data...")
    merged = state.get("diseases_bio", [])
    telemetry.emit(tid, "Data Fusion Engine", "completed",
                   f"{len(merged)} candidate(s) merged into unified candidate list.")
    return {"merged_diseases": merged}

# ---------------------------------------------------------------------------
# Node: IP Whitespace Clearance (Phase 2)
# ---------------------------------------------------------------------------

async def node_patent_check(state: AgentRXState):
    tid = _thread_id(state)
    total_in = len(state.get("merged_diseases", []))
    telemetry.emit(tid, "Patent Landscape Agent", "running",
                   f"Scanning Europe PMC for {total_in} candidate(s)...")

    result = await patent_agent.execute_with_retries(state)
    cleared = result.get("ip_cleared_diseases", [])

    total_out = len(cleared)
    blocked   = total_in - total_out

    # Build IP narrative snippet
    if cleared:
        clear_names    = [d.get("disease_name", "?") for d in cleared]
        narrative_text = (
            f"Europe PMC biological patent scan assessed {total_in} candidate indication(s). "
            f"{blocked} indication(s) were removed due to active blocking patents. "
            f"{total_out} indication(s) achieved Freedom-to-Operate (FTO) clearance: "
            f"{', '.join(clear_names)}. These candidates proceed to commercial viability screening."
        )
        telemetry.emit(tid, "Patent Landscape Agent", "completed",
                       f"{total_out}/{total_in} FTO cleared: {', '.join(clear_names)}. {blocked} blocked.")
    else:
        narrative_text = (
            f"All {total_in} candidate indication(s) were blocked by existing biological patents. "
            f"No FTO-clear candidates are available for commercial analysis."
        )
        telemetry.emit(tid, "Patent Landscape Agent", "completed",
                       f"All {total_in} candidate(s) blocked. No FTO-clear candidates.")

    return {
        "ip_cleared_diseases": cleared,
        "narrative": {"ip_analysis": narrative_text},
    }

# ---------------------------------------------------------------------------
# Node: Commercial Viability Screening (Phase 3 — after human approval)
# ---------------------------------------------------------------------------

async def node_commercial_filter(state: AgentRXState):
    tid = _thread_id(state)
    n_candidates = len(state.get("ip_cleared_diseases", []))
    telemetry.emit(tid, "Commercial Viability Agent", "running",
                   f"Fetching live FDA/ClinicalTrials/YFinance data for {n_candidates} candidate(s)...")

    res = await commercial_agent.execute_with_retries(state)
    commercial = res.get("commercial_data", [])

    # Build commercial narrative snippet
    if commercial:
        best = max(commercial, key=lambda x: len(x.get("recommendation", "")), default=commercial[0])
        narrative_text = (
            f"Commercial viability analysis was completed for {len(commercial)} indication(s) "
            f"using live OpenFDA, ClinicalTrials.gov, and Yahoo Finance data. "
            f"The leading candidate is <b>{best.get('disease_name')}</b> "
            f"with an estimated TAM of {best.get('tam_estimate', 'N/A')} "
            f"and a trial complexity rating of {best.get('trial_complexity', 'N/A')}. "
            f"VC Thesis: {best.get('recommendation', '')}"
        )
        telemetry.emit(tid, "Commercial Viability Agent", "completed",
                       f"Lead: {best.get('disease_name')} | TAM: {best.get('tam_estimate', 'N/A')} "
                       f"| Complexity: {best.get('trial_complexity', 'N/A')}")
    else:
        narrative_text = "No commercially viable candidates were identified at this stage."
        telemetry.emit(tid, "Commercial Viability Agent", "completed",
                       "No commercially viable candidates found.")

    return {
        "commercial_data": commercial,
        "narrative": {"commercial": narrative_text},
    }

# ---------------------------------------------------------------------------
# Node: IQVIA / EXIM Supply Chain Analysis (Phase 4)
# ---------------------------------------------------------------------------

async def node_supply_chain_analysis(state: AgentRXState):
    tid = _thread_id(state)
    telemetry.emit(tid, "IQVIA Supply Chain Agent", "running",
                   f"Querying IQVIA/EXIM datasets for {state.get('molecule', '?')}...")

    res = await iqvia_agent.execute_with_retries(state)
    sc = res.get("supply_chain_data", {})

    # Build supply chain narrative snippet
    exporters = ", ".join(sc.get("top_exporting_countries", [])) or "Unknown"
    narrative_text = (
        f"IQVIA and EXIM trade data analysis for {state.get('molecule', 'the molecule')} "
        f"reveals an API availability of <b>{sc.get('api_availability', 'N/A')}</b> "
        f"with a supply chain risk level of {sc.get('supply_chain_risk', 'N/A')}. "
        f"Top exporting countries: {exporters}. "
        f"Repurposing Opportunity Score: {sc.get('repurposing_score', 'N/A')}. "
        f"Market Trend: {sc.get('market_trend', 'N/A')}. "
        f"Clinical Pipeline: {sc.get('clinical_pipeline_status', 'N/A')}."
    )
    telemetry.emit(tid, "IQVIA Supply Chain Agent", "completed",
                   f"Availability: {sc.get('api_availability', 'N/A')} | "
                   f"Risk: {sc.get('supply_chain_risk', 'N/A')} | "
                   f"Score: {sc.get('repurposing_score', 'N/A')}")

    return {
        "supply_chain_data": sc,
        "narrative": {"supply_chain": narrative_text},
    }

# ---------------------------------------------------------------------------
# Node: Generate Report (Final Phase)
# ---------------------------------------------------------------------------

async def node_generate_report(state: AgentRXState):
    """
    Calls the ReportGeneratorAgent with the full pipeline state.
    Injects the thread_id via a workaround (stored in narrative during pipeline start).
    """
    # thread_id is passed through the narrative dict by the MasterAgent at pipeline boot
    thread_id = state.get("narrative", {}).get("__thread_id__", "no-thread-id")
    tid = thread_id
    telemetry.emit(tid, "Report Generator Agent", "running",
                   "Synthesising executive summary and rendering PDF...")

    # Build input for the report agent — include ALL state keys needed by the PDF builder
    report_input = {
        "molecule": state.get("molecule", "Unknown"),
        "synonyms": state.get("synonyms", ""),
        "thread_id": thread_id,
        "narrative": {k: v for k, v in state.get("narrative", {}).items()
                      if not k.startswith("__")},
        # ip_cleared carries the fto_status + citations for cleared candidates
        "ip_cleared_diseases": state.get("ip_cleared_diseases", []),
        # merged_diseases carries ALL candidates (including blocked) with their citations
        "merged_diseases": state.get("merged_diseases", []),
        "commercial_data": state.get("commercial_data", []),
        "supply_chain_data": state.get("supply_chain_data", {}),
    }

    result = await report_agent.execute_with_retries(report_input)

    report_urls = result.get("report_urls", {})
    telemetry.emit(tid, "Report Generator Agent", "completed",
                   f"PDF report saved → {report_urls.get('download_path', 'N/A')}")

    return {
        "narrative": result.get("narrative", {}),
        "report_urls": report_urls,
    }

# ---------------------------------------------------------------------------
# Build the LangGraph StateGraph Blueprint
# ---------------------------------------------------------------------------

workflow = StateGraph(AgentRXState)

# Register nodes
workflow.add_node("pharmacodynamic_mapping",      node_web_discovery)
workflow.add_node("merge_data",                   node_merge_data)
workflow.add_node("ip_whitespace_clearance",      node_patent_check)
workflow.add_node("commercial_viability_screening", node_commercial_filter)
workflow.add_node("iqvia_exim_analysis",          node_supply_chain_analysis)
workflow.add_node("generate_report",              node_generate_report)

# Wire up the edges (strict sequential M2M pipeline)
workflow.add_edge(START,                           "pharmacodynamic_mapping")
workflow.add_edge("pharmacodynamic_mapping",       "merge_data")
workflow.add_edge("merge_data",                    "ip_whitespace_clearance")
workflow.add_edge("ip_whitespace_clearance",       "commercial_viability_screening")
workflow.add_edge("commercial_viability_screening","iqvia_exim_analysis")
workflow.add_edge("iqvia_exim_analysis",           "generate_report")
workflow.add_edge("generate_report",               END)

# Export the uncompiled builder — checkpointer is injected at runtime by MasterAgent
m2m_builder = workflow