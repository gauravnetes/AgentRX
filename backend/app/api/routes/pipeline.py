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

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import json
import asyncio

from app.agents.master import MasterAgent
from app.agents.telemetry import telemetry

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
# Input Validation
# ---------------------------------------------------------------------------

class MoleculeValidator:
    """
    Validates that the submitted string looks like a real pharmaceutical
    molecule / drug name before we spend 60+ seconds running the pipeline.
    """
    import re as _re
    LEGAL_CHARS_RE = _re.compile(r"^[A-Za-z0-9\s\-\(\)\.,/]+$")
    BLACKLIST = {
        "test", "hello", "world", "asdf", "qwerty", "foo", "bar", "baz",
        "null", "none", "undefined", "n/a", "na", "drug", "molecule",
        "compound", "substance", "chemical", "medicine", "pill",
    }
    MIN_LEN = 3
    MAX_LEN = 120

    @classmethod
    async def validate(cls, molecule: str):
        import re
        name = molecule.strip()
        if len(name) < cls.MIN_LEN:
            return False, f"Molecule name is too short (minimum {cls.MIN_LEN} characters).", name
        if len(name) > cls.MAX_LEN:
            return False, f"Molecule name is too long (maximum {cls.MAX_LEN} characters).", name
        if not cls.LEGAL_CHARS_RE.match(name):
            return False, "Molecule name contains invalid characters. Only letters, digits, hyphens, spaces, and parentheses are allowed.", name
        if re.match(r"^\d+$", name):
            return False, "Molecule name cannot be a plain number.", name
        if name.lower() in cls.BLACKLIST:
            return False, f"'{name}' is not a recognised pharmaceutical molecule name.", name
        if not re.search(r"[A-Za-z]", name):
            return False, "Molecule name must contain at least one letter.", name
            
        # --- LLM Semantic Gatekeeper & Spellchecker ---
        try:
            import os
            import json
            from langchain_openai import ChatOpenAI
            
            llm = ChatOpenAI(
                api_key=os.getenv("OPENROUTER_API_KEY"),
                base_url="https://openrouter.ai/api/v1",
                model="openai/gpt-4o-mini",
                temperature=0.0
            )
            
            prompt = f"""
            You are a strict pharmacological security gatekeeper.
            Analyze the user input: "{name}"
            
            RULES:
            1. Is this a real biological molecule, drug, active pharmaceutical ingredient (API), or chemical compound?
            2. "Aspirin", "Phenol", "Vitamin C", "Tylenol" = TRUE.
            3. "iPhone 12", "Car", "Laptop", "Hello", "test" = FALSE.
            4. If it's a valid drug but misspelled (e.g. "coocaine"), automatically correct it (e.g. "cocaine").
            
            Return ONLY valid JSON format:
            {{
                "is_valid": true or false,
                "corrected_name": "the corrected scientific name, or the original if correct. If invalid, leave empty.",
                "reason": "Brief reason why it was rejected or accepted"
            }}
            """
            
            response = await llm.ainvoke(prompt)
            json_match = re.search(r'\{.*\}', response.content, re.DOTALL)
            data = json.loads(json_match.group(0)) if json_match else json.loads(response.content)
            
            if not data.get("is_valid", False):
                return False, data.get("reason", "Rejected by AI semantic filter: Not a recognised drug or chemical."), name
                
            return True, "", data.get("corrected_name", name)
            
        except Exception as e:
            # Fallback to true if LLM fails (to prevent pipeline from breaking completely)
            print(f"[MoleculeValidator] LLM Gatekeeper failed, falling back to regex pass: {e}")
            return True, "", name


# ---------------------------------------------------------------------------
# POST /start — Launch the pipeline (Phase 1: Discovery + IP Clearance)
# ---------------------------------------------------------------------------

@router.post("/start", status_code=202)
async def start_pipeline(req: StartRequest, background_tasks: BackgroundTasks):
    """
    Start the M2M pipeline for a target molecule in the background.
    Returns 202 Accepted with a thread_id for SSE streaming.
    """
    # --- Gate: Validate molecule name before launching any background work ---
    is_valid, reason, corrected_name = await MoleculeValidator.validate(req.molecule)
    if not is_valid:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "INVALID_MOLECULE",
                "message": reason,
                "submitted_value": req.molecule,
            }
        )

    thread_id = str(uuid.uuid4())

    try:
        background_tasks.add_task(master.start_pipeline, molecule=corrected_name.strip(), thread_id=thread_id)
        return {
            "status": "ACCEPTED",
            "thread_id": thread_id,
            "message": "Pipeline initialization started in the background."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start pipeline: {str(e)}"
        )


# ---------------------------------------------------------------------------
# POST /resume — Resume after human approval (Phase 2: Commercial + Supply Chain + Report)
# ---------------------------------------------------------------------------

@router.post("/resume", status_code=202)
async def resume_pipeline(req: ResumeRequest, background_tasks: BackgroundTasks):
    """
    Resume a paused pipeline after human approval in the background.
    Returns 202 Accepted. Connect to SSE stream to watch progress.
    """
    try:
        background_tasks.add_task(master.resume_pipeline, thread_id=req.thread_id)
        return {
            "status": "ACCEPTED",
            "thread_id": req.thread_id,
            "message": "Pipeline resumption started in the background."
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resume pipeline: {str(e)}"
        )

# ---------------------------------------------------------------------------
# GET /stream — Server-Sent Events (SSE) for Real-Time UI
# ---------------------------------------------------------------------------

@router.get("/stream/{thread_id}")
async def stream_telemetry(thread_id: str):
    """
    Server-Sent Events endpoint.
    Frontend connects here via EventSource to receive live pipeline logs and status changes.
    """
    async def event_generator():
        q = telemetry.subscribe(thread_id)
        try:
            # Yield historical events first to catch UI up
            history = telemetry.get_events(thread_id)
            for evt in history:
                yield f"data: {json.dumps(evt)}\n\n"
            
            while True:
                # Wait for new live events
                event = await q.get()
                yield f"data: {json.dumps(event)}\n\n"
                
                # Close stream automatically when pipeline finishes a phase
                if event["agent"] == "MasterAgent" and event["status"] in ["paused", "completed", "failed"]:
                    await asyncio.sleep(0.5) # Allow final logs to flush
                    break
        finally:
            telemetry.unsubscribe(thread_id, q)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


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