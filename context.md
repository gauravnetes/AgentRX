# AgentRX — Project Context

## 1. Project Overview & Problem Statement

**Project Name:** AgentRX  
**Category:** MedTech / Agentic-AI  
**Problem Being Solved:** Automating pharmaceutical drug repurposing discovery. Manual process currently takes 2–3 months; AgentRX targets reduction to minutes via autonomous multi-agent orchestration.  
**Anti-Goal:** We are NOT building a PDF chatbot. The core value is agentic pipeline orchestration over structured + unstructured pharma data.

AgentRX is a **Decision Intelligence Platform** built on a **stateful, asynchronous Multi-Agent Orchestration System**. A user inputs a target molecule → a Master Agent decomposes the goal → dispatches parallel Worker Agents → output is a structured PDF/Excel product story, NOT a chat response.

## 2. Architecture Overview (Diagram in Mermaid)

```mermaid
graph TD
    A[User Input: Molecule] --> B[FastAPI Backend]
    B --> C[LangGraph Orchestrator]
    C --> D[Web Intelligence Agent]
    C --> E[Patent Landscape Agent]
    C --> F[Commercial Viability Agent]
    C --> G[IQVIA Supply Chain Agent]
    D --> H[PubMed API]
    E --> I[USPTO PatentsView API]
    F --> J[Mock IQVIA API]
    G --> K[Mock EXIM API]
    H --> L[PostgreSQL Cache]
    I --> L
    J --> L
    K --> L
    L --> M[ChromaDB Vector Store]
    M --> N[Report Generation]
    N --> O[MinIO S3 Storage]
    O --> P[Final PDF/Excel Output]
```

## 3. Tech Stack Reference

| Layer | Stack | Role |
|---|---|---|
| Frontend & Synthesis | Next.js, Tailwind CSS | "Mission Control" dashboard with live agent telemetry |
| Core Intelligence | LangGraph, LangChain | State management, RAG routing, agent retry logic |
| Neural Backend (API) | FastAPI, Celery, Redis | Async task queue; concurrent external API calls |
| Data Fabric | PostgreSQL, Neo4j, ChromaDB/FAISS, AWS S3 | Relational + graph + vector + cold storage |

From codebase:  
- FastAPI for API  
- LangGraph for orchestration  
- Celery for async tasks  
- PostgreSQL, Redis, ChromaDB as per docker-compose.yml  
- Requirements.txt includes langchain, httpx, etc.

## 4. Agent Registry (all agents, their inputs, outputs, data sources, state mutations)

| Agent | Data Source | Responsibility | Input Schema | Output Schema | State Mutations | Status |
|---|---|---|---|---|---|---|
| Web Intelligence Agent | PubMed Entrez API | Find unlinked diseases sharing pathways | `{"molecule": str}` | `{"diseases_bio": List[Dict]}` | Updates `diseases_bio` | ✅ IMPLEMENTED |
| Patent Landscape Agent | Europe PMC REST API | Check for active biological patents | `{"merged_diseases": List, "molecule": str}` | `{"ip_cleared_diseases": List}` | Updates `ip_cleared_diseases`, adds `fto_status` field | ✅ IMPLEMENTED |
| Commercial Viability Agent | OpenFDA, ClinicalTrials.gov, YFinance | Evaluate TAM, trial complexity, competitors | `{"ip_cleared_diseases": List}` | `{"commercial_data": List}` | Augments candidates with `tam_estimate`, `trial_complexity`, `competitors`, `recommendation` | ✅ IMPLEMENTED |
| IQVIA Supply Chain Agent | Local CSV files (difflib fuzzy match) | Supply chain analysis from IQVIA + EXIM datasets | `{"molecule": str}` | `{"supply_chain_data": Dict}` | Updates `supply_chain_data` with structured SupplyChainOutput | ✅ IMPLEMENTED |

**Agent Implementation Details:**

