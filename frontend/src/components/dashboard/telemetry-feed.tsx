"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning";
}

interface TelemetryFeedProps {
  logs: LogEntry[];
}

export function TelemetryFeed({ logs }: TelemetryFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="w-full h-48 bg-[#0B0F1A]/80 border border-white/[0.04] rounded-2xl flex flex-col overflow-hidden backdrop-blur-md">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-[#10131F]/50">
        <Terminal className="w-4 h-4 text-[#64748B]" />
        <span className="text-xs font-medium text-[#94A3B8] tracking-widest uppercase">Live Telemetry</span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth scrollbar-hide"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 font-mono text-xs"
            >
              <span className="text-[#64748B] shrink-0">[{log.timestamp}]</span>
              <span className={`
                ${log.type === "success" ? "text-[#10B981]" : ""}
                ${log.type === "warning" ? "text-[#F59E0B]" : ""}
                ${log.type === "info" ? "text-[#94A3B8]" : ""}
              `}>
                {log.message}
              </span>
            </motion.div>
          ))}
          {logs.length === 0 && (
            <div className="text-[#475569] text-xs font-mono italic">Waiting for orchestration events...</div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
