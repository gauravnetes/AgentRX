"""
telemetry.py — AgentRX Pipeline Telemetry Bus
Extracted into its own module to break the circular import.
Supports Server-Sent Events (SSE) broadcasting and DB persistence.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List

from app.core.db import AsyncSessionLocal
from app.models.report import TelemetryEvent

logger = logging.getLogger(__name__)

class TelemetryBus:
    """
    In-process event bus for pipeline telemetry.
    Events are stored in memory keyed by thread_id for quick polling,
    broadcasted to SSE subscribers via asyncio queues, 
    and persisted to the SQLite database.
    """

    def __init__(self):
        self._events: Dict[str, List[Dict[str, Any]]] = {}
        self._subscribers: Dict[str, List[asyncio.Queue]] = {}

    def emit(self, thread_id: str, agent: str, status: str, message: str, latency_ms: float = None):
        """Emit an event. Typically called synchronously from within nodes."""
        ts = datetime.now(timezone.utc)
        event = {
            "id": str(uuid.uuid4()),
            "ts": ts.isoformat(),
            "agent": agent,
            "status": status,
            "message": message,
            "latency_ms": latency_ms
        }
        
        # 1. Store in memory
        self._events.setdefault(thread_id, []).append(event)
        
        # 2. Print to stdout
        lat_str = f" [LAT: {latency_ms}ms]" if latency_ms else ""
        print(f"[MasterAgent | {agent} | {status.upper()}]{lat_str} {message}", flush=True)

        # 3. Broadcast to SSE subscribers safely from sync context
        if thread_id in self._subscribers:
            for q in self._subscribers[thread_id]:
                try:
                    q.put_nowait(event)
                except asyncio.QueueFull:
                    pass

        # 4. Fire-and-forget DB persistence
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._persist_event(thread_id, ts, agent, status, message, latency_ms, event["id"]))
        except RuntimeError:
            # If no running loop, we skip DB persistence for this emit
            pass

    async def _persist_event(self, thread_id: str, ts: datetime, agent: str, status: str, message: str, latency_ms: float, event_id: str):
        """Asynchronously save the telemetry event to SQLite."""
        async with AsyncSessionLocal() as session:
            try:
                db_event = TelemetryEvent(
                    id=event_id,
                    thread_id=thread_id,
                    ts=ts,
                    agent=agent,
                    status=status,
                    message=message,
                    latency_ms=latency_ms
                )
                session.add(db_event)
                await session.commit()
            except Exception as e:
                logger.error(f"Failed to persist telemetry event: {e}")

    def get_events(self, thread_id: str) -> List[Dict[str, Any]]:
        return self._events.get(thread_id, [])

    def subscribe(self, thread_id: str) -> asyncio.Queue:
        """Subscribe to a thread's live telemetry stream."""
        q = asyncio.Queue(maxsize=100)
        self._subscribers.setdefault(thread_id, []).append(q)
        return q

    def unsubscribe(self, thread_id: str, q: asyncio.Queue):
        if thread_id in self._subscribers:
            try:
                self._subscribers[thread_id].remove(q)
                if not self._subscribers[thread_id]:
                    del self._subscribers[thread_id]
            except ValueError:
                pass

    def clear(self, thread_id: str):
        self._events.pop(thread_id, None)

telemetry = TelemetryBus()
