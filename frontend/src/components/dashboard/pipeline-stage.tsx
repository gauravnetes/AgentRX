"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

export type PipelineStageData = {
  label: string;
  status: "pending" | "active" | "completed";
  description?: string;
};

function PipelineStageNode({ data, isConnectable }: NodeProps<PipelineStageData>) {
  const isActive = data.status === "active";
  const isCompleted = data.status === "completed";

  return (
    <div className="relative group">
      <div className={`relative z-10 flex flex-col min-w-[200px] p-4 rounded-xl border backdrop-blur-md transition-all duration-500 ${
        isActive 
          ? "bg-white/10 border-white/40" 
          : isCompleted 
            ? "bg-black/40 border-white/[0.08]" 
            : "bg-black/20 border-white/[0.02] opacity-60"
      }`}>
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 !bg-[#64748B] !border-none" />
        
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : isActive ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Circle className="w-5 h-5 text-[#475569]" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-semibold tracking-wide ${isActive || isCompleted ? "text-[#F5F7FA]" : "text-[#64748B]"}`}>
              {data.label}
            </span>
            {data.description && (
              <span className="text-[10px] text-[#94A3B8] mt-0.5 leading-tight line-clamp-1">
                {data.description}
              </span>
            )}
          </div>
        </div>

        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 !bg-[#64748B] !border-none" />
      </div>
    </div>
  );
}

export const PipelineStage = memo(PipelineStageNode);
