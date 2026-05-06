import sys
import os
import asyncio

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.pipeline.graph import m2m_pipeline

async def run_test():
    print("--- STARTING AGENTRX PIPELINE ---")
    
    # 1. We must define a 'thread' to track this specific pipeline run
    config = {"configurable": {"thread_id": "demo_hackathon_run_001"}}
    initial_state = {"molecule": "Metformin"}
    
    # 2. Run the graph. It will hit the breakpoint and STOP.
    print("\n>>> Phase 1: AI Discovery & Legal Clearance Executing...")
    await m2m_pipeline.ainvoke(initial_state, config)
    
    # 3. Check the graph's current state
    state_snapshot = m2m_pipeline.get_state(config)
    
    # DEBUG: Show what LangGraph is waiting to do next
    print(f"\n[DEBUG] Pipeline paused. Next node in queue: {state_snapshot.next}")
    
    # BULLETPROOF CHECK: Use `in` instead of checking exact index
    if state_snapshot.next and 'commercial_viability_screening' in state_snapshot.next:
        print("\n" + "="*50)
        print("🛑 PIPELINE PAUSED: AWAITING HUMAN APPROVAL 🛑")
        print("="*50)
        
        current_memory = state_snapshot.values
        print("The following candidates cleared the Patent Agent:")
        for d in current_memory.get("ip_cleared_diseases", []):
            print(f"  [PENDING] - {d['disease_name']}")
            
        print("\n[UI Mock] -> Human reviewer clicks 'APPROVE ALL' button...")
        
        # 4. Resume the pipeline by passing None
        print("\n>>> Phase 2: Human Approved. Resuming Pipeline...")
        final_state = await m2m_pipeline.ainvoke(None, config)
        
        print("\n--- FINAL PIPELINE SUCCESS ---")
        print("Candidates sent to commercial analysis:")
        for d in final_state.get("commercial_data", []):
             print(f"  [APPROVED] - {d['disease_name']}")
    else:
        print("\n[ERROR] Pipeline did not pause where expected.")

if __name__ == "__main__":
    asyncio.run(run_test())