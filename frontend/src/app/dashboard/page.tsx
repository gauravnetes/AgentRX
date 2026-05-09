"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoleculeInput } from "@/components/dashboard/molecule-input";
import { OrchestrationCanvas } from "@/components/dashboard/orchestration-canvas";
import { LiveAgents } from "@/components/dashboard/live-agents";
import { TelemetryFeed } from "@/components/dashboard/telemetry-feed";
import { IntelligencePanel } from "@/components/dashboard/intelligence-panel";
import { AssistantWidget } from "@/components/dashboard/assistant-widget";
import { ReportView } from "@/components/dashboard/report-view";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type AppPhase = "idle" | "orchestrating" | "paused" | "report";

type AgentStatus = "idle" | "running" | "completed";

type Agent = {
  id: string;
  name: string;
  status: AgentStatus;
  progress: number;
  apiSource: string;
  latency: string;
  operation: string;
};

type LogEntry = {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning";
};

// Map agent names from backend to canvas stage index
const AGENT_STAGE_MAP: Record<string, number> = {
  "Web Intelligence Agent": 0,
  "Web Intelligence": 0,
  "Patent Landscape Agent": 1,
  "Patent Landscape": 1,
  "Commercial Viability Agent": 2,
  "CommercialViabilityAgent": 2,
  "IQVIA Supply Chain Agent": 3,
  "Supply Chain": 3,
};

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function DashboardPage() {
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [molecule, setMolecule] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedMessage, setPausedMessage] = useState("");
  const [insights, setInsights] = useState<any>(null);
  // sseSession is real state — incrementing it forces useEffect to re-run and open a fresh EventSource
  const [sseSession, setSseSession] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([
    { id: "a1", name: "Web Intelligence Agent", status: "idle", progress: 0, apiSource: "PubMed/Crossref", latency: "--", operation: "Pending" },
    { id: "a2", name: "Patent Landscape Agent", status: "idle", progress: 0, apiSource: "Europe PMC", latency: "--", operation: "Pending" },
    { id: "a3", name: "Commercial Viability Agent", status: "idle", progress: 0, apiSource: "FDA/YFinance", latency: "--", operation: "Pending" },
    { id: "a4", name: "IQVIA Supply Chain Agent", status: "idle", progress: 0, apiSource: "IQVIA/EXIM", latency: "--", operation: "Pending" },
  ]);

  // hasApprovedRef: prevents the HITL modal from re-showing when the new SSE
  // session replays the LangGraph checkpoint "paused" event after resume.
  const hasApprovedRef = useRef(false);
  // isApprovingRef: prevents double-clicks from firing multiple /resume calls.
  const isApprovingRef = useRef(false);

  // Use a closure-captured flag to safely stop stale EventSource handlers
  const addLog = useCallback((message: string, type: LogEntry["type"] = "info") => {
    setLogs(prev => [...prev, {
      id: uniqueId("log"),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    }]);
  }, []);

  const fetchReportData = useCallback(async (tid: string) => {
    addLog("Pipeline complete. Fetching intelligence report...", "success");
    try {
      if (tid !== "mock-uuid-fallback") {
        const res = await fetch(`${API_BASE_URL}/reports/${tid}`);
        const data = await res.json();
        setInsights(data.insights ?? null);
      } else {
        setInsights({ tam: 159.7, clinical_viability: "High", patent_freedom: "Clear", final_candidates: [{ disease_name: "Breast Cancer" }] });
      }
    } catch {
      addLog("Failed to fetch final report.", "warning");
    }
    setPhase("report");
  }, [addLog]);

  // SSE listener — re-runs when threadId changes OR when sseSession is incremented (after HITL approve)
  useEffect(() => {
    if (phase !== "orchestrating" || !threadId || threadId === "mock-uuid-fallback") return;

    let es: EventSource | null = null;
    let closed = false;

    es = new EventSource(`${API_BASE_URL}/pipeline/stream/${threadId}`);

    es.onmessage = (event) => {
      if (closed) return;
      try {
        const data = JSON.parse(event.data);

        // 1. Add log entry with unique key
        setLogs(prev => [...prev, {
          id: uniqueId("sse"),
          timestamp: data.ts ? new Date(data.ts).toLocaleTimeString() : new Date().toLocaleTimeString(),
          message: `[${data.agent}] ${data.message}`,
          type: data.status === "completed" || data.status === "done" ? "success" : "info",
        }]);

        // 2. Update agent card statuses
        setAgents(prev => prev.map(a => {
          if (a.name === data.agent) {
            let status: AgentStatus = "idle";
            if (data.status === "dispatching" || data.status === "running") status = "running";
            else if (data.status === "completed" || data.status === "done") status = "completed";
            return {
              ...a,
              status,
              latency: data.latency_ms != null ? `${data.latency_ms}ms` : a.latency,
              operation: data.message ? data.message.substring(0, 28) + (data.message.length > 28 ? "..." : "") : a.operation,
            };
          }
          return a;
        }));

        // 3. Sync canvas progress
        const stageIdx = AGENT_STAGE_MAP[data.agent];
        if (stageIdx !== undefined) {
          setCurrentStageIndex(stageIdx);
        }

        // 4. Handle MasterAgent control signals
        if (data.agent === "MasterAgent") {
          if (data.status === "completed") {
            closed = true;
            es?.close();
            fetchReportData(threadId);
          } else if (data.status === "paused" && !hasApprovedRef.current) {
            // Only show the HITL modal if we haven't already approved this run.
            // This stops the replayed checkpoint event from showing the modal again.
            setIsPaused(true);
            setPausedMessage(data.message || "Pipeline paused at human checkpoint.");
            closed = true;
            es?.close();
          }
        }
      } catch {
        // silently ignore malformed SSE frames
      }
    };

    es.onerror = () => {
      if (!closed) {
        closed = true;
        es?.close();
        // Show a warning in the telemetry feed so the user isn't left hanging
        setLogs(prev => [...prev, {
          id: uniqueId("err"),
          timestamp: new Date().toLocaleTimeString(),
          message: "⚠️ Connection to backend lost. The pipeline may have encountered an error — check the backend terminal.",
          type: "warning",
        }]);
      }
    };

    return () => {
      closed = true;
      es?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, sseSession]);

  // Fallback mock simulation
  useEffect(() => {
    if (phase !== "orchestrating" || !threadId || threadId !== "mock-uuid-fallback") return;
    let stage = 0;
    const iv = setInterval(() => {
      stage++;
      if (stage < 4) {
        setCurrentStageIndex(stage);
        addLog(`[Simulation] Stage ${stage} completed.`, "success");
        setAgents(prev => prev.map((a, i) => ({
          ...a,
          status: i === stage ? "running" : i < stage ? "completed" : "idle",
        })));
      } else {
        clearInterval(iv);
        fetchReportData("mock-uuid-fallback");
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [threadId, phase, addLog, fetchReportData]);

  const handleLaunch = async (input: string) => {
    setMolecule(input);
    setInsights(null);
    setIsPaused(false);
    setCurrentStageIndex(-1);
    hasApprovedRef.current = false;
    isApprovingRef.current = false;
    setAgents(prev => prev.map(a => ({ ...a, status: "idle", latency: "--", operation: "Pending" })));
    setLogs([{ id: uniqueId("init"), timestamp: new Date().toLocaleTimeString(), message: `Initializing pipeline for: ${input}`, type: "info" }]);
    setPhase("orchestrating");

    try {
      const res = await fetch(`${API_BASE_URL}/pipeline/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ molecule: input }),
      });
      const data = await res.json();
      if (data.thread_id) {
        setThreadId(data.thread_id);
        addLog(`Thread ID: ${data.thread_id}`, "success");
      } else {
        throw new Error("No thread_id in response");
      }
    } catch {
      addLog("Backend unreachable. Running in simulation mode.", "warning");
      setThreadId("mock-uuid-fallback");
    }
  };

  const handleApprove = async () => {
    if (!threadId || isApprovingRef.current) return; // guard against double-clicks
    isApprovingRef.current = true;
    hasApprovedRef.current = true; // block HITL modal from re-appearing on replayed events
    setIsPaused(false);
    addLog("Human approval granted. Resuming Phase 2...", "success");

    try {
      await fetch(`${API_BASE_URL}/pipeline/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId }),
      });
      // Increment sseSession state to trigger useEffect re-run and open fresh EventSource
      setSseSession(prev => prev + 1);
    } catch {
      addLog("Failed to resume pipeline.", "warning");
    }
  };

  const handleDecline = () => {
    setIsPaused(false);
    addLog("Human approval declined. Pipeline aborted.", "warning");
    setPhase("idle");
    setThreadId(null);
  };

  return (
    <div className="w-full h-full flex overflow-hidden">

      {/* Center Workspace */}
      <div className="flex-1 flex flex-col h-full border-r border-white/[0.04] relative">
        <AnimatePresence mode="wait">

          {/* Phase: Idle */}
          {phase === "idle" && (
            <motion.div key="idle" className="absolute inset-0" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <MoleculeInput onLaunch={handleLaunch} />
            </motion.div>
          )}

          {/* Phase: Orchestrating */}
          {phase === "orchestrating" && (
            <motion.div
              key="orchestrating"
              className="absolute inset-0 flex flex-col p-6 gap-6 overflow-y-auto custom-scrollbar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-[#F5F7FA] tracking-tight">Active Orchestration</h1>
                  <p className="text-sm text-[#94A3B8] mt-1">Analyzing <span className="text-white font-medium">{molecule}</span> across multi-agent network.</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isPaused ? "bg-[#F59E0B]/10 border-[#F59E0B]/20" : "bg-[#10B981]/10 border-[#10B981]/20"}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isPaused ? "bg-[#F59E0B]" : "bg-[#10B981]"}`} />
                  <span className={`text-[10px] uppercase tracking-wider font-semibold ${isPaused ? "text-[#F59E0B]" : "text-[#10B981]"}`}>
                    {isPaused ? "Awaiting Approval" : "Live Execution"}
                  </span>
                </div>
              </div>

              <OrchestrationCanvas currentStageIndex={currentStageIndex} />
              <LiveAgents agents={agents} />
              <TelemetryFeed logs={logs} />

              {/* HITL Approval Overlay */}
              <AnimatePresence>
                {isPaused && (
                  <motion.div
                    key="hitl-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="max-w-md w-full bg-black/90 border border-white/20 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center gap-6"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center">
                        <svg className="w-7 h-7 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">Human Approval Required</h3>
                        <p className="text-sm text-[#94A3B8] leading-relaxed">{pausedMessage || "Pipeline paused at IP clearance checkpoint. Review FTO-cleared candidates before proceeding to commercial analysis."}</p>
                      </div>
                      <div className="flex w-full gap-3">
                        <button
                          onClick={handleDecline}
                          className="flex-1 py-3 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-sm transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={handleApprove}
                          className="flex-1 py-3 px-4 rounded-lg bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-colors"
                        >
                          Approve & Resume
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Phase: Report */}
          {phase === "report" && (
            <motion.div
              key="report"
              className="absolute inset-0 p-6 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ReportView insights={insights} threadId={threadId} molecule={molecule} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Intelligence Panel */}
      <div className="w-[380px] shrink-0 bg-transparent p-6 flex flex-col h-full overflow-hidden border-l border-white/[0.04]">
        <AnimatePresence mode="wait">
          {phase === "idle" ? (
            <motion.div
              key="right-idle"
              className="h-full flex items-center justify-center text-[#475569] text-sm text-center px-8"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              Awaiting molecule input to generate intelligence insights.
            </motion.div>
          ) : (
            <motion.div
              key="right-active"
              className="h-full flex flex-col gap-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <IntelligencePanel isGenerating={phase === "orchestrating"} insights={insights} />
              <div className="mt-auto">
                <AssistantWidget compact={false} threadId={threadId} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
