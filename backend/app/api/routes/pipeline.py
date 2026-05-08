"""
pipeline.py — AgentRX Pipeline API Routes

All pipeline control flows through the MasterAgent which encapsulates
LangGraph compilation, checkpointing, and telemetry — the route handlers
are kept thin and only deal with HTTP concerns.

Endpoints:
  POST /api/pipeline/start         — Launch the M2M pipeline for a molecule
  POST /api/pipeline/resume        — Resume after human approval checkpoint
  GET  /api/pipeline/status/{tid}  — Poll current state + telemetry
  GET  /api/pipeline/report/{tid}  — Download the generated PDF report
"""

import uuid
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.agents.master import MasterAgent

router = APIRouter()

# Singleton MasterAgent — safe to share across async requests
master = MasterAgent()


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class StartRequest(BaseModel):
    molecule: str

class ResumeRequest(BaseModel):
    thread_id: str


# ---------------------------------------------------------------------------
# POST /start — Launch the pipeline (Phase 1: Discovery + IP Clearance)
# ---------------------------------------------------------------------------

@router.post("/start")
async def start_pipeline(req: StartRequest):
    """
    Start the M2M pipeline for a target molecule.

    Runs:
      1. Web Intelligence Agent (PubMed discovery)
      2. Data Merge
      3. Patent Landscape Agent (FTO clearance)

    Then PAUSES and waits for human approval before commercial analysis.

    Returns:
      - status: PAUSED_FOR_HUMAN
      - thread_id: use this to resume
      - pending_candidates: IP-cleared indications awaiting approval
      - stage_narratives: per-stage text summaries generated so far
      - telemetry: agent event log
    """
    thread_id = str(uuid.uuid4())

    try:
        result = await master.start_pipeline(
            molecule=req.molecule,
            thread_id=thread_id,
        )
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline failed during Phase 1: {str(e)}"
        )


# ---------------------------------------------------------------------------
# POST /resume — Resume after human approval (Phase 2: Commercial + Supply Chain + Report)
# ---------------------------------------------------------------------------

@router.post("/resume")
async def resume_pipeline(req: ResumeRequest):
    """
    Resume a paused pipeline after human approval of IP-cleared candidates.

    Runs:
      4. Commercial Viability Agent (TAM, trials, competitors)
      5. IQVIA Supply Chain Agent (EXIM trade data)
      6. Report Generator Agent (Gemini executive summary + ReportLab PDF)

    Returns:
      - status: COMPLETED
      - final_candidates: commercially analysed candidates
      - supply_chain: IQVIA/EXIM supply chain data
      - narrative: full per-stage narrative dict
      - report_urls: {"local": "/abs/path.pdf", "download_path": "/api/pipeline/report/<id>"}
      - telemetry: full agent event log
    """
    try:
        result = await master.resume_pipeline(thread_id=req.thread_id)
        return result

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline failed during Phase 2: {str(e)}"
        )


# ---------------------------------------------------------------------------
# GET /status/{thread_id} — Poll current pipeline state
# ---------------------------------------------------------------------------

@router.get("/status/{thread_id}")
async def get_pipeline_status(thread_id: str):
    """
    Returns the current LangGraph state snapshot and telemetry events
    for a given thread_id. Useful for frontend polling.
    """
    try:
        state = await master.get_pipeline_state(thread_id)
        if state is None:
            raise HTTPException(status_code=404, detail="Thread not found.")
        return state
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /report/{thread_id} — Download the generated PDF report
# ---------------------------------------------------------------------------

@router.get("/report/{thread_id}")
async def download_report(thread_id: str):
    """
    Download the generated PDF intelligence report for a completed pipeline run.

    Returns the PDF as a file attachment.
    """
    reports_dir = Path(__file__).parent.parent.parent.parent / "reports"
    pdf_path = reports_dir / f"{thread_id}.pdf"

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"No report found for thread_id={thread_id}. "
                   f"Ensure the pipeline has completed successfully."
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=f"AgentRX_Report_{thread_id[:8]}.pdf",
    )