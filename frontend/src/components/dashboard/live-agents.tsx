"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Lightbulb, FileSearch, Box } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  status: "idle" | "running" | "completed" | "error";
  progress: number;
  apiSource: string;
  latency: string;
  operation: string;
}

interface LiveAgentsProps {
  agents: Agent[];
}

const getIcon = (name: string) => {
  if (name.includes("Web")) return Globe;
  if (name.includes("Patent")) return FileSearch;
  if (name.includes("Commercial")) return Lightbulb;
  if (name.includes("Supply")) return Box;
  return Globe;
};

export function LiveAgents({ agents }: LiveAgentsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map((agent, index) => {
        const Icon = getIcon(agent.name);
        const isRunning = agent.status === "running";
        
        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
            className={`relative p-5 rounded-xl border bg-black/40 backdrop-blur-md overflow-hidden transition-all duration-500 ${
              isRunning ? "border-white/40" : "border-white/[0.04]"
            }`}
          >
            {isRunning && (
              <div className="absolute top-0 left-0 w-full h-0.5 bg-white/[0.04] overflow-hidden">
                <motion.div 
                  className="h-full bg-white"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ width: "50%" }}
                />
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded border ${isRunning ? "bg-white/10 text-white border-white/20" : "bg-white/5 text-[#64748B] border-transparent"}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? "bg-[#10B981] animate-pulse" : agent.status === "completed" ? "bg-[#10B981]" : "bg-[#64748B]"}`} />
                <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-medium">{agent.status}</span>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-[#F5F7FA] mb-1">{agent.name}</h3>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#64748B]">SRC:</span>
                <span className="text-[#94A3B8]">{agent.apiSource}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#64748B]">LAT:</span>
                <span className="text-[#94A3B8]">{agent.latency}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono pt-2 border-t border-white/[0.04]">
                <span className="text-[#64748B]">OP:</span>
                <span className="text-[#10B981] truncate ml-2">{agent.operation}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
