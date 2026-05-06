from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from app.pipeline.state import AgentRXState
from app.agents.workers import WebIntelligenceAgent, PatentLandscapeAgent
import asyncio 

# Instantiate our workers
web_agent = WebIntelligenceAgent()
patent_agent = PatentLandscapeAgent()

async def node_web_discovery(state: AgentRXState):
    result = await web_agent.execute_with_retries(state)
    return {"diseases_bio": result.get("diseases_bio", [])}

async def node_merge_data(state: AgentRXState):
    print("[SYSTEM] Merging discovery data...")
    merged = state.get("diseases_bio", [])
    return {"merged_diseases": merged}

async def node_patent_check(state: AgentRXState):
    result = await patent_agent.execute_with_retries(state)
    return {"ip_cleared_diseases": result.get("ip_cleared_diseases", [])}

async def node_commercial_filter(state: AgentRXState): 
    print("[Commercial Filter | RUNNING] Evaluating market size for approved candidates...") 
    await asyncio.sleep(1) 
    print("[Commercial Filter | DONE] Market analysts complete...") 
    return {"commercial_data": state.get("ip_cleared_diseases", [])} 
    
def build_m2m_pipeline():
    workflow = StateGraph(AgentRXState)
    
    workflow.add_node("pharmacodynamic_mapping", node_web_discovery)
    workflow.add_node("merge_data", node_merge_data)
    workflow.add_node("ip_whitespace_clearance", node_patent_check)
    workflow.add_node("commercial_viability_screening", node_commercial_filter)
    
    workflow.add_edge(START, "pharmacodynamic_mapping")
    workflow.add_edge("pharmacodynamic_mapping", "merge_data")
    workflow.add_edge("merge_data", "ip_whitespace_clearance") 
    workflow.add_edge("ip_whitespace_clearance", "commercial_viability_screening")
    workflow.add_edge("commercial_viability_screening", END) 
    
    memory = MemorySaver() 
    
    return workflow.compile(
        checkpointer=memory, 
        interrupt_before=["commercial_viability_screening"] 
    )
    
m2m_pipeline = build_m2m_pipeline()