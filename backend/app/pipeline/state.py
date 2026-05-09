from typing import TypedDict, Annotated, List, Dict, Any
import operator

class AgentRXState(TypedDict):
    molecule: str
    synonyms: str
    job_status: str

    literature_review: str
    pharmacology_data: Dict[str, Any]

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

    # Incremental narrative — populated by each node as it completes.
    # Keys: "discovery", "ip_analysis", "commercial", "supply_chain", "executive_summary"
    # The merge reducer (operator.or_) deep-merges dicts so each stage can add its own key
    # without overwriting the others, even across checkpoint boundaries.
    narrative: Annotated[Dict[str, str], lambda a, b: {**a, **b}]

    # Final output — populated by the Report Generator node
    report_urls: Dict[str, str]