"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileText, Download, Target, ShieldCheck, TrendingUp,
  Package, Beaker, Activity, BarChart3, Zap,
  CheckCircle2, AlertTriangle, ArrowRight
} from "lucide-react";

interface Candidate {
  disease_name: string;
  tam_estimate?: string;
  fto_status?: string;
  trial_complexity_score?: number;
  clinical_trials?: number;
  competitor_landscape?: string;
  ai_analysis?: string;
  is_adverse?: boolean;
  effect_direction?: string;
  recommendation?: string;
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
  viable_candidate_count?: number;
  adverse_candidate_count?: number;
}

interface ReportViewProps {
  insights: Insights | null;
  threadId: string | null;
  molecule?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/* ── Animated radial gauge ── */
function Gauge({ value, max, color, size = 64 }: { value: number; max: number; color: string; size?: number }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const dashOffset = circ * (1 - pct);

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={4} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: dashOffset }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.22} fontWeight={700}>
        {value}
      </text>
    </svg>
  );
}

/* ── Mini progress bar ── */
function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

/* ── Status chip ── */
function StatusChip({ label, variant }: { label: string; variant: "success" | "warning" | "danger" | "neutral" }) {
  const map = {
    success: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20",
    warning: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20",
    danger:  "text-[#F87171] bg-[#F87171]/10 border-[#F87171]/20",
    neutral: "text-[#94A3B8] bg-white/5 border-white/10",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${map[variant]}`}>
      {label}
    </span>
  );
}

export function ReportView({ insights, threadId, molecule }: ReportViewProps) {
  const candidates: Candidate[] = insights?.final_candidates || [];
  // Separate viable from adverse for correct display
  const viableCandidates  = candidates.filter(c => !c.is_adverse && c.effect_direction !== "WORSENS_OR_CAUSES" && !(c.tam_estimate || "").includes("Adverse"));
  const adverseCandidates = candidates.filter(c => c.is_adverse || c.effect_direction === "WORSENS_OR_CAUSES" || (c.tam_estimate || "").includes("Adverse"));
  const leadCandidate     = viableCandidates[0] ?? null;

  const pdfUrl = threadId && threadId !== "mock-uuid-fallback"
    ? `${API_BASE_URL}/pipeline/report/${threadId}`
    : null;
  const dlUrl = threadId && threadId !== "mock-uuid-fallback"
    ? `${API_BASE_URL}/pipeline/report/${threadId}/download`
    : null;

  const viabilityColor =
    insights?.clinical_viability === "High"   ? "text-[#10B981]" :
    insights?.clinical_viability === "Medium" ? "text-[#F59E0B]" : "text-[#F87171]";

  const tamNum   = insights?.tam || 0;
  const repScore = insights?.repurposing_score ?? 0;


  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#10B981]">Report Ready</span>
          </div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            {molecule || "Molecule"} Intelligence Report
          </h2>
          <p className="text-xs text-[#475569] mt-0.5">
            Multi-agent analysis across 6 pipeline stages • {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} evaluated
          </p>
        </div>
        <div className="flex gap-2">
          {pdfUrl && (
            <a href={pdfUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white transition-colors">
              <FileText className="w-3.5 h-3.5" /> View PDF
            </a>
          )}
          {dlUrl && (
            <a href={dlUrl} download
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-xs font-semibold text-black transition-colors">
              <Download className="w-3.5 h-3.5" /> Export PDF
            </a>
          )}
        </div>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ━━ KPI Hero Row ━━ */}
        <div className="grid grid-cols-4 gap-3">
          {/* TAM */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-[#6366F1]/10 to-transparent border border-[#6366F1]/15">
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 className="w-3.5 h-3.5 text-[#6366F1]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6366F1]">Total Market</span>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">
              {tamNum > 0 ? `$${tamNum}` : "—"}
              {tamNum > 0 && <span className="text-lg text-[#6366F1] ml-0.5">B</span>}
            </div>
            <div className="text-[10px] text-[#475569] mt-1">Addressable Market (TAM)</div>
          </motion.div>

          {/* Viability */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="p-4 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/15">
            <div className="flex items-center gap-1.5 mb-3">
              <Activity className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#10B981]">Viability</span>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{insights?.clinical_viability || "—"}</div>
            <div className="text-[10px] text-[#475569] mt-1">Clinical viability rating</div>
          </motion.div>

          {/* Patent */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/15">
            <div className="flex items-center gap-1.5 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#F59E0B]">Patent</span>
            </div>
            <div className="text-3xl font-bold text-white tracking-tight">{insights?.patent_freedom || "—"}</div>
            <div className="text-[10px] text-[#475569] mt-1">FTO clearance status</div>
          </motion.div>

          {/* Repurposing Score Gauge */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="p-4 rounded-xl bg-gradient-to-br from-[#EC4899]/10 to-transparent border border-[#EC4899]/15 flex items-center gap-4">
            <Gauge value={Math.round(repScore)} max={10} color="#EC4899" />
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#EC4899]">Score</span>
              <div className="text-[10px] text-[#475569] mt-0.5 leading-snug">Repurposing Potential</div>
            </div>
          </motion.div>
        </div>

        {/* ━━ Supply Chain + Lead Info ━━ */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            className="p-4 rounded-xl border border-white/[0.06] bg-black/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-[#06B6D4]" />
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#06B6D4] mb-1">Supply Chain</div>
              <div className="text-sm font-semibold text-white">{insights?.supply_chain_risk || "Analysing…"}</div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            className="p-4 rounded-xl border border-white/[0.06] bg-black/30 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="flex-1">
              <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#10B981] mb-1">Lead Candidate</div>
              {leadCandidate ? (
                <>
                  <div className="text-sm font-semibold text-white">{leadCandidate.disease_name}</div>
                  {leadCandidate.tam_estimate && (
                    <div className="text-[10px] text-[#475569] mt-0.5">TAM: {leadCandidate.tam_estimate}</div>
                  )}
                </>
              ) : (
                <div className="text-sm text-[#475569]">No viable targets</div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ━━ Candidate Table ━━ */}
        {candidates.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-white/[0.06] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-black/40 border-b border-white/[0.04]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Beaker className="w-4 h-4 text-[#94A3B8]" />
                Candidates
                <span className="text-[10px] text-[#475569] font-normal ml-1">({candidates.length})</span>
              </h3>
              <div className="flex items-center gap-2">
                {viableCandidates.length > 0 && (
                  <StatusChip label={`${viableCandidates.length} Viable`} variant="success" />
                )}
                {adverseCandidates.length > 0 && (
                  <StatusChip label={`${adverseCandidates.length} Adverse`} variant="danger" />
                )}
              </div>
            </div>

            {/* Candidate rows */}
            <div className="divide-y divide-white/[0.03]">
              {candidates.map((c, i) => {
                const isAdverse = c.is_adverse ||
                  c.effect_direction === "WORSENS_OR_CAUSES" ||
                  (c.tam_estimate || "").includes("Adverse");
                const isClear = !isAdverse && (c.fto_status === "CLEAR" || c.fto_status === "Clear");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06 }}
                    className={`px-5 py-3.5 flex items-center gap-4 transition-colors ${
                      isAdverse
                        ? "bg-[#F87171]/[0.03] hover:bg-[#F87171]/[0.06] border-l-2 border-l-[#F87171]/30"
                        : "hover:bg-white/[0.015]"
                    }`}
                  >
                    {/* Rank or warning icon */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isAdverse
                        ? "bg-[#F87171]/10 border border-[#F87171]/20"
                        : "bg-white/[0.04] border border-white/[0.06]"
                    }`}>
                      {isAdverse
                        ? <AlertTriangle className="w-3.5 h-3.5 text-[#F87171]" />
                        : <span className="text-[11px] font-bold text-[#64748B]">{viableCandidates.indexOf(c) + 1}</span>
                      }
                    </div>

                    {/* Name + AI analysis */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${
                        isAdverse ? "text-[#F87171]" : "text-white"
                      }`}>{c.disease_name}</div>
                      {isAdverse ? (
                        <div className="text-[10px] text-[#F87171]/60 mt-0.5">Safety flag — Do not commercialize</div>
                      ) : c.ai_analysis ? (
                        <div className="text-[10px] text-[#475569] mt-0.5 truncate">{c.ai_analysis.slice(0, 80)}…</div>
                      ) : null}
                    </div>

                    {/* TAM */}
                    <div className="text-right shrink-0 w-24">
                      <div className={`text-xs font-semibold ${
                        isAdverse ? "text-[#F87171]/60" : "text-white"
                      }`}>{c.tam_estimate || "—"}</div>
                      <div className="text-[9px] text-[#334155]">TAM</div>
                    </div>

                    {/* Status chip */}
                    <div className="shrink-0">
                      {isAdverse
                        ? <StatusChip label="SAFETY FLAG" variant="danger" />
                        : isClear
                          ? <StatusChip label="FTO CLEAR" variant="success" />
                          : <StatusChip label={c.fto_status || "Pending"} variant="warning" />
                      }
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ━━ Executive Summary ━━ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 bg-black/40 border-b border-white/[0.04] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#94A3B8]" />
            <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
          </div>
          <div className="px-5 py-4">
            <div className="text-sm text-[#94A3B8] leading-relaxed">
              {insights?.executive_summary
                ? <p>{insights.executive_summary}</p>
                : (
                  <div className="space-y-3">
                    <p>Multi-agent orchestration successfully mapped <strong className="text-white">{molecule || "the target molecule"}</strong> across PubMed, Europe PMC, FDA ClinicalTrials, YFinance and IQVIA datasets.</p>
                    {candidates.length > 0 && (
                      <p>
                        <strong className="text-white">Lead Candidate:</strong> {candidates[0]?.disease_name} — FTO cleared and commercially viable at {candidates[0]?.tam_estimate || "significant"} TAM.
                      </p>
                    )}
                    <p>
                      <strong className="text-white">Patent Status:</strong> {insights?.patent_freedom === "Clear"
                        ? "No biological patent conflicts detected. IP space is clear."
                        : "Patent conflicts exist. Initiate FTO review before commercialisation."
                      }
                    </p>
                  </div>
                )
              }
            </div>
          </div>
        </motion.div>

        {/* ━━ Next Steps ━━ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 bg-black/40 border-b border-white/[0.04] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-white">Recommended Actions</h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            {candidates.length > 0 && (
              <div className="flex items-start gap-3 text-sm text-[#94A3B8]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>Proceed to pre-clinical validation for <strong className="text-white">{candidates[0]?.disease_name}</strong> — top-ranked lead candidate.</span>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm text-[#94A3B8]">
              <TrendingUp className="w-4 h-4 text-[#6366F1] shrink-0 mt-0.5" />
              <span>Commission detailed IQVIA market study for TAM validation across {candidates.length || "identified"} indication{candidates.length !== 1 ? "s" : ""}.</span>
            </div>
            {pdfUrl && (
              <div className="flex items-start gap-3 text-sm text-[#94A3B8]">
                <ArrowRight className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span>Full AI-synthesised report is ready. <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-white underline underline-offset-2">Open PDF →</a></span>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
