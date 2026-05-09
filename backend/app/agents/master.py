"""
master.py — AgentRX Master Agent

The MasterAgent is the command-center for the M2M pipeline. It is NOT an LLM;
it is a stateful orchestration controller that:
  1. Compiles the LangGraph pipeline with a SQLite checkpoint saver.
  2. Dispatches worker agents in the correct order.
  3. Publishes structured telemetry events to a local in-process event log
     (and optionally to Redis pub/sub for future SSE streaming).
  4. Exposes clean `start_pipeline()` and `resume_pipeline()` methods so API
     route handlers never touch LangGraph internals directly.
"""

import asyncio
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from sqlalchemy import select

from app.pipeline.graph import m2m_builder
from app.agents.telemetry import telemetry
from app.core.db import AsyncSessionLocal
from app.models.report import Report

logger = logging.getLogger(__name__)





# ---------------------------------------------------------------------------
# MasterAgent
# ---------------------------------------------------------------------------

SQLITE_DB = "agentrx.db"
INTERRUPT_BEFORE = ["commercial_viability_screening"]

PIPELINE_STAGES = [
    {
        "node": "pharmacodynamic_mapping",
        "agent": "Web Intelligence Agent",
        "description": "PubMed literature scan + pathway overlap analysis",
    },
    {
        "node": "merge_data",
        "agent": "Data Fusion Engine",
        "description": "Merging discovery results",
    },
    {
        "node": "ip_whitespace_clearance",
        "agent": "Patent Landscape Agent",
        "description": "Europe PMC FTO clearance scan",
    },
    {
        "node": "commercial_viability_screening",
        "agent": "Commercial Viability Agent",
        "description": "TAM, competitor, and trial complexity analysis",
    },
    {
        "node": "iqvia_exim_analysis",
        "agent": "IQVIA Supply Chain Agent",
        "description": "Global EXIM trade risk analysis",
    },
    {
        "node": "generate_report",
        "agent": "Report Generator Agent",
        "description": "Compiling intelligence into structured PDF report",
    },
]


