import asyncio
import httpx
import json 
import pandas as pd 
import os 
import yfinance as yf 
import re 
from app.core.config import settings
from langchain_openai import ChatOpenAI

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
    
    
class SupplyChainOutput(BaseModel):
    api_availability: str = Field(description="High, Medium, or Low availability of the raw API based on EXIM volumes.")
    top_exporting_countries: List[str] = Field(description="Top 3 net exporting countries based on the EXIM Country Matrix.")
    supply_chain_risk: str = Field(description="Assessment of supply chain vulnerability.")
    repurposing_score: float = Field(description="The exact Repurposing Opportunity Score from the IQVIA Drug Profile.")
    market_trend: str = Field(description="Brief summary of YoY growth, revenue, and market share from IQVIA Sales.")
    clinical_pipeline_status: str = Field(description="Brief summary of active trials and phases from IQVIA Clinical Pipeline.")

class WebIntelligenceAgent(BaseAgent):
    def __init__(self):
        super().__init__("Web Intelligence", "Pharmacodynamic Analyst", 0.0)
        
        import os 
        from dotenv import load_dotenv
        load_dotenv()
        
        # Initialize the Free OpenRouter Model 
        self.llm = ChatOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            model="openai/gpt-4o-mini",
            temperature=0.1
        )

    async def _run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        molecule = input_data.get("molecule", "Metformin")
        
        # --- 1. Semantic Synonym Resolution ---
        self.log_status("running", f"Resolving semantic aliases for {molecule}...")
        synonym_prompt = f"What are the common generic names, brand names, and chemical aliases for the drug '{molecule}'? Return ONLY a comma-separated list of 3-5 names (e.g. 'Acetaminophen, Paracetamol, Tylenol, APAP'). Do not include the original name unless it's the primary name."
        try:
            syn_response = await self.llm.ainvoke(synonym_prompt)
            synonyms = syn_response.content.strip()
            # Clean up potential LLM conversational garbage
            if "Here are" in synonyms:
                synonyms = molecule
        except Exception:
            synonyms = molecule
            
        aliases_string = f"{molecule} OR {synonyms}"
        search_query = f"({aliases_string})[Title/Abstract]"
        self.log_status("running", f"Connecting to PubMed API. Broadened neutral query: {search_query[:50]}...")
        
        # --- 2. Broadened E-Search ---
        search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pubmed",
            "term": search_query,
            "retmode": "json",
            "retmax": 20  # Fetching up to 20 papers for richer Risk/Reward matrix context
        }
        
        async with httpx.AsyncClient(follow_redirects=True) as client:
            search_res = await client.get(search_url, params=search_params)
            search_res.raise_for_status()
            search_data = search_res.json()
            
            id_list = search_data.get("esearchresult", {}).get("idlist", [])
            
            if not id_list:
                self.log_status("warning", f"No live PubMed results found for {molecule}.")
                return {"diseases_bio": []}

            self.log_status("running", f"Found {len(id_list)} relevant papers. Fetching full XML abstracts...")
            
            # --- 3. Full Abstract E-Fetch (XML Parsing) ---
            fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            fetch_params = {
                "db": "pubmed",
                "id": ",".join(id_list),
                "retmode": "xml"
            }
            
            fetch_res = await client.get(fetch_url, params=fetch_params)
            fetch_res.raise_for_status()
            
            import xml.etree.ElementTree as ET
            
            literature_context = ""
            try:
                root = ET.fromstring(fetch_res.text)
                for article in root.findall(".//PubmedArticle"):
                    pmid_el = article.find(".//PMID")
                    title_el = article.find(".//ArticleTitle")
                    abstract_el = article.find(".//AbstractText")
                    
                    pmid = pmid_el.text if pmid_el is not None else "Unknown"
                    title = title_el.text if title_el is not None else "Unknown Title"
                    abstract = abstract_el.text if abstract_el is not None else "No abstract available."
                    
                    # Some abstracts are split into multiple nodes (e.g. Background, Methods, Results)
                    if abstract_el is None:
                        abstract_parts = article.findall(".//AbstractText")
                        if abstract_parts:
                            abstract = " ".join([p.text for p in abstract_parts if p.text])
                    
                    literature_context += f"[VALID PMID: {pmid}] Title: {title}\nAbstract: {abstract}\n\n"
                    
            except Exception as e:
                self.log_status("warning", f"XML parsing failed, using raw fallback: {e}")
                literature_context = "Error retrieving abstracts."
            
        # --- 4. Extract the raw PMIDs from our fetched abstracts so we can inject them into the prompt
        import re as _re
        fetched_pmids = _re.findall(r'\[VALID PMID: (\d+)\]', literature_context)
        pmid_hint = ', '.join([f'[VALID PMID: {p}]' for p in fetched_pmids]) if fetched_pmids else 'No PMIDs found in abstracts'
        
        # PHASE 1: Neutral Literature Review
        self.log_status("running", "Phase 1: Generating neutral literature review to prevent bias...")
        
        phase_1_prompt = f"""
        You are a neutral medical researcher. Read the following abstracts for {molecule} (Synonyms: {synonyms}).
        Do NOT try to invent new uses or hypothesize. Your job is to summarize the current state of the research exactly as it appears in the text.
        
        Recent PubMed Literature Abstracts (fetched live):
        {literature_context}
        
        Identify:
        1. Current established uses and primary therapeutic applications.
        2. Known toxicities, adverse events, or risks.
        3. Primary biological pathways being studied.
        
        OUTPUT EXACTLY IN THIS JSON FORMAT AND NOTHING ELSE (No markdown, no backticks):
        {{
            "established_uses": "Brief summary",
            "toxicities": "Detailed list of adverse events mentioned",
            "pathway_summary": "Brief summary of mechanisms"
        }}
        """
        
        try:
            phase_1_response = await self.llm.ainvoke(phase_1_prompt)
            phase_1_data = self._parse_json_safely(phase_1_response.content)
            
            # Format the review for the PDF and for Phase 2
            literature_review = (
                f"Established Uses: {phase_1_data.get('established_uses', 'Unknown')}\n"
                f"Toxicities & Risks: {phase_1_data.get('toxicities', 'None identified')}\n"
                f"Pathway Summary: {phase_1_data.get('pathway_summary', 'Unknown')}"
            )
            
            self.log_status("running", "Phase 2: Extracting novel repurposing candidates based on literature baseline...")
            
            # PHASE 2: Biomedical Relationship Intelligence Extraction
            prompt = f"""
            You are a Biotech VC and expert computational biologist specialising in drug-effect relationship intelligence.
            Target Molecule: {molecule}
            
            Review the following neutral literature baseline for this drug:
            ---
            {literature_review}
            ---
            
            List ALL diseases and conditions mentioned across the abstracts. For each one, classify the relationship using the STRICT TAXONOMY below.
            
            RELATIONSHIP TAXONOMY (choose exactly ONE):
            - TREATS: Drug has demonstrated direct therapeutic benefit for this condition.
            - PROTECTIVE: Drug reduces the risk of developing this condition.
            - CAUSES: Drug is established to directly cause this condition.
            - WORSENS: Drug exacerbates an already existing condition.
            - ADVERSE_EFFECT: Known unintended side effect of the drug (listed in safety data).
            - CONTRAINDICATED: Drug is dangerous to use in patients with this condition.
            - CORRELATED: Statistically associated, but causation is not yet established.
            - BIOMARKER_LINKED: Drug affects a biomarker strongly associated with this condition.
            - OFF_TARGET_EFFECT: Drug has an unintended molecular interaction documented in preclinical models.
            
            EVIDENCE LEVELS (choose exactly ONE):
            RCT | Clinical_Trial | Meta_Analysis | Observational | Case_Report | Preclinical | Expert_Consensus
            
            CONFIDENCE (choose exactly ONE):
            - High: Consistent finding across 3 or more independent studies.
            - Medium: Supported by 1-2 studies with reasonable sample sizes.
            - Low: Single case report or small preclinical study.
            - Very_Low: Theoretical / computational prediction only.
            
            The following PubMed IDs (PMIDs) were retrieved from the raw abstracts: {pmid_hint}
            
            OUTPUT EXACTLY IN THIS JSON FORMAT AND NOTHING ELSE (No markdown, no backticks, no conversational text):
            {{
                "candidates": [
                    {{
                        "disease_name": "Name of disease using only standard ASCII hyphens (-), no special unicode characters",
                        "relationship_type": "One of the 9 types above",
                        "evidence_level": "One of the evidence levels above",
                        "confidence": "High or Medium or Low or Very_Low",
                        "reasoning": "Brief 1-sentence explanation citing the specific biological mechanism or association found in the abstracts",
                        "citations": ["[VALID PMID: 12345678]", "[VALID PMID: 87654321]"]
                    }}
                ]
            }}
            
            CRITICAL RULES:
            1. Include ALL conditions mentioned — TREATS, ADVERSE_EFFECT, CAUSES, CORRELATED, everything.
            2. You MUST classify EVERY candidate with relationship_type, evidence_level, AND confidence. Never leave blank.
            3. The 'citations' array MUST use ONLY [VALID PMID: X] tags from: [{pmid_hint}].
            4. Use ONLY simple ASCII hyphens (-) in disease names.
            """
            
            # Send the prompt to the LLM and parse the JSON manually
            response = await self.llm.ainvoke(prompt)
            llm_result = self._parse_json_safely(response.content)
            
            raw_diseases = llm_result.get("candidates", [])
            
            # --- DETERMINISTIC SCORING ENGINE ---
            # Python determines the exact numerical scores based on the relationship_type.
            # The LLM is strictly an NLP relationship extractor now; it does not do math.
            RELATIONSHIP_SCORES = {
                "TREATS":           {"pathway_overlap_score": 0.85, "toxicity_penalty_score": 0.05},
                "PROTECTIVE":       {"pathway_overlap_score": 0.75, "toxicity_penalty_score": 0.05},
                "BIOMARKER_LINKED": {"pathway_overlap_score": 0.55, "toxicity_penalty_score": 0.20},
                "OFF_TARGET_EFFECT":{"pathway_overlap_score": 0.40, "toxicity_penalty_score": 0.25},
                "CORRELATED":       {"pathway_overlap_score": 0.35, "toxicity_penalty_score": 0.35},
                "WORSENS":          {"pathway_overlap_score": 0.10, "toxicity_penalty_score": 0.85},
                "CAUSES":           {"pathway_overlap_score": 0.05, "toxicity_penalty_score": 0.95},
                "ADVERSE_EFFECT":   {"pathway_overlap_score": 0.05, "toxicity_penalty_score": 0.90},
                "CONTRAINDICATED":  {"pathway_overlap_score": 0.00, "toxicity_penalty_score": 1.00},
            }
            
            POSITIVE_RELATIONSHIP_TYPES = {"TREATS", "PROTECTIVE", "BIOMARKER_LINKED", "OFF_TARGET_EFFECT"}
            for d in raw_diseases:
                rel = d.get("relationship_type", "CORRELATED")
                scores = RELATIONSHIP_SCORES.get(rel, RELATIONSHIP_SCORES["CORRELATED"])
                d["pathway_overlap_score"] = scores["pathway_overlap_score"]
                d["toxicity_penalty_score"] = scores["toxicity_penalty_score"]
                d["effect_direction"] = "TREATS" if rel in POSITIVE_RELATIONSHIP_TYPES else "WORSENS_OR_CAUSES"
            
            treats_count = sum(1 for d in raw_diseases if d["effect_direction"] == "TREATS")
            risk_count = len(raw_diseases) - treats_count
            self.log_status("running", f"Relationship matrix: {treats_count} therapeutic + {risk_count} risk/adverse. Passing all {len(raw_diseases)} to patent filter.")
            
            # Sanitize disease names: replace non-breaking hyphens and other unicode with ASCII equivalents
            final_diseases = []
            for d in raw_diseases:
                d["disease_name"] = (
                    d.get("disease_name", "")
                    .replace('\u2011', '-')   # Non-breaking hyphen
                    .replace('\u2010', '-')   # Hyphen
                    .replace('\u2012', '-')   # Figure dash
                    .replace('\u2013', '-')   # En dash
                    .replace('\u2014', '-')   # Em dash
                    .replace('\u2212', '-')   # Minus sign
                )
                # Fallback: ensure citations always has the fetched PMIDs if LLM returned empty
                if not d.get("citations") and fetched_pmids:
                    d["citations"] = [f"PMID:{p}" for p in fetched_pmids[:3]]
                final_diseases.append(d)
            
            self.log_status("done", f"AI extracted {len(final_diseases)} candidates dynamically.")
            return {"diseases_bio": final_diseases, "synonyms": synonyms, "literature_review": literature_review}
            
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
                            
                            # Extract a sample of up to 3 patent IDs for the report
                            results = data.get("resultList", {}).get("result", [])
                            patent_ids = []
                            for r in results[:3]:
                                pid = r.get("id")
                                if pid:
                                    patent_ids.append(pid)
                            candidate["patent_ids"] = patent_ids
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
    
    

