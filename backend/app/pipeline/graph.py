from langgraph.graph import StateGraph, START, END
from app.pipeline.state import AgentRXState
from app.agents.workers import WebIntelligenceAgent, PatentLandscapeAgent, CommercialViabilityAgent, IQVIASupplyChainAgent
import asyncio 

# Instantiate our workers
web_agent = WebIntelligenceAgent()
patent_agent = PatentLandscapeAgent()
commercial_agent = CommercialViabilityAgent()
iqvia_agent = IQVIASupplyChainAgent()

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
    res = await commercial_agent.execute_with_retries(state) 
    return {"commercial_data": res.get("commercial_data", [])} 

async def node_supply_chain_analysis(state: AgentRXState): 
    print("[IQVIA Integration | RUNNING] Evaluating global EXIM datasets") 
    res = await iqvia_agent.execute_with_retries(state) 
    return {"supply_chain_data": res.get("supply_chain_data", {})}

# Build the blueprint
workflow = StateGraph(AgentRXState)

workflow.add_node("pharmacodynamic_mapping", node_web_discovery)
workflow.add_node("merge_data", node_merge_data)
workflow.add_node("ip_whitespace_clearance", node_patent_check)
workflow.add_node("commercial_viability_screening", node_commercial_filter)
workflow.add_node("iqvia_exim_analysis", node_supply_chain_analysis)

workflow.add_edge(START, "pharmacodynamic_mapping")
workflow.add_edge("pharmacodynamic_mapping", "merge_data")
workflow.add_edge("merge_data", "ip_whitespace_clearance") 
workflow.add_edge("ip_whitespace_clearance", "commercial_viability_screening")
workflow.add_edge("commercial_viability_screening", "iqvia_exim_analysis")
workflow.add_edge("iqvia_exim_analysis", END) 

# Export the uncompiled builder (NO database checkpointer here!)
m2m_builder = workflow