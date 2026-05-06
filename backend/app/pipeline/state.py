from typing import TypedDict, List, Dict, Any

class AgentRXState(TypedDict): 
    
    molecule: str 
    job_status: str 
    
    # Phase 1: Parallel Discovery 
    diseases_bio: List[Dict[str, Any]] 
    diseases_internal: List[Dict[str, Any]] 
    diseases_clinical: List[Dict[str, Any]] 
    merged_diseases: List[Dict[str, Any]] 
    
    # Phase 2 & 3: Legal & Commercial Filters 
    ip_cleared_diseases: List[Dict[str, Any]] 
    approved_diseases: List[Dict[str, Any]] 
    commercial_data: List[Dict[str, Any]] 
    
    # Phase 4: Final Output 
    narrative: Dict[str, Any] 
    report_urls: Dict[str, str] 