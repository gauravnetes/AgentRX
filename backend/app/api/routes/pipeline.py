from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid

from app.pipeline.graph import m2m_pipeline

router = APIRouter()

class StartRequest(BaseModel):
    molecule: str

class ResumeRequest(BaseModel):
    thread_id: str

@router.post("/start")
async def start_pipeline(req: StartRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    initial_state = {"molecule": req.molecule}
    
    print(f"\n[API] Starting pipeline for {req.molecule} (Thread: {thread_id})")
    
    # Run the graph until the breakpoint
    await m2m_pipeline.ainvoke(initial_state, config)
    
    # Check the state to confirm it paused correctly
    state_snapshot = m2m_pipeline.get_state(config)
    
    if state_snapshot.next and 'commercial_viability_screening' in state_snapshot.next:
        pending_candidates = state_snapshot.values.get("ip_cleared_diseases", [])
        return {
            "status": "PAUSED_FOR_HUMAN",
            "thread_id": thread_id,
            "message": "Awaiting human approval for IP-cleared candidates.",
            "pending_candidates": pending_candidates
        }
    
    raise HTTPException(status_code=500, detail="Pipeline failed to pause at the correct node.")


@router.post("/resume")
async def resume_pipeline(req: ResumeRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    
    print(f"\n[API] Resuming pipeline for Thread: {req.thread_id}")
    
    # Verify this thread actually exists and is waiting
    state_snapshot = m2m_pipeline.get_state(config)
    if not state_snapshot.next:
        raise HTTPException(status_code=400, detail="No paused pipeline found for this thread ID.")
        
    # Resume the graph by passing None
    final_state = await m2m_pipeline.ainvoke(None, config)
    
    approved_candidates = final_state.get("commercial_data", [])
    return {
        "status": "COMPLETED",
        "message": "Pipeline finished successfully.",
        "final_candidates": approved_candidates
    }