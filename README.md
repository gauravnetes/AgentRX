

agentrx/
├── backend/               # The Neural Backend & Core Intelligence
│   ├── app/
│   │   ├── agents/        # Worker Agent logic (clinical.py, patent.py, etc.)
│   │   ├── api/           # FastAPI endpoints (/run-pipeline, /status)
│   │   ├── core/          # App config, security middleware, Celery setup
│   │   ├── models/        # Pydantic schemas & SQLAlchemy DB models
│   │   ├── pipeline/      # LangGraph state machine and DAG routing logic
│   │   └── services/      # External API clients (PubMed, USPTO) & DB clients
│   └── templates/         # Jinja2 HTML templates for the PDF Report Generator
├── config/                # YAML files (like m2m_pipeline.yml)
├── data/                  # Local storage for ChromaDB and mock CSV/JSON files
├── frontend/              # (We will initialize Next.js here in a later step)
├── infrastructure/        # Dockerfiles and database init scripts
└── mock_services/         # Isolated FastAPI apps for your mock enterprise data
    ├── exim/
    └── iqvia/