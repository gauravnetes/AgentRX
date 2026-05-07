import asyncio
import httpx
import json 

from app.core.config import settings

from typing import Dict, Any, List 
from app.agents.base import BaseAgent 

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field 

class DiseaseCandidate(BaseModel): 
    disease_name: str = Field(description="Name of the alternative disease or indication.")
    pathway_overlap_score: float = Field(description="A score between 0.0 and 1.0 representing the biological pathway overlap based on the literature.")
    reasoning: str = Field(description="A brief 1-sentence explanation of the biological mechanism connecting the molecule to this disease based on the literature.")
    citations: List[str] = Field(description="Exact citations from the provided literature supporting this connection.")

class LLMDiscoveryOutput(BaseModel): 
    candidates: List[DiseaseCandidate] 
    

class WebIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__("Web Intelligence", "Pharmacodynamic Analyst", 0.0)
        
        # Initialize the Free Gemini Model 
        # (gemini-1.5-flash is blazingly fast and perfect for JSON extraction)
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0.1, 
            api_key=settings.GOOGLE_API_KEY
        )
        
        # Force the LLM to output our Pydantic schema
        self.structured_llm = self.llm.with_structured_output(LLMDiscoveryOutput)

    async def _run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        molecule = input_data.get("molecule", "Metformin")
        self.log_status("running", f"Connecting to live PubMed API for {molecule}...")
        
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": f"{molecule}[Title/Abstract] AND (mechanism of action OR pathway)",
            "retmode": "json",
            "retmax": 5 # Fetching 5 papers for Gemini to read
        }
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            search_res = await client.get(search_url, params=search_params)
            search_res.raise_for_status()
            search_data = search_res.json()
            
            id_list = search_data.get("esearchresult", {}).get("idlist", [])
            
            if not id_list:
                self.log_status("warning", f"No live PubMed results found for {molecule}.")
                return {"diseases_bio": []}

            self.log_status("running", f"Found {len(id_list)} live papers. Fetching metadata...")
            
            summary_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
            summary_params = {
                "db": "pubmed",
                "id": ",".join(id_list),
                "retmode": "json"
            }
            
            summary_res = await client.get(summary_url, params=summary_params)
            summary_res.raise_for_status()
            summary_data = summary_res.json().get("result", {})
            
        # --- 2. Compile the literature context for the LLM ---
        literature_context = ""
        for uid in id_list:
            paper = summary_data.get(uid, {})
            title = paper.get("title", "Unknown Title")
            literature_context += f"- PMID:{uid} : {title}\n"
            
        self.log_status("running", "AI reasoning over fetched literature to calculate pathway overlap...")
        
        # --- 3. Prompt the LLM to do the heavy lifting ---
        prompt = f"""
        You are an expert computational biologist.
        Target Molecule: {molecule}

        Recent PubMed Literature:
        {literature_context}

        Based on the literature above and your parametric knowledge, identify 2 to 3 alternative diseases (excluding the primary indication) where {molecule} could potentially be repurposed.
        For each disease:
        1. Provide a realistic pathway overlap score (0.0 to 1.0).
        2. Map the exact provided citations to the disease.
        """
        
        try:
            # Send the prompt to Gemini and wait for the validated Pydantic object
            llm_result = await self.structured_llm.ainvoke(prompt)
            
            # Convert the Pydantic objects back into standard dictionaries for LangGraph
            final_diseases = [candidate.model_dump() for candidate in llm_result.candidates]
            
            self.log_status("done", f"AI extracted {len(final_diseases)} candidates dynamically.")
            return {"diseases_bio": final_diseases}
            
        except Exception as e:
            self.log_status("error", f"AI parsing failed: {str(e)}")
            raise e

class PatentLandscapeAgent(BaseAgent):
    def __init__(self):
        super().__init__("Patent Landscape", "Intellectual Property Analyst", 0.0)

    async def _run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        candidates = input_data.get("merged_diseases", [])
        molecule = input_data.get("molecule", "Metformin")
        
        self.log_status("running", f"Checking Europe PMC (Biological Patents) for {len(candidates)} indications...")
        cleared_diseases = []
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            for candidate in candidates:
                disease = candidate["disease_name"]
                self.log_status("running", f"Scanning global patent landscape for {molecule} + {disease}...")
                
                # The official Europe PMC REST API
                url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
                
                # SRC:PAT limits the search strictly to Biological Patents
                query = f'SRC:PAT AND "{molecule}" AND "{disease}"'
                
                params = {
                    "query": query,
                    "format": "json",
                    "resultType": "lite"
                }
                
                try:
                    res = await client.get(url, params=params, timeout=10.0)
                    
                    if res.status_code == 200:
                        data = res.json()
                        # hitCount tells us exactly how many patents match
                        count = data.get("hitCount", 0)
                        
                        if count > 0:
                            self.log_status("blocked", f"Found {count} biological patents for {disease}. FTO blocked.")
                            candidate["fto_status"] = "BLOCKED"
                            candidate["blocking_patents"] = count
                        else:
                            self.log_status("clear", f"No biological patents found for {disease}. IP space is clear.")
                            candidate["fto_status"] = "CLEAR"
                            cleared_diseases.append(candidate)
                    else:
                        self.log_status("error", f"Patent API returned {res.status_code}. Defaulting to CLEAR.")
                        candidate["fto_status"] = "CLEAR"
                        cleared_diseases.append(candidate)
                        
                except Exception as e:
                    self.log_status("error", f"Patent API timeout. Defaulting to CLEAR.")
                    candidate["fto_status"] = "CLEAR"
                    cleared_diseases.append(candidate)
                    
                # A 0.5s pause is polite for free institutional APIs
                await asyncio.sleep(0.5)
                
        return {"ip_cleared_diseases": cleared_diseases}  
    