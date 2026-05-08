from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from app.core.config import settings 
from app.api.routes.pipeline import router as pipeline_router 
from app.api.routes.reports import router as reports_router
from app.api.routes.chat import router as chat_router
from app.core.db import engine, Base
import app.models.report  # Ensure models are loaded


def create_app() -> FastAPI: 
    app = FastAPI(
        title=settings.PROJECT_NAME, 
        version=settings.VERSION, 
        description="High-performance async backend for AgentRX Drug Repurposing Pipeline."
    )
    app.add_middleware(
        CORSMiddleware, 
        allow_origins=["*"],  
        allow_credentials=True, 
        allow_methods=["*"], 
        allow_headers=["*"],
    )
    
    app.include_router(pipeline_router, prefix="/api/pipeline", tags=["Pipeline Execution"])
    app.include_router(reports_router, prefix="/api/reports", tags=["Dashboard"])
    app.include_router(chat_router, prefix="/api/chat", tags=["Analysis Assistant"])
    
    @app.on_event("startup")
    async def on_startup():
        async with engine.begin() as conn:
            # Create all tables if they don't exist
            await conn.run_sync(Base.metadata.create_all)
            print("[System] Database tables initialized successfully.")

    @app.get("/health", tags=["System"])
    async def health_check(): 
        return {
            "status": "online", 
            "environment": settings.ENVIRONMENT, 
            "orchestrator": "LangGraph Ready",  
            "message": "AgnetRX Neural Backend is operational" 
        }
            
    return app

app = create_app() 
