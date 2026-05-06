import os 
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE_PATH = ROOT_DIR / ".env"

print(f"--- STARTUP DIAGNOSTICS ---")
print(f"Looking for .env file at: {ENV_FILE_PATH}")
print(f"Does the file actually exist here? {ENV_FILE_PATH.exists()}")
print(f"---------------------------")

class Settings(BaseSettings): 
    PROJECT_NAME: str = "AgentRX Enterprise API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "DEBUG"
    
    VALID_API_TOKENS: str 
    
    @property
    def valid_tokens_list(self) -> List[str]: 
        return [token.strip() for token in self.VALID_API_TOKENS.split(",")]
    
    # INFRA URIs
    POSTGRES_URL: str 
    REDIS_URL: str 
    CHROMADB_HOST: str 
    CHROMADB_PORT: int 
    
    # Eternal APIs
    PUBMED_API_KEY: str 
    USPTO_API_KEY: str 
    
    # LLM Settings 
    LLM_PROVIDER: str 
    LLM_MODEL_NAME: str 
    MISTRAL_API_KEY: str 
    
    S3_ENDPOINT_URL: str 
    S3_BUCKET: str 
    AWS_ACCESS_KEY_ID: str 
    AWS_SECRET_ACCESS_KEY: str 

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH), 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )
    
settings = Settings() 
 