class MasterAgent:
    """
    Orchestration controller for the AgentRX M2M pipeline.

    Usage:
        master = MasterAgent()

        # Phase 1 — runs until commercial_viability_screening interrupt
        result = await master.start_pipeline(molecule="Metformin", thread_id="abc-123")

        # Phase 2 — resumes from checkpoint after human approval
        result = await master.resume_pipeline(thread_id="abc-123")
    """

    def __init__(self):
        self.db_path = SQLITE_DB
        self.interrupt_before = INTERRUPT_BEFORE

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _build_pipeline(self, memory):
        """Compile the LangGraph state machine with a checkpointer."""
        return m2m_builder.compile(
            checkpointer=memory,
            interrupt_before=self.interrupt_before,
        )

    def _config(self, thread_id: str) -> Dict[str, Any]:
        return {"configurable": {"thread_id": thread_id}}

    def _announce_stages(self, thread_id: str):
        """Emit telemetry for all stages at pipeline boot so the frontend can render the DAG."""
        for stage in PIPELINE_STAGES:
            telemetry.emit(
                thread_id=thread_id,
                agent=stage["agent"],
                status="queued",
                message=stage["description"],
            )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def start_pipeline(
        self,
        molecule: str,
        thread_id: str,
    ) -> Dict[str, Any]:
        """
        Start the M2M pipeline for a molecule.

        Runs phases 1–3 (pharmacodynamic_mapping → ip_whitespace_clearance)
        then PAUSES before commercial_viability_screening awaiting human approval.

        Returns a dict with status=PAUSED_FOR_HUMAN and pending_candidates.
        """
        config = self._config(thread_id)
        initial_state = {
            "molecule": molecule,
            # Seed the narrative with __thread_id__ so the generate_report node
            # can construct the correct output file path without needing LangGraph config access.
            "narrative": {"__thread_id__": thread_id},
            "report_urls": {},
        }

        # Initialize DB Record
        async with AsyncSessionLocal() as session:
            new_report = Report(
                id=thread_id,
                thread_id=thread_id,
                molecule=molecule,
                status="RUNNING"
            )
            session.add(new_report)
            await session.commit()

        telemetry.emit(thread_id, "MasterAgent", "dispatching",
                       f"Pipeline started for molecule: {molecule}")
        self._announce_stages(thread_id)

        start_time = time.monotonic()

        async with AsyncSqliteSaver.from_conn_string(self.db_path) as memory:
            pipeline = self._build_pipeline(memory)

            # --- Dispatch Phase 1 ---
            telemetry.emit(thread_id, "Web Intelligence Agent", "dispatching",
                           "Connecting to PubMed Entrez API...")
            await pipeline.ainvoke(initial_state, config)

            state_snapshot = await pipeline.aget_state(config)

        elapsed = time.monotonic() - start_time

        if state_snapshot.next and "commercial_viability_screening" in state_snapshot.next:
            pending = state_snapshot.values.get("ip_cleared_diseases", [])
            narrative_so_far = state_snapshot.values.get("narrative", {})

            # Update DB
            async with AsyncSessionLocal() as session:
                db_report = await session.get(Report, thread_id)
                if db_report:
                    db_report.status = "PAUSED_FOR_HUMAN"
                    await session.commit()

            telemetry.emit(thread_id, "MasterAgent", "paused",
                           f"Pipeline paused at human checkpoint. {len(pending)} candidates awaiting approval.")

            return {
                "status": "PAUSED_FOR_HUMAN",
                "thread_id": thread_id,
                "message": "IP clearance complete. Awaiting human approval before commercial analysis.",
                "pending_candidates": pending,
                "stage_narratives": narrative_so_far,
                "elapsed_seconds": round(elapsed, 2),
                "telemetry": telemetry.get_events(thread_id),
            }

        raise RuntimeError("Pipeline failed to pause at commercial_viability_screening.")

    async def resume_pipeline(self, thread_id: str) -> Dict[str, Any]:
        """
        Resume a paused pipeline after human approval.

        Runs phases 4–6 (commercial_viability_screening → iqvia_exim_analysis → generate_report).
        Returns status=COMPLETED with final_candidates, supply_chain_data, report_urls, and full narrative.
        """
        config = self._config(thread_id)

        # Update DB Status
        async with AsyncSessionLocal() as session:
            db_report = await session.get(Report, thread_id)
            if db_report:
                db_report.status = "RUNNING"
                await session.commit()

        telemetry.emit(thread_id, "MasterAgent", "resuming",
                       "Human approval received. Resuming pipeline for Phase 2...")

        start_time = time.monotonic()

        async with AsyncSqliteSaver.from_conn_string(self.db_path) as memory:
            pipeline = self._build_pipeline(memory)

            state_snapshot = await pipeline.aget_state(config)
            if not state_snapshot.next:
                raise ValueError(f"No paused pipeline found for thread_id={thread_id}")

            telemetry.emit(thread_id, "Commercial Viability Agent", "dispatching",
                           "Launching VC-grade commercial analysis...")

            final_state = await pipeline.ainvoke(None, config)

        elapsed = time.monotonic() - start_time

        report_urls = final_state.get("report_urls", {})
        narrative = final_state.get("narrative", {})
        final_candidates = final_state.get("commercial_data", [])
        supply_chain = final_state.get("supply_chain_data", {})

        insights = {
            "tam": max((float("".join(c for c in str(cand.get("tam_estimate", "0")) if c.isdigit() or c == ".") or "0") for cand in final_candidates), default=0.0) if final_candidates else 0.0,
            "clinical_viability": "High" if final_candidates else "Low",
            "patent_freedom": "Clear" if final_candidates else "Blocked",
            "repurposing_score": supply_chain.get("repurposing_score", 0.0),
            "final_candidates": final_candidates
        }

        # Update DB Record
        async with AsyncSessionLocal() as session:
            db_report = await session.get(Report, thread_id)
            if db_report:
                db_report.status = "COMPLETED"
                db_report.insights = insights
                db_report.pdf_path = report_urls.get("local")
                await session.commit()

        telemetry.emit(thread_id, "MasterAgent", "completed",
                       f"Pipeline completed in {elapsed:.1f}s. Report generation done.")

        return {
            "status": "COMPLETED",
            "thread_id": thread_id,
            "message": "M2M pipeline finished. Report generated.",
            "molecule": final_state.get("molecule"),
            "final_candidates": final_state.get("commercial_data", []),
            "supply_chain": final_state.get("supply_chain_data", {}),
            "narrative": narrative,
            "report_urls": report_urls,
            "elapsed_seconds": round(elapsed, 2),
            "telemetry": telemetry.get_events(thread_id),
        }

    async def get_pipeline_state(self, thread_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve the current state snapshot for a thread (for polling / debugging)."""
        config = self._config(thread_id)
        async with AsyncSqliteSaver.from_conn_string(self.db_path) as memory:
            pipeline = self._build_pipeline(memory)
            snapshot = await pipeline.aget_state(config)
        if not snapshot:
            return None
        return {
            "next_nodes": list(snapshot.next),
            "values": snapshot.values,
            "telemetry": telemetry.get_events(thread_id),
        }
