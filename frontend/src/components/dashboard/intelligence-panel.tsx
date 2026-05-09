"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, TrendingUp, Target, Activity } from "lucide-react";

interface InsightData {
  title: string;
  value: string;
  trend?: string;
  status: "good" | "warning" | "neutral";
  icon: React.ElementType;
}

export function IntelligencePanel({ isGenerating = false, insights = null }: { isGenerating?: boolean, insights?: any }) {
  const patentStatus = insights?.patent_freedom || "TBD";
  const patentIsGood = patentStatus === "Clear";
  const patentIsWarning = patentStatus === "Partially Blocked";

  const viability = insights?.clinical_viability || "TBD";
  const viabilityIsGood = viability === "High";
  const viabilityIsWarning = viability === "Medium";

  const displayInsights: InsightData[] = insights ? [
    { title: "Clinical Viability", value: viability, status: viabilityIsGood ? "good" : viabilityIsWarning ? "warning" : "neutral", icon: Target },
    { title: "Est. TAM", value: `$${insights.tam || 0}B`, status: "good", icon: TrendingUp },
    { title: "Patent Risk", value: patentStatus, status: patentIsGood ? "good" : patentIsWarning ? "warning" : "neutral", icon: ShieldAlert },
    { title: "Repurposing Score", value: `${insights.repurposing_score || 0}/10`, status: "good", icon: Activity },
  ] : [
    { title: "Disease Target Fit", value: "--", status: "neutral", icon: Target },
    { title: "Est. TAM", value: "--", status: "neutral", icon: TrendingUp },
    { title: "Patent Risk", value: "--", status: "neutral", icon: ShieldAlert },
    { title: "Repurposing Score", value: "--", status: "neutral", icon: Activity },
  ];


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[#F5F7FA] font-light tracking-tight text-lg">Opportunity Insights</h3>
        {isGenerating && (
          <span className="flex items-center gap-2 text-[10px] text-white uppercase tracking-widest font-semibold bg-white/10 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Computing
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayInsights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={insight.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-4 rounded-xl bg-black/40 border border-white/[0.08] backdrop-blur-md relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-12 h-12 text-white" />
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-4 h-4 ${
                  insight.status === 'good' ? 'text-[#10B981]' : 
                  insight.status === 'warning' ? 'text-[#F59E0B]' : 'text-[#64748B]'
                }`} />
                <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">{insight.title}</span>
              </div>
              
              <div className="flex items-end gap-2">
                <span className="text-2xl font-semibold text-[#F5F7FA] tracking-tight">{insight.value}</span>
                {insight.trend && (
                  <span className={`text-xs mb-1 font-medium ${
                    insight.status === 'good' ? 'text-[#10B981]' : 'text-[#F59E0B]'
                  }`}>
                    {insight.trend}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