- **Web Intelligence Agent**: Uses Gemini 2.5 Flash to extract disease candidates from PubMed abstracts with structured output.
- **Patent Landscape Agent**: Queries Europe PMC API for biological patents matching molecule + disease. Returns list of cleared diseases with FTO status.
- **Commercial Viability Agent**: Concurrently fetches FDA competitors, clinical trials, and financial TAM data. Uses OpenRouter (openai/gpt-oss-20b:free) for JSON synthesis.
- **IQVIA Supply Chain Agent**: Fuzzy-matches molecule name against local IQVIA_DrugProfiles.csv, EXIM_CountryMatrix.csv, and IQVIA_Sales.csv using Python's difflib. Extracts supply chain metrics and returns Pydantic-validated SupplyChainOutput.

All agents inherit from BaseAgent with retry logic (max 2 retries, exponential backoff).


## 5. M2M Pipeline (Mechanism-to-Market) — Step-by-Step

**Pipeline Status: ✅ FULLY IMPLEMENTED AND OPERATIONAL**

The pipeline runs in strict sequential phases with LangGraph state management:

1. **Pharmacodynamic Mapping** (`pharmacodynamic_mapping` node)
   - Trigger: User input (molecule name)
   - Agent: Web Intelligence Agent
   - Data Source: PubMed Entrez API (live)
   - Output: `diseases_bio` list with disease candidates, pathway overlap scores, reasoning, and citations
   - Error Handling: Graceful fallback if PubMed returns no results

2. **Data Merge** (`merge_data` node)
   - Combines `diseases_bio` into `merged_diseases` for downstream processing

3. **IP Whitespace Clearance** (`ip_whitespace_clearance` node)
   - Agent: Patent Landscape Agent
   - Data Source: Europe PMC REST API (SRC:PAT filter for biological patents)
   - Output: Filters candidates, adds `fto_status` (CLEAR/BLOCKED) and `blocking_patents` count
   - Hard Filter: Removes blocked indications from pipeline

4. **Commercial Viability Screening** (`commercial_viability_screening` node)
   - **PIPELINE INTERRUPTS HERE FOR HUMAN APPROVAL**
   - Agent: Commercial Viability Agent
   - Data Sources: OpenFDA, ClinicalTrials.gov, Yahoo Finance
   - Output: Augments candidates with TAM estimate, trial complexity, competitor list, and VC investment thesis
   - Decision Point: Awaits user approval before continuing

5. **IQVIA EXIM Analysis** (`iqvia_exim_analysis` node)
   - Agent: IQVIA Supply Chain Agent
   - Data Sources: Local CSV files (difflib fuzzy-matched)
   - Output: `supply_chain_data` with API availability, top exporters, supply chain risk, repurposing score, market trends

Pipeline Framework: LangGraph (state machine) with SQLite checkpoint system for resumable execution.


## 6. Background Job & Cron Schedule Registry

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

Proposed: PubMed cache job every 6 hours, Patent cache every 24 hours.

## 7. Database Schema Reference

### 7.1 PostgreSQL Tables

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

Proposed: `pubmed_cache`, `patent_cache`, `trend_snapshots`, `exim_data`, `analyst_notes`.

### 7.2 Neo4j Graph Schema

Nodes: Molecule, Indication, Patent, ClinicalTrial, MarketSegment, Competitor.  
Edges: TARGETS, HAS_PATENT, USED_IN, BELONGS_TO, COMPETES_WITH, SHARES_PATHWAY.

### 7.3 ChromaDB / FAISS Collections

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

Collections for vector embeddings of literature.

### 7.4 Redis Keys & TTLs

Used for Celery broker/backend, no custom keys defined yet.

## 8. API Endpoint Reference (all routes, methods, request/response shapes)

### Pipeline Execution Endpoints

- `POST /api/pipeline/start`
  - **Request:** `{"molecule": str}`
  - **Response (Success):** `{"status": "PAUSED_FOR_HUMAN", "thread_id": str, "message": str, "pending_candidates": List[Dict]}`
  - **Response (Error):** HTTP 500 with error detail
  - **Behavior:** Starts pipeline, executes phases 1–3, pauses before commercial viability for human review

- `POST /api/pipeline/resume`
  - **Request:** `{"thread_id": str}`
  - **Response:** `{"status": "COMPLETED", "molecule": str, "final_candidates": List[Dict], "iqvia_exim_analysis": Dict}`
  - **Behavior:** Resumes paused pipeline from checkpoint, completes phases 4–5

