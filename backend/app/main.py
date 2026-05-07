from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware 
from app.core.config import settings 
from app.api.routes.pipeline import router as pipeline_router 


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
