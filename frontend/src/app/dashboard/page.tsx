"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoleculeInput } from "@/components/dashboard/molecule-input";
import { OrchestrationCanvas } from "@/components/dashboard/orchestration-canvas";
import { LiveAgents } from "@/components/dashboard/live-agents";
import { TelemetryFeed } from "@/components/dashboard/telemetry-feed";
import { IntelligencePanel } from "@/components/dashboard/intelligence-panel";
import { AssistantWidget } from "@/components/dashboard/assistant-widget";
import { ReportView } from "@/components/dashboard/report-view";

type AppPhase = "idle" | "orchestrating" | "report";

export default function DashboardPage() {
  const [phase, setPhase] = useState<AppPhase>("idle");
  const [currentStageIndex, setCurrentStageIndex] = useState(-1);
  const [molecule, setMolecule] = useState("");
  const [logs, setLogs] = useState<{ id: string; timestamp: string; message: string; type: "info"|"success"|"warning" }[]>([]);

  const handleLaunch = (input: string) => {
    setMolecule(input);
    setPhase("orchestrating");
    setCurrentStageIndex(0);
    setLogs([{ id: "1", timestamp: new Date().toLocaleTimeString(), message: `Pipeline initialized for molecule: ${input}`, type: "info" }]);
  };

  // Mock Orchestration Flow
  useEffect(() => {
    if (phase === "orchestrating") {
      let stage = 0;
      const interval = setInterval(() => {
        stage += 1;
        if (stage < 4) {
          setCurrentStageIndex(stage);
          setLogs((prev) => [
            ...prev,
            { 
              id: Date.now().toString(), 
              timestamp: new Date().toLocaleTimeString(), 
              message: `Stage ${stage} completed. Moving to next phase.`, 
              type: "success" 
            }
          ]);
        } else {
          clearInterval(interval);
          setPhase("report");
        }
      }, 3000); // 3 seconds per stage

      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="w-full h-full flex overflow-hidden">
      
      {/* Center Workspace (flex-1) */}
      <div className="flex-1 flex flex-col h-full border-r border-white/[0.04] relative">
        <AnimatePresence mode="wait">
          {/* Phase 0: Idle */}
          {phase === "idle" && (
            <motion.div key="idle" className="absolute inset-0" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <MoleculeInput onLaunch={handleLaunch} />
            </motion.div>
          )}

          {/* Phase 1: Orchestrating */}
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                  <span className="text-[10px] text-[#10B981] uppercase tracking-wider font-semibold">Live Execution</span>
                </div>
              </div>

              {/* React Flow Canvas */}
              <OrchestrationCanvas currentStageIndex={currentStageIndex} />

              {/* Live Agents Grid */}
              <LiveAgents 
                agents={[
                  { id: "a1", name: "Web Intelligence", status: currentStageIndex === 0 ? "running" : currentStageIndex > 0 ? "completed" : "idle", progress: 100, apiSource: "PubMed Entrez", latency: "124ms", operation: "Pathway Analysis" },
                  { id: "a2", name: "Patent Landscape", status: currentStageIndex === 1 ? "running" : currentStageIndex > 1 ? "completed" : "idle", progress: 100, apiSource: "USPTO API", latency: "310ms", operation: "FTO Clearance" },
                  { id: "a3", name: "Commercial Viability", status: currentStageIndex === 2 ? "running" : currentStageIndex > 2 ? "completed" : "idle", progress: 100, apiSource: "OpenTargets", latency: "185ms", operation: "TAM Calculation" },
                  { id: "a4", name: "Supply Chain", status: currentStageIndex === 3 ? "running" : currentStageIndex > 3 ? "completed" : "idle", progress: 100, apiSource: "IQVIA Data", latency: "402ms", operation: "EXIM Mapping" },
                ]} 
              />

              {/* Telemetry Logs */}
              <TelemetryFeed logs={logs} />
            </motion.div>
          )}

          {/* Phase 2: Report */}
          {phase === "report" && (
            <motion.div 
              key="report"
              className="absolute inset-0 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ReportView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Intelligence Panel (w-80 or w-96) */}
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
              {/* Stacked Cards */}
              <IntelligencePanel isGenerating={phase === "orchestrating"} />
              
              {/* Assistant Widget (Bottom) */}
              <div className="mt-auto">
                <AssistantWidget compact={phase === "report"} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
