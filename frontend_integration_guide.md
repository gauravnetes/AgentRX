# AgentRX Frontend Integration Guide

This document outlines the Backend APIs and data structures designed to support the AgentRX rich, real-time UI, specifically focusing on the multi-agent orchestration animations and live telemetry.

## Base URL
All endpoints are prefixed with `/api`. Assuming local development, the base URL is: `http://localhost:8000/api`

---

## 1. Orchestration Lifecycle Endpoints

### `POST /pipeline/start`
Initializes Phase 1 of the multi-agent pipeline (Web Intelligence & Patent Landscape).
- **Request Body:**
  ```json
  {
    "molecule": "Metformin"
  }
  ```
- **Response (202 Accepted):**
  ```json
  {
    "status": "ACCEPTED",
    "thread_id": "uuid-string-here",
    "message": "Pipeline initialization started in the background."
  }
  ```
- **Action:** Immediately transition the UI to the "Active Orchestration" screen and connect to the SSE stream using the returned `thread_id`.

### `POST /pipeline/resume`
Resumes the pipeline (Phase 2) after the user has approved the IP-cleared candidates.
- **Request Body:**
  ```json
  {
    "thread_id": "uuid-string-here"
  }
  ```
- **Response (202 Accepted):** Same as `/start`.
- **Action:** Re-connect or keep listening to the SSE stream to watch the Commercial and Supply Chain agents execute.

---

## 2. Server-Sent Events (SSE) Live Stream

To animate the "Active Orchestration" screen, connect to the SSE endpoint using the browser's native `EventSource`.

### `GET /pipeline/stream/{thread_id}`
Streams JSON payloads of telemetry and state changes in real-time.

**Frontend Implementation Example:**
```javascript
const eventSource = new EventSource(`http://localhost:8000/api/pipeline/stream/${thread_id}`);

eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // 1. Update Terminal UI
    appendLogToTerminal(`[${data.agent} | ${data.status.toUpperCase()}] ${data.message} [LAT: ${data.latency_ms}ms]`);
    
    // 2. Update Agent Status Cards (RUNNING vs IDLE)
    updateAgentCardStatus(data.agent, data.status);
    
    // 3. Handle Pipeline Paused / Completed
    if (data.agent === "MasterAgent") {
        if (data.status === "paused") {
            showHumanApprovalModal();
        } else if (data.status === "completed") {
            eventSource.close();
            transitionToFinalReportScreen();
        }
    }
};
```

**Event Payload Schema:**
```json
{
  "id": "uuid",
  "ts": "2026-05-08T14:30:00.000Z",
  "agent": "Web Intelligence Agent", // Maps to the UI Agent Cards
  "status": "dispatching", // dispatching, running, done, paused, completed
  "message": "Connecting to PubMed Entrez API...",
  "latency_ms": 124.5
}
```

---

## 3. Dashboard & History Endpoints

### `GET /reports`
Fetches all historical pipeline runs. Used to populate the sidebar navigation.
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "thread_id": "uuid",
      "molecule": "Metformin",
      "status": "COMPLETED", // or RUNNING, PAUSED_FOR_HUMAN
      "created_at": "2026-05-08T14:30:00.000Z"
    }
  ]
  ```

### `GET /reports/{thread_id}`
Fetches the complete details for a specific run, including the calculated "Opportunity Insights" needed for the final "Intelligence Report Generated" screen.
- **Response:**
  ```json
  {
    "id": "uuid",
    "thread_id": "uuid",
    "molecule": "Metformin",
    "status": "COMPLETED",
    "pdf_path": "/absolute/path/to/backend/reports/uuid.pdf",
    "created_at": "2026-05-08T14:30:00.000Z",
    "insights": {
      "tam": 159.7, 
      "clinical_viability": "High", 
      "patent_freedom": "Clear", 
      "repurposing_score": 8.8,
      "final_candidates": [
        {
           "disease_name": "Breast Cancer",
           "tam_estimate": "$159.7 Billion",
           "fto_status": "CLEAR"
        }
      ]
    }
  }
  ```

### `GET /pipeline/report/{thread_id}`
Initiates a file download of the generated PDF report. Hook this up to the "Export PDF" button on the final screen.

---

## 4. UI Mapping Guide

| UI Element | Data Source / Action |
| --- | --- |
| **Start Button** | `POST /pipeline/start` with the molecule string |
| **Agent Status Cards** | Listen to `EventSource`. When `data.agent == "Web Intelligence Agent"` and `data.status == "dispatching"`, set card to **RUNNING**. |
| **Live Telemetry Terminal** | Listen to `EventSource`. Append `data.message` and `data.ts` to the scrolling div. |
| **Opportunity Insights Panel** | Polled via `GET /reports/{thread_id}` using the `insights` JSON object. |
| **Analysis Assistant Chat** | `POST /chat` passing `{ "thread_id": "...", "message": "..." }` |