# --- ADD THIS TO THE VERY BOTTOM OF workers.py ---

class CommercialCandidate(BaseModel):
    disease_name: str = Field(description="The exact name of the indication provided.")
    tam_estimate: str = Field(description="Estimated Total Addressable Market (TAM) in USD (e.g., '$5.2 Billion').")
    trial_complexity: str = Field(description="Low, Medium, or High complexity for clinical trials.")
    time_to_market: str = Field(description="Estimated years to market (e.g., '3-5 years').")
    recommendation: str = Field(description="A brief 1-sentence verdict on if this is commercially worth pursuing.")

class CommercialAnalysisOutput(BaseModel):
    candidates: List[CommercialCandidate]

class CommercialViabilityAgent(BaseAgent):
    def __init__(self):
        super().__init__("CommercialViabilityAgent", "Venture Capital Analyst")

        import os 
        from dotenv import load_dotenv
        load_dotenv() # Ensure your new env variable is loaded
        
        # --- THE OPENROUTER SWAP ---
        self.llm = ChatOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            model="openai/gpt-4o-mini", # Using the new OpenAI open-weights model!
            temperature=0.2
        )
    
    
    async def _fetch_fda_competitors(self, client: httpx.AsyncClient, disease: str) -> List[str]:
        """Queries OpenFDA for drugs currently approved for this disease with defensive parsing."""
        # Sanitize the disease string for the URL (e.g., "Breast Cancer" -> "Breast+Cancer")
        safe_disease = disease.replace(' ', '+')
        url = f'https://api.fda.gov/drug/label.json?search=indications_and_usage:"{safe_disease}"&limit=3'
        
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                clean_competitors = []
                
                for res in data.get("results", []):
                    brand = res.get("openfda", {}).get("brand_name")
                    
                    # DEFENSIVE PARSING: Handle strings, lists, and nested lists
                    if isinstance(brand, list) and len(brand) > 0:
                        val = brand
                        # If it's a double-nested list like [['Tylenol']], un-nest it again
                        clean_competitors.append(str(val) if isinstance(val, list) else str(val))
                    elif isinstance(brand, str):
                        clean_competitors.append(brand)
                
                # Deduplicate and return
                unique_competitors = list(set(clean_competitors))
                return unique_competitors if unique_competitors else ["No direct FDA competitors found"]
                
            return ["No direct FDA competitors found"]
        except Exception as e:
            return ["FDA API Timeout"]
        
    async def _fetch_clinical_trials(self, client: httpx.AsyncClient, disease: str) -> Dict[str, Any]:
        """Queries ClinicalTrials.gov for active trial complexity."""
        url = f'https://clinicaltrials.gov/api/v2/studies?query.term="{disease}"&pageSize=50'
        try:
            response = await client.get(url)
            if response.status_code == 200:
                studies = response.json().get("studies", [])
                phase_3 = sum(1 for s in studies if "PHASE3" in str(s))
                
                raw_json = str(studies).upper()
                complexity = "Unknown"
                
                if "PHASE3" in raw_json or "DOUBLE-BLIND" in raw_json or "RANDOMIZED" in raw_json:
                    complexity = "High"
                elif "PHASE2" in raw_json or "MULTICENTER" in raw_json:
                    complexity = "Moderate"
                elif "PHASE1" in raw_json or "OBSERVATIONAL" in raw_json:
                    complexity = "Low"
                    
                return {
                    "total_active": len(studies),
                    "phase_3_trials": phase_3,
                    "complexity": complexity
                }
            return {"total_active": 0, "phase_3_trials": 0, "complexity": "Unknown"}
        except Exception:
            return {"total_active": 0, "phase_3_trials": 0, "complexity": "Unknown"}

    async def _fetch_financial_tam(self, disease: str) -> str:
        """Dynamically estimates the Total Addressable Market (TAM) for a specific disease using the LLM."""
        try:
            prompt = f"""You are a healthcare financial analyst. Estimate the global Total Addressable Market (TAM) for {disease} in Billions of USD. 
            
            TAM ESTIMATION RULES: If you cannot find direct competitor revenue for the exact indication, you must calculate a "Proxy TAM" based on global disease burden. When outputting the TAM, you MUST append the methodology in parentheses.

            Example: "$3.5 Billion (Estimated via global disease burden proxy)"
            Example: "$250 Million (Estimated via existing off-label expenditure)"

            Return ONLY the realistic numeric estimate formatted exactly like the examples above. Do not include any other conversational text."""
            response = await self.llm.ainvoke(prompt)
            estimate = response.content.strip()
            return estimate if "Billion" in estimate else f"{estimate} Billion"
        except Exception:
            return "$10.0 Billion (Fallback Estimate)"

    def _parse_json_safely(self, content: str) -> Dict[str, Any]:
        """Safely extracts JSON from LLM response, handling markdown code blocks and formatting."""
        try:
            # First, try parsing directly as JSON
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # Try to extract JSON from markdown code blocks
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                pass
        
        # Try to extract any JSON-like object in the response
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        # Fallback: return a safe default structure
        return {
            "tam_estimate": "Unable to parse",
            "trial_complexity": "Unknown",
            "competitors": [],
            "recommendation": content[:200] if content else "Unable to analyze"
        }

    async def _run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        candidates = input_data.get("ip_cleared_diseases", [])
        if not candidates:
            return {"commercial_data": []}

        # --- VACUUM FALLBACK: Separate therapeutic targets from adverse effects ---
        # POSITIVE relationship types that are commercially viable repurposing targets
        VIABLE_RELATIONSHIP_TYPES = {"TREATS", "PROTECTIVE", "BIOMARKER_LINKED", "OFF_TARGET_EFFECT"}

        viable_targets = [
            c for c in candidates
            if c.get("relationship_type", c.get("effect_direction", "TREATS")) in VIABLE_RELATIONSHIP_TYPES
        ]
        adverse_only = [
            c for c in candidates
            if c.get("relationship_type", c.get("effect_direction", "TREATS")) not in VIABLE_RELATIONSHIP_TYPES
        ]

        if not viable_targets:
            # THE VACUUM SCENARIO: All candidates are adverse effects. Do NOT commercialize.
            self.log_status("warning",
                f"[Vacuum Check] All {len(candidates)} candidates are adverse/risk relationships. "
                "No viable therapeutic targets found. Returning safety report instead of VC thesis.")
            # Return adverse candidates annotated as non-viable, with zero commercial scores
            safety_data = []
            for c in adverse_only:
                c.update({
                    "tam_estimate": "N/A — Adverse Profile",
                    "trial_complexity": "N/A",
                    "competitors": [],
                    "recommendation": (
                        f"⚠️ SAFETY FLAG: Literature review for this molecule yielded exclusively adverse effect "
                        f"profiles. The relationship '{c.get('relationship_type', 'ADVERSE_EFFECT')}' "
                        f"(Evidence: {c.get('evidence_level','Unknown')}, Confidence: {c.get('confidence','Unknown')}) "
                        f"indicates this molecule CAUSES or WORSENS {c.get('disease_name','this condition')}. "
                        f"Do NOT proceed with commercialization for this indication."
                    ),
                    "risk_adjusted_score": 0.0,
                    "effect_direction": "WORSENS_OR_CAUSES",
                })
                safety_data.append(c)
            return {"commercial_data": safety_data}

        self.log_status("running",
            f"VC Committee analyzing {len(viable_targets)} viable target(s) "
            f"({len(adverse_only)} adverse-only candidates excluded from commercial analysis)...")
        final_commercial_data = []

        # 1. Fetch Hard Data concurrently using httpx — only for viable therapeutic targets
        async with httpx.AsyncClient(timeout=15.0) as client:
            for candidate in viable_targets:
                disease = candidate.get("disease_name")
                
                # Run FDA and Trials APIs at the exact same time
                fda_task = self._fetch_fda_competitors(client, disease)
                trials_task = self._fetch_clinical_trials(client, disease)
                competitors, trials = await asyncio.gather(fda_task, trials_task)
                
                # Fetch dynamic financial data for the specific disease
                tam_estimate = await self._fetch_financial_tam(disease)

                # 2. The Final Synthesis — VC thesis grounded in hard API facts + relationship intelligence
                pathway_score = candidate.get("pathway_overlap_score", 0.5)
                toxicity_penalty = candidate.get("toxicity_penalty_score", 0.0)
                effect_direction = candidate.get("effect_direction", "TREATS")
                relationship_type = candidate.get("relationship_type", "CORRELATED")
                evidence_level = candidate.get("evidence_level", "Observational")
                confidence = candidate.get("confidence", "Low")
                
                prompt = f"""
                You are a Biotech Venture Capitalist. Write a strict 2-sentence investment thesis for repurposing a drug for {disease}.
                
                CRITICAL CLINICAL CHECK: Before writing the VC Recommendation, you MUST cross-reference the candidate indication against standard medical practice. Ask yourself: "Is this drug already widely prescribed off-label for this disease?" 
                * If YES (e.g., Aspirin for preeclampsia/fetal growth): You MUST explicitly state: "Note: This molecule is already heavily utilized off-label as the standard of care for this indication. The commercial opportunity lies in formalizing FDA approval, developing targeted delivery mechanisms, or creating proprietary formulations, rather than novel discovery."
                * If NO: Proceed with the standard novel repurposing thesis.
                
                EVIDENCE QUALITY CHECK: Review the Relationship Intelligence below. If confidence is "Low" or "Very_Low", you MUST begin your recommendation with: "Note: This indication is supported by limited evidence ({evidence_level}) and requires Phase 2 clinical validation before commercial commitment."
                
                DO NOT GUESS NUMBERS. Use ONLY these hard facts pulled from live government/financial APIs:
                - Existing FDA Competitors: {', '.join(competitors)}
                - Active Clinical Trials: {trials['total_active']} (Phase 3: {trials['phase_3_trials']})
                - Trial Complexity Rating: {trials['complexity']}
                - Market Size Proxy (TAM): {tam_estimate}
                - Relationship Type: {relationship_type}
                - Evidence Level: {evidence_level}
                - Confidence: {confidence}
                - Pathway Overlap Score: {pathway_score:.2f}
                - Toxicity Penalty Score: {toxicity_penalty:.2f} (if > 0.5, you MUST propose a novel 505(b)(2) formulation or delivery mechanism to mitigate this toxicity risk)
                
                Output JSON:
                {{
                    "is_currently_used_off_label": true/false,
                    "tam_estimate": "{tam_estimate}",
                    "trial_complexity": "{trials['complexity']}",
                    "competitors": {competitors},
                    "recommendation": "Your VC thesis here, following all the rules above."
                }}
                """
                
                # Invoke the LLM for the VC recommendation text only
                response = await self.llm.ainvoke(prompt)
                ai_data = self._parse_json_safely(response.content)
                
                # CRITICAL FIX: always use the hard API-derived complexity — never trust LLM to override it
                hard_complexity = trials["complexity"]
                
                # --- Risk-Adjusted Score Formula ---
                import re as _re2
                tam_nums = _re2.findall(r'[-+]?\d*\.?\d+', str(tam_estimate))
                tam_val = float(tam_nums[0]) if tam_nums else 0.0
                tam_weight = min(tam_val / 50.0, 1.0)   # Normalize: cap at $50B = 1.0
                risk_adjusted_score = round(
                    (tam_weight * 0.4) + (pathway_score * 0.4) - (toxicity_penalty * 0.3), 3
                )
                risk_adjusted_score = max(risk_adjusted_score, 0.0)  # Floor at 0
                
                candidate.update({
                    "tam_estimate": ai_data.get("tam_estimate", tam_estimate),
                    "trial_complexity": hard_complexity,
                    "competitors": ai_data.get("competitors", competitors),
                    "recommendation": ai_data.get("recommendation", "Awaiting manual review."),
                    "risk_adjusted_score": risk_adjusted_score,
                    "pathway_overlap_score": pathway_score,
                    "toxicity_penalty_score": toxicity_penalty,
                    "effect_direction": effect_direction,
                })
                
                final_commercial_data.append(candidate)
                
                # Polite buffer to avoid API throttling
                await asyncio.sleep(1)

        # Append the adverse/risk candidates back into the final data so they appear on the scatter plot
        for c in adverse_only:
            c.update({
                "tam_estimate": "N/A — Adverse Profile",
                "trial_complexity": "N/A",
                "competitors": [],
                "recommendation": (
                    f"⚠️ SAFETY FLAG: Literature review indicates this molecule CAUSES or WORSENS "
                    f"{c.get('disease_name','this condition')}. Do NOT commercialize."
                ),
                "risk_adjusted_score": 0.0,
            })
            final_commercial_data.append(c)

        self.log_status("done", "Market analysts complete.")
        return {"commercial_data": final_commercial_data}