### Health Check Endpoint

- `GET /health`
  - **Response:** `{"status": str, "environment": str, "orchestrator": str, "message": str}`
  - **Example:** `{"status": "online", "environment": "development", "orchestrator": "LangGraph Ready", "message": "AgentRX Neural Backend is operational"}`

### Pydantic Response Models

**DiseaseCandidate:**
```python
{
  "disease_name": str,
  "pathway_overlap_score": float,  # 0.0–1.0
  "reasoning": str,
  "citations": List[str]
}
```

**SupplyChainOutput:**
```python
{
  "api_availability": str,  # "High" | "Medium" | "Low"
  "top_exporting_countries": List[str],
  "supply_chain_risk": str,
  "repurposing_score": float,
  "market_trend": str,
  "clinical_pipeline_status": str
}
```

**CommercialCandidate** (augmented from DiseaseCandidate):
```python
{
  "disease_name": str,
  "tam_estimate": str,  # e.g., "$5.2 Billion"
  "trial_complexity": str,  # "Low" | "Medium" | "High"
  "time_to_market": str,  # e.g., "3-5 years"
  "competitors": List[str],
  "recommendation": str,
  "fto_status": str  # "CLEAR" | "BLOCKED"
}
```

## 9. External API Integration Reference

### Public / Free APIs (Live)

| API | Agent | Purpose | Rate Limit / Notes |
|---|---|---|---|
| PubMed Entrez API | Web Intelligence | Search and fetch scientific literature | ~3 req/sec, no key required |
| Europe PMC REST API | Patent Landscape | Search biological patents | ~1 req/sec, public access |
| OpenFDA API | Commercial Viability | Query approved drugs by indication | ~100 req/minute |
| ClinicalTrials.gov API v2 | Commercial Viability | Fetch active clinical trials | ~10 req/sec |
| Yahoo Finance (yfinance) | Commercial Viability | Fetch pharma company revenue | Daily limit ~2000 calls |

### LLM Providers

| Provider | Model | Agent | API Key | Cost | Status |
|---|---|---|---|---|---|
| Google Gemini | gemini-2.5-flash | Web Intelligence, IQVIA Supply Chain | GOOGLE_API_KEY | Free tier available | ✅ Active |
| OpenRouter | openai/gpt-oss-20b:free | Commercial Viability | OPENROUTER_API_KEY | Free open-weights model | ✅ Active |

### Local Mock Data Files

| File | Location | Purpose | Format |
|---|---|---|---|
| IQVIA_DrugProfiles.csv | data/mock_seeds/ | Drug repurposing scores, revenue, risk | CSV |
| IQVIA_Sales.csv | data/mock_seeds/ | YoY growth, market share trends | CSV |
| IQVIA_ClinicalPipeline.csv | data/mock_seeds/ | Clinical trial phases and statuses | CSV |
| EXIM_CountryMatrix.csv | data/mock_seeds/ | Net trade balance by country and molecule | CSV |
| EXIM_TradeData.csv | data/mock_seeds/ | Import/export volumes and pricing | CSV |

### Infrastructure APIs

| Service | Purpose | Status |
|---|---|---|
| Redis (6379) | Celery broker/backend, caching | Running in docker-compose |
| PostgreSQL (5432) | Pipeline execution state (SQLite used for dev checkpoints) | Running in docker-compose |
| ChromaDB (8000) | Vector store for RAG (not yet integrated) | Running in docker-compose |
| MinIO (9000) | S3-compatible storage for reports | Running in docker-compose |


## 10. Memory Management (STM vs LTM)

STM: LangGraph state graph scratchpad.  
LTM: ChromaDB for RAG.

## 11. Depth Control System

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

Shallow/Standard/Deep modes.

## 12. Feature Specifications

### 12.1 Instant Search (DB-backed Cache)

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

**Proposed Design:**  
Cron: 6h for PubMed, 24h for patents. Cache tables with upsert. `pubmed_cache` and `patent_cache` tables track source_id, title, abstract, authors, publication_date, mesh_terms, raw_json, vector_embedding_id, last_fetched_at, is_indexed.

### 12.2 Manual Search Mode

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

**Proposed Design:**  
`POST /api/v1/search/manual` endpoint. Bypasses cache, hits live APIs directly. Fallback chain: PubMed → CrossRef → ChemSpider → graceful "No data found".

### 12.3 Trend Analysis Module

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

**Proposed Design:**  
`trend_snapshots` table with columns: molecule_id, snapshot_date, metric_key, metric_value, source. Weekly cron refresh. Metrics: publication velocity (pub/quarter YoY), trial initiation rate (new trials per 6mo), patent filing acceleration, CAGR trend.

### 12.4 Costing Engine (EXIM)

> ⚠️ NOT YET IMPLEMENTED — fully — Currently Partial Implementation with Mock Data

**Current Status:**  
IQVIA Supply Chain Agent now reads local EXIM data from CSV files. Fuzzy-matches molecule name. Extracts:
- API availability (High/Medium/Low from EXIM volumes)
- Top exporting countries (top 5 from EXIM_CountryMatrix)
- Supply chain risk assessment
- Import price per kg
- Export volume trends

**Still TODO:**  
- Real UN Comtrade API integration (currently using local mock data)
- Sourcing concentration risk calculation (flag if >70% single-country)
- Landed cost estimation with logistics markup

### 12.5 Competitive Analysis Engine

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

**Proposed Design:**  
`POST /api/v1/competitive-analysis` endpoint. Fuzzy-match molecules across databases. Compare: ingredient delta, efficacy claims, adverse events, IP status, commercial pros/cons. Write COMPETES_WITH edges to Neo4j.

### 12.6 Data Notepad

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

**Proposed Design:**  
`analyst_notes { id, session_id, molecule_id, report_section, note_text, created_at, updated_at }` table. `GET/POST /api/v1/notes/{session_id}`.

## 13. Competitive Analysis Knowledge Graph Schema

As in Section 7.2.

## 14. Dashboard UI Contract (what the frontend expects from each API)

> ⚠️ NOT YET IMPLEMENTED — see engineering decision in Section 16.

Real-time telemetry, DAG view, trend charts.

## 15. Environment Variables Reference (.env keys and their purpose)

### Application Configuration
- **ENVIRONMENT**: `development | production`
- **LOG_LEVEL**: `DEBUG | INFO | WARNING | ERROR`
- **VALID_API_TOKENS**: Comma-separated list of mock tokens for demo/testing

### Database & Infrastructure
- **POSTGRES_URL**: PostgreSQL connection string (format: `postgresql://user:pass@host:port/db`)
- **REDIS_URL**: Redis broker URL for Celery (format: `redis://host:port/db`)
- **CHROMADB_HOST**: ChromaDB server hostname
- **CHROMADB_PORT**: ChromaDB server port (default 8000)
- **NEO4J_URI**: Neo4j bolt connection URI
- **NEO4J_USER**: Neo4j username
- **NEO4J_PASSWORD**: Neo4j password

### External API Keys
- **PUBMED_API_KEY**: NCBI Entrez API key (optional, higher rate limits)
- **USPTO_API_KEY**: USPTO API key (optional)
- **GOOGLE_API_KEY**: Google Generative AI (Gemini) API key
- **OPENROUTER_API_KEY**: OpenRouter API key for open-weights LLM access

### LLM Configuration
- **LLM_PROVIDER**: `mistral | google | openrouter`
- **LLM_MODEL_NAME**: Model identifier (e.g., `mistral-large-latest`)
- **MISTRAL_API_KEY**: Mistral API key (if using Mistral)

### Storage (S3 / MinIO)
- **S3_ENDPOINT_URL**: S3 or MinIO endpoint (e.g., `http://localhost:9000`)
- **S3_BUCKET**: Bucket name for storing reports
- **AWS_ACCESS_KEY_ID**: MinIO/AWS access key
- **AWS_SECRET_ACCESS_KEY**: MinIO/AWS secret key

