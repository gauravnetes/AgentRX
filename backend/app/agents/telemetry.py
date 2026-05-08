"""
telemetry.py — AgentRX Pipeline Telemetry Bus

Extracted into its own module to break the circular import between:
  master.py  (imports graph.py for m2m_builder)
  graph.py   (needs telemetry to emit agent lifecycle events)

Both files import from here instead of from each other.
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class TelemetryBus:
    """
    Lightweight in-process event bus for pipeline telemetry.
    Events are stored in memory keyed by thread_id.

    Status lifecycle per agent:
      queued → running → completed | failed
    """

    def __init__(self):
        self._events: Dict[str, List[Dict[str, Any]]] = {}

    def emit(self, thread_id: str, agent: str, status: str, message: str):
        event = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "agent": agent,
            "status": status,
            "message": message,
        }
        self._events.setdefault(thread_id, []).append(event)
        logger.info("[%s | %s] %s", agent, status.upper(), message)
        print(f"[MasterAgent | {agent} | {status.upper()}] {message}", flush=True)

    def get_events(self, thread_id: str) -> List[Dict[str, Any]]:
        return self._events.get(thread_id, [])

    def clear(self, thread_id: str):
        self._events.pop(thread_id, None)


# Module-level singleton shared across master.py and graph.py
telemetry = TelemetryBus()