class IQVIASupplyChainAgent(BaseAgent):
    def __init__(self):
        super().__init__("IQVIA Supply Chain", "Global Trade Analyst", 0.0)
        import os 
        from dotenv import load_dotenv
        load_dotenv()
        
        self.llm = ChatOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
            model="openai/gpt-4o-mini",
            temperature=0.1
        )

    def _query_local_datasets(self, molecule: str, synonyms: str) -> str:
        import pandas as pd
        import difflib # <-- Python's native fuzzy matcher!
        from pathlib import Path 

        data_dir = Path(__file__).parent.parent.parent.parent / "data" / "mock_seeds"
        report = f"RAW ENTERPRISE DATA EXTRACT FOR: {molecule}\n\n"
        
        search_terms = [str(molecule).strip()]
        if synonyms:
            search_terms.extend([s.strip() for s in synonyms.split(",") if s.strip()])

        print(f"\n[DEBUG PANDAS] Searching absolute path: {data_dir.resolve()}")
        print(f"[DEBUG PANDAS] Checking following aliases: {search_terms}")

        if not data_dir.exists():
             return f"Database integration error: Could not locate data directory."
        
        # The TRUE Invincible Matcher (No tuples, no external libraries!)
        def get_best_fuzzy_match(choices, query, threshold=0.5): # Lowered threshold for safety
            if not choices:
                return None
            
            clean_choices = [str(c) for c in choices]
            query_lower = str(query).lower().strip()
            
            # 1. The Substring Sniper: Catches "Metformin" inside "Metformin Hydrochloride" instantly
            for original in clean_choices:
                if query_lower in original.lower():
                    return original
            
            # 2. The Typo Fallback: Uses difflib just in case there's a spelling mistake
            matches = difflib.get_close_matches(
                query_lower, 
                [c.lower() for c in clean_choices], 
                n=1, 
                cutoff=threshold
            )
            
            if matches:
                for original in clean_choices:
                    if original.lower() == matches:
                        return original
            return None
        
        try:
            # 1. IQVIA Drug Profiles
            dp_path = data_dir / "IQVIA_DrugProfiles.csv"
            print("[DEBUG PANDAS] Attempting to read IQVIA_DrugProfiles.csv...")
            if dp_path.exists():
                df_dp = pd.read_csv(dp_path)
                print("[DEBUG PANDAS] DrugProfiles loaded successfully. Fuzzy matching...")
                df_dp.columns = df_dp.columns.str.strip()
                valid_names = df_dp['Molecule Name'].dropna().tolist()
                best_name = None
                for term in search_terms:
                    best_name = get_best_fuzzy_match(valid_names, term)
                    if best_name:
                        break
                
                if best_name:
                    # Safely extract the row
                    match = df_dp[df_dp['Molecule Name'].astype(str) == best_name]
                    if not match.empty:
                        report += "--- IQVIA DRUG PROFILE ---\n"
                        report += f"Matched Database Alias: {best_name}\n"
                        report += f"Repurposing Score: {match['Repurposing Opportunity Score (0–10)'].values}\n"
                        report += f"Est Annual Revenue: ${match['Est. Annual Revenue (USD M)'].values}M\n"
                        report += f"Risk Score: {match['Risk Score'].values}\n\n"

            # 2. EXIM Country Matrix
            matrix_path = data_dir / "EXIM_CountryMatrix.csv" 
            print("[DEBUG PANDAS] Attempting to read EXIM_CountryMatrix.csv...")
            if matrix_path.exists():
                df_matrix = pd.read_csv(matrix_path, index_col=0)
                print("[DEBUG PANDAS] CountryMatrix loaded successfully. Fuzzy matching...")
                df_matrix.columns = df_matrix.columns.str.strip()
                valid_cols = df_matrix.columns.tolist()
                best_col = None
                for term in search_terms:
                    best_col = get_best_fuzzy_match(valid_cols, term)
                    if best_col:
                        break
                
                if best_col:
                    report += "--- EXIM COUNTRY MATRIX (Net Trade Balance in USD Millions) ---\n"
                    top_exporters = df_matrix[best_col].dropna().sort_values(ascending=False).head(5)
                    for country, value in top_exporters.items():
                        report += f"{country}: {value}\n"
                    report += "\n"

            # 3. IQVIA Sales
            sales_path = data_dir / "IQVIA_Sales.csv"
            print("[DEBUG PANDAS] Attempting to read IQVIA_Sales.csv...")
            if sales_path.exists():
                df_sales = pd.read_csv(sales_path)
                print("[DEBUG PANDAS] Sales loaded successfully. Fuzzy matching...")
                df_sales.columns = df_sales.columns.str.strip()
                valid_names = df_sales['Molecule Name'].dropna().tolist()
                best_name = None
                for term in search_terms:
                    best_name = get_best_fuzzy_match(valid_names, term)
                    if best_name:
                        break
                
                if best_name:
                    match = df_sales[df_sales['Molecule Name'].astype(str) == best_name]
                    if not match.empty:
                        report += "--- IQVIA SALES TRENDS ---\n"
                        report += f"Recent YoY Growth: {match['YoY Growth (%)'].values}%\n"
                        report += f"Market Share: {match['Market Share (%)'].values}%\n\n"

            if len(report) < 60:
                print("[DEBUG PANDAS] Fuzzy match failed. Returning empty report.")
                return f"No local dataset records found for {molecule}."
                
            print("[DEBUG PANDAS] Data extracted successfully!")
            return report
            
        except Exception as e:
            print(f"[DEBUG PANDAS] Exception caught: {str(e)}")
            return f"Database integration error: {str(e)}"
    
    async def _run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        molecule = input_data.get("molecule", "Metformin")
        synonyms = input_data.get("synonyms", "")
        
        self.log_status("running", f"Querying IQVIA and EXIM Data Lake for {molecule}...")
        
        enterprise_data = self._query_local_datasets(molecule, synonyms)
        
        if "No local dataset records found" in enterprise_data or "Database integration error" in enterprise_data:
            self.log_status("warning", f"Molecule {molecule} missing from local IQVIA CSVs. Triggering AI Generative Fallback...")
            prompt = f"""
            You are a global pharma supply chain analyst. 
            The drug {molecule} is NOT in our internal IQVIA database. 
            Based purely on your parametric knowledge of its global generic availability, manufacturing footprint, and market history:
            Extract the API availability, top exporting countries, supply chain risk, market trends, and repurposing score.
            
            CRITICAL RULE: You are STRICTLY FORBIDDEN from returning "N/A", "Unknown", "Not available", or null values for any field. You MUST generate an educated estimate based on your parametric knowledge of this drug. Append '(AI Estimated)' to all text fields to indicate they are estimates. For repurposing_score, you MUST provide a numerical value between 0.0 and 10.0 — never return null or N/A.
            
            OUTPUT EXACTLY IN THIS JSON FORMAT AND NOTHING ELSE (No markdown, no backticks, no conversational text):
            {{
                "api_availability": "High/Medium/Low (AI Estimated)",
                "top_exporting_countries": ["Country1", "Country2"],
                "supply_chain_risk": "Low/Medium/High (AI Estimated)",
                "repurposing_score": 7.5,
                "market_trend": "Brief trend summary (AI Estimated)",
                "clinical_pipeline_status": "Brief status (AI Estimated)"
            }}
            """
        else:
            prompt = f"""
            You are a global pharma supply chain analyst. 
            Analyze the following raw database extract for the molecule {molecule}.
            
            {enterprise_data}
            
            Based ONLY on the data provided above, extract the API availability, top exporting countries, supply chain risk, market trends, and repurposing score.
            
            OUTPUT EXACTLY IN THIS JSON FORMAT AND NOTHING ELSE (No markdown, no backticks, no conversational text):
            {{
                "api_availability": "High/Medium/Low",
                "top_exporting_countries": ["Country1", "Country2"],
                "supply_chain_risk": "Low/Medium/High",
                "repurposing_score": 8.5,
                "market_trend": "Brief trend summary",
                "clinical_pipeline_status": "Brief status"
            }}
            """
        
        try:
            self.log_status("running", "AI correlating global trade risks and sales volume...")
            response = await self.llm.ainvoke(prompt)
            llm_result = self._parse_json_safely(response.content)
            
            self.log_status("done", "Enterprise data analysis complete.")
            return {"supply_chain_data": llm_result}
            
        except Exception as e:
            self.log_status("error", f"IQVIA parsing failed: {str(e)}")
            raise e