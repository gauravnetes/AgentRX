from typing import TypedDict, Annotated, List, Dict, Any
import operator

class AgentRXState(TypedDict): 
    molecule: str 
    job_status: str 
    
    # Phase 1: Parallel Discovery 
    # Using operator.add ensures that if multiple agents return items, 
    # they are appended to the list rather than overwriting it.
    diseases_bio: Annotated[List[Dict[str, Any]], operator.add] 
    diseases_internal: Annotated[List[Dict[str, Any]], operator.add] 
    diseases_clinical: Annotated[List[Dict[str, Any]], operator.add] 
    
    # These can remain standard lists since they are generated 
    # by single, sequential nodes that overwrite the previous step's data.
    merged_diseases: List[Dict[str, Any]] 
    
    # Phase 2 & 3: Legal & Commercial Filters 
    ip_cleared_diseases: List[Dict[str, Any]] 
    approved_diseases: List[Dict[str, Any]] 
    commercial_data: List[Dict[str, Any]]
    
    # Supply Chain Phase 
    supply_chain_data: dict 
    
    # Phase 4: Final Output 
    narrative: Dict[str, Any] 
    report_urls: Dict[str, str]