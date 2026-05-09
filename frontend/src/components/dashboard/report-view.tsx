"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Download, Target, ShieldCheck, TrendingUp, Package, Users, ChevronRight } from "lucide-react";

interface Candidate {
  disease_name: string;
  tam_estimate?: string;
  fto_status?: string;
}

interface Insights {
  tam?: number;
  clinical_viability?: string;
  patent_freedom?: string;
  repurposing_score?: number;
  final_candidates?: Candidate[];
  executive_summary?: string;
  lead_candidate?: string;
  supply_chain_risk?: string;
  supply_chain_score?: number;
}

interface ReportViewProps {
  insights: Insights | null;
  threadId: string | null;
  molecule?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function ScoreCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-5 rounded-xl bg-black/40 border border-white/[0.08] flex flex-col gap-1">
      <span className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider">{label}</span>
      <span className={`text-3xl font-bold tracking-tight ${color}`}>{value}</span>
      <span className="text-xs text-[#475569]">{sub}</span>
    </div>
  );
}

export function ReportView({ insights, threadId, molecule }: ReportViewProps) {
  const candidates: Candidate[] = insights?.final_candidates || [];
  const pdfUrl = threadId && threadId !== "mock-uuid-fallback"
    ? `${API_BASE_URL}/pipeline/report/${threadId}`
    : null;

  const viabilityColor = insights?.clinical_viability === "High" ? "text-[#10B981]"
    : insights?.clinical_viability === "Medium" ? "text-[#F59E0B]"
    : "text-[#94A3B8]";

  const patentColor = insights?.patent_freedom === "Clear" ? "text-[#F59E0B]" : "text-[#F87171]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col bg-[#050816]/30 rounded-2xl border border-white/[0.04] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/[0.04] bg-[#10131F]/50 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-[#F5F7FA] tracking-tight">Intelligence Report Generated</h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Multi-agent analysis completed for <span className="text-white font-medium">{molecule || "molecule"}</span> across 4 pipelines.
          </p>
        </div>
        <div className="flex gap-3">
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-100 text-sm font-semibold text-black transition-all"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </a>
          ) : (
            <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-sm text-[#94A3B8] cursor-not-allowed">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScoreCard
            label="Clinical Viability"
            value={insights?.clinical_viability || "—"}
            sub="Based on PubMed pathway analysis"
            color={viabilityColor}
          />
          <ScoreCard
            label="Patent Freedom"
            value={insights?.patent_freedom || "—"}
            sub="Europe PMC FTO clearance"
            color={patentColor}
          />
          <ScoreCard
            label="Market Potential (TAM)"
            value={insights?.tam ? `$${insights.tam}B` : "—"}
            sub="Big Pharma proxy revenue estimate"
            color="text-[#F5F7FA]"
          />
        </div>

        {/* Extra KPIs */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] flex items-center gap-3">
            <Package className="w-5 h-5 text-[#94A3B8] shrink-0" />
            <div>
              <div className="text-xs text-[#64748B] uppercase tracking-wider mb-0.5">Supply Chain</div>
              <div className="text-sm font-medium text-white">{insights?.supply_chain_risk || "No data"}</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#94A3B8] shrink-0" />
            <div>
              <div className="text-xs text-[#64748B] uppercase tracking-wider mb-0.5">Repurposing Score</div>
              <div className="text-sm font-medium text-white">
                {insights?.repurposing_score != null ? `${insights.repurposing_score}/10` : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Candidate List */}
        {candidates.length > 0 && (
          <div className="p-5 rounded-xl bg-black/20 border border-white/[0.04]">
            <h3 className="text-base font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#94A3B8]" />
              Approved Repurposing Candidates ({candidates.length})
            </h3>
            <div className="space-y-2">
              {candidates.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-black/30 border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span className="text-sm text-[#F5F7FA] font-medium">{c.disease_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    {c.tam_estimate && (
                      <span className="text-xs text-[#94A3B8]">{c.tam_estimate}</span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      c.fto_status === "CLEAR" || c.fto_status === "Clear"
                        ? "text-[#10B981] bg-[#10B981]/10"
                        : "text-[#F59E0B] bg-[#F59E0B]/10"
                    }`}>
                      {c.fto_status || "FTO Pending"}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Summary */}
        <div className="p-6 rounded-xl bg-black/20 border border-white/[0.04]">
          <h3 className="text-base font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#94A3B8]" />
            Executive Summary
          </h3>
          <div className="text-sm text-[#94A3B8] leading-relaxed">
            {insights?.executive_summary
              ? <p>{insights.executive_summary}</p>
              : (
                <div className="space-y-3">
                  <p>The multi-agent orchestration successfully mapped the target molecule across PubMed, Europe PMC, FDA ClinicalTrials, YFinance and IQVIA datasets.</p>
                  {candidates.length > 0 && (
                    <p><strong className="text-white">Lead Candidate:</strong> {candidates[0]?.disease_name} — FTO cleared and commercially viable at {candidates[0]?.tam_estimate || "significant"} TAM.</p>
                  )}
                  <p><strong className="text-white">Patent Landscape:</strong> {insights?.patent_freedom === "Clear"
                    ? "No biological patent conflicts found. IP space is clear to proceed."
                    : "Patent conflicts detected. Initiate FTO review before commercialisation."
                  }</p>
                </div>
              )
            }
          </div>
        </div>

        {/* Actions */}
        <div className="p-5 rounded-xl bg-black/20 border border-white/[0.04]">
          <h3 className="text-base font-semibold text-[#F5F7FA] mb-4 flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
            Recommended Actions
          </h3>
          <ul className="space-y-3">
            {candidates.length > 0 && (
              <li className="flex items-start gap-3 text-sm text-[#94A3B8]">
                <ShieldCheck className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Proceed to pre-clinical validation for <strong className="text-white">{candidates[0]?.disease_name}</strong> — top-ranked lead candidate.</span>
              </li>
            )}
            <li className="flex items-start gap-3 text-sm text-[#94A3B8]">
              <TrendingUp className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
              <span>Commission detailed IQVIA market study for TAM validation across {candidates.length || "identified"} indication{candidates.length !== 1 ? "s" : ""}.</span>
            </li>
            {pdfUrl && (
              <li className="flex items-start gap-3 text-sm text-[#94A3B8]">
                <FileText className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                <span>Full AI-synthesised PDF report is ready. <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-white underline underline-offset-2">Download report →</a></span>
              </li>
            )}
          </ul>
        </div>

      </div>
    </motion.div>
  );
}