### Development Defaults (from .env.example)
```
ENVIRONMENT=development
LOG_LEVEL=DEBUG
VALID_API_TOKENS=mock_token_123,demo_user_456
POSTGRES_URL=postgresql://agentrx_user:agentrx_pass@localhost:5432/agentrx_db
REDIS_URL=redis://localhost:6379/0
CHROMADB_HOST=localhost
CHROMADB_PORT=8000
```

## 16. Open Engineering Decisions & TODOs

### Completed (May 8, 2026):
- ✅ All four Worker Agents fully implemented with proper error handling and retry logic
- ✅ Patent Landscape Agent fixed: handles disease_name as string (no longer crashes on list)
- ✅ Commercial Viability Agent: FDA competitor fetching, clinical trial analysis, TAM estimation via Yahoo Finance
- ✅ IQVIA Supply Chain Agent: Local CSV parsing with difflib fuzzy matching
- ✅ Pipeline execution with human approval interrupt point
- ✅ Database checkpoint system (SQLite) for resumable pipeline runs

### In Progress:
- 🟡 Commercial Viability Agent: OpenRouter LLM integration for cost-effective synthesis

### TODO (Priority Order):
1. Implement background job system for PubMed/Patent caching (6h/24h cron)
2. Add PostgreSQL schema for pubmed_cache, patent_cache, trend_snapshots
3. Build Next.js "Mission Control" dashboard with real-time agent telemetry
4. Integrate Neo4j for competitive analysis knowledge graph
5. Add vector embeddings (ChromaDB) for RAG-based literature search
6. Implement depth control (shallow/standard/deep) for agent reasoning
7. Add UN Comtrade API integration for real EXIM data
8. Implement trend analysis module (publication velocity, trial initiation rate, patent filing acceleration)
9. Build Competitive Analysis Engine with fuzzy molecule matching
10. Add Data Notepad feature with session persistence

## 17. Recent Bug Fixes & Improvements (May 8, 2026)

### Bug: PatentLandscapeAgent - 'list' object has no attribute 'lower'
**Root Cause:** Web Intelligence Agent returned `diseases_bio` with disease_name embedded in a list structure. PatentLandscapeAgent tried to call `.split().lower()` on the list object.  
**Fix:** Added defensive type checking and normalization:
```python
disease_text = " ".join(disease) if isinstance(disease, list) else str(disease)
search_terms = disease_text.lower().split()
```
**Status:** ✅ RESOLVED

### Bug: CommercialViabilityAgent - '_parse_json_safely' method missing
**Root Cause:** LLM responses needed safe JSON extraction with fallback for markdown code blocks.  
**Fix:** Implemented `_parse_json_safely()` with three-tier strategy:
1. Direct JSON parse
2. Extract from markdown code blocks
3. Regex-based JSON detection with fallback defaults  
**Status:** ✅ RESOLVED

### Bug: IQVIASupplyChainAgent - thefuzz library dependency issue
**Root Cause:** Complex fuzzy matching logic using RapidFuzz was brittle and crashed on edge cases.  
**Fix:** Replaced with Python's native `difflib.get_close_matches()` plus substring matching:
1. Substring sniper (catches "Metformin" in "Metformin Hydrochloride")
2. Difflib fallback for spelling mistakes
**Status:** ✅ RESOLVED

### Bug: DataFrame column access via .iloc with column names
**Root Cause:** Pandas `.iloc[column_name]` is invalid; should use `.loc` or `.values`.  
**Fix:** Switched to `.values` for extracting DataFrame cell values in IQVIA report generation.  
**Status:** ✅ RESOLVED

## 18. Glossary (pharma + tech terms used in this codebase)

- M2M: Mechanism-to-Market pipeline.
- TAM: Total Addressable Market.
- CAGR: Compound Annual Growth Rate.
- FTO: Freedom to Operate (IP clearance).
- SMILES: Simplified Molecular Input Line Entry System.
- LangGraph: State machine for agent orchestration.
- ChromaDB: Vector database for embeddings.
- EXIM: Export/Import data (trade flows).
- IQVIA: Market research and pharma data provider (mocked in dev).
- PubMed: National Library of Medicine literature database.
- Europe PMC: Open-access biomedical literature index.
- OpenFDA: FDA drug and device adverse event database.