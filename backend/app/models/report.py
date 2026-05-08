import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Text
from app.core.db import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    thread_id = Column(String, unique=True, index=True)
    molecule = Column(String, index=True)
    status = Column(String, default="RUNNING") # RUNNING, PAUSED_FOR_HUMAN, COMPLETED, FAILED
    
    # Store the final synthesized data as JSON strings for easy UI retrieval
    insights_json = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def insights(self) -> dict:
        if self.insights_json:
            return json.loads(self.insights_json)
        return {}

    @insights.setter
    def insights(self, value: dict):
        self.insights_json = json.dumps(value)

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"
    
    id = Column(String, primary_key=True, index=True) # UUID
    thread_id = Column(String, index=True)
    ts = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    agent = Column(String)
    status = Column(String)
    message = Column(Text)
    latency_ms = Column(Float, nullable=True)
