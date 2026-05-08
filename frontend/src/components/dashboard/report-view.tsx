"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Download, Share2, CheckCircle, AlertTriangle } from "lucide-react";

export function ReportView() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col bg-[#050816]/30 rounded-2xl border border-white/[0.04] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/[0.04] bg-[#10131F]/50">
        <div>
          <h2 className="text-2xl font-semibold text-[#F5F7FA] tracking-tight">Intelligence Report Generated</h2>
          <p className="text-sm text-[#94A3B8] mt-1">Multi-agent analysis completed across 4 pipelines.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-[#F5F7FA] transition-colors">
            <Share2 className="w-4 h-4 text-[#94A3B8]" />
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded bg-white hover:bg-neutral-200 text-sm font-medium text-black transition-all">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08]">
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Clinical Viability</div>
            <div className="text-3xl font-bold text-[#10B981]">High</div>
            <div className="text-sm text-[#64748B] mt-1">Matches 3 unlinked disease pathways</div>
          </div>
          <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08]">
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Patent Freedom</div>
            <div className="text-3xl font-bold text-[#F59E0B]">Moderate</div>
            <div className="text-sm text-[#64748B] mt-1">2 conflicting active patents found</div>
          </div>
          <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08]">
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2">Market Potential</div>
            <div className="text-3xl font-bold text-[#F5F7FA]">$4.2B</div>
            <div className="text-sm text-[#64748B] mt-1">Est. TAM across indicated targets</div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-6 rounded-xl bg-black/20 border border-white/[0.04]">
          <h3 className="text-lg font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-white" />
            Executive Summary
          </h3>
          <div className="prose prose-invert prose-sm max-w-none text-[#94A3B8] space-y-4 leading-relaxed">
            <p>
              The multi-agent orchestration successfully mapped the target molecule across the Pharmacodynamic, Patent, Commercial, and Supply Chain databases.
            </p>
            <p>
              <strong>Biological Pathways:</strong> Analysis of PubMed and OpenTargets identified strong binding affinities for unlinked diseases in the oncology domain.
            </p>
            <p>
              <strong>Commercial Risks:</strong> While clinical viability is exceptionally high, the patent landscape indicates potential infringement risks in the EU region until Q3 2028.
            </p>
          </div>
        </div>

        {/* Action Items */}
        <div className="p-6 rounded-xl bg-black/20 border border-white/[0.04]">
          <h3 className="text-lg font-semibold text-[#F5F7FA] mb-4">Recommended Actions</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-[#94A3B8]">
              <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
              <span>Proceed to pre-clinical validation for identified oncology targets.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-[#94A3B8]">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
              <span>Initiate deeper Freedom to Operate (FTO) review specifically for the European market constraints.</span>
            </li>
          </ul>
        </div>

      </div>
    </motion.div>
  );
}
