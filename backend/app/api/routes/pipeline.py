from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid

from app.pipeline.graph import m2m_builder 
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver 
from app.pipeline.graph import m2m_builder

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
    
    # Open the async DB connection just for this specific request
    async with AsyncSqliteSaver.from_conn_string("agentrx.db") as memory:
        # Compile the graph dynamically on the fly
        m2m_pipeline = m2m_builder.compile(
            checkpointer=memory,
            interrupt_before=["commercial_viability_screening"]
        )
        
        # Run the pipeline
        await m2m_pipeline.ainvoke(initial_state, config)
        state_snapshot = await m2m_pipeline.aget_state(config)
        
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
    
    # Open the async DB connection again to retrieve the paused state
    async with AsyncSqliteSaver.from_conn_string("agentrx.db") as memory:
        m2m_pipeline = m2m_builder.compile(
            checkpointer=memory,
            interrupt_before=["commercial_viability_screening"]
        )
        
        # Verify this thread actually exists in the SQLite database and is waiting
        state_snapshot = await m2m_pipeline.aget_state(config)
        if not state_snapshot.next:
            raise HTTPException(status_code=400, detail="No paused pipeline found for this thread ID.")
            
        # Resume execution
        final_state = await m2m_pipeline.ainvoke(None, config)
        
        approved_candidates = final_state.get("commercial_data", [])
        supply_chain = final_state.get("supply_chain_data", {})
        
        return {
            "status": "COMPLETED",
            "message": "Pipeline finished successfully.",
            "molecule": final_state.get("molecule"), 
            "iqvia_exim_analysis": supply_chain,
            "final_candidates": approved_candidates
        }