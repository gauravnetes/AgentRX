"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Loader2, CheckCircle2,
  Clock, ExternalLink, ChevronRight, Target, ShieldCheck,
  TrendingUp, X, Activity, BarChart3, Beaker, Package, Zap
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type Run = {
  id: string;
  thread_id: string;
  molecule: string;
  status: string;
  created_at: string;
  insights?: {
    tam?: number;
    clinical_viability?: string;
    patent_freedom?: string;
    repurposing_score?: number;
    supply_chain_risk?: string;
    final_candidates?: { disease_name: string; fto_status?: string; tam_estimate?: string; ai_analysis?: string }[];
    executive_summary?: string;
  };
};

type ViewMode = "pdf" | "details";

/* ── Animated radial gauge ── */
function Gauge({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(value / max, 1));
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3.5} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={size * 0.24} fontWeight={700}>
        {value}
      </text>
    </svg>
  );
}

function StatusChip({ label, variant }: { label: string; variant: "success" | "warning" | "neutral" }) {
  const map = {
    success: "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20",
    warning: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20",
    neutral: "text-[#94A3B8] bg-white/5 border-white/10",
  };
  return <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${map[variant]}`}>{label}</span>;
}

export default function ReportsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("pdf");

  useEffect(() => {
    fetch(`${API_BASE_URL}/reports`)
      .then(r => r.json())
      .then((data: Run[]) => {
        const sorted = Array.isArray(data)
          ? data.filter(r => r.status === "COMPLETED").sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : [];
        setRuns(sorted);
        if (sorted.length > 0) loadDetail(sorted[0]);
      })
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (run: Run) => {
    setSelected(run);
    setViewMode("pdf");
    if (run.insights || run.status !== "COMPLETED") return;
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${run.thread_id}`);
      const detail = await res.json();
      const enriched = { ...run, insights: detail.insights };
      setRuns(prev => prev.map(r => r.thread_id === run.thread_id ? enriched : r));
      setSelected(enriched);
    } catch { /* silent */ }
    finally { setDetailLoading(false); }
  };

  const deleteRun = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`${API_BASE_URL}/reports/${threadId}`, { method: "DELETE" });
      setRuns(prev => prev.filter(r => r.thread_id !== threadId));
      if (selected?.thread_id === threadId) setSelected(null);
    } catch { /* silent */ }
  };

  const pdfUrl = selected ? `${API_BASE_URL}/pipeline/report/${selected.thread_id}` : null;
  const dlUrl  = selected ? `${API_BASE_URL}/pipeline/report/${selected.thread_id}/download` : null;

  const ins = selected?.insights;
  const candidates = ins?.final_candidates || [];
  const tamNum = ins?.tam || 0;
  const repScore = ins?.repurposing_score ?? 0;

  return (
    <div className="w-full h-full flex overflow-hidden">

      {/* ── Left sidebar ── */}
      <div className="w-[240px] shrink-0 h-full border-r border-white/[0.04] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] shrink-0">
          <h1 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#94A3B8]" /> Reports
          </h1>
          <p className="text-[10px] text-[#475569] mt-0.5">{runs.length} completed</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B] px-5 py-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          ) : runs.length === 0 ? (
            <p className="text-xs text-[#475569] px-5 py-6 leading-relaxed">No completed reports yet.</p>
          ) : (
            runs.map((run, i) => {
              const active = selected?.thread_id === run.thread_id;
              return (
                <motion.div key={run.thread_id} onClick={() => loadDetail(run)}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`group w-full text-left px-4 py-3 border-b border-white/[0.03] flex items-start gap-3 transition-colors relative cursor-pointer ${active ? "bg-white/[0.07]" : "hover:bg-white/[0.02]"}`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${active ? "text-[#10B981]" : "text-[#334155]"}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${active ? "text-white" : "text-[#94A3B8]"}`}>{run.molecule}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-[#334155]" />
                      <span className="text-[10px] text-[#475569]">{new Date(run.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={(e) => deleteRun(run.thread_id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-900/50 text-[#475569] hover:text-[#F87171] shrink-0 mt-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center flex-col gap-3 text-[#334155]">
              <FileText className="w-10 h-10 opacity-20" />
              <span className="text-sm">Select a report to preview</span>
            </motion.div>
          ) : (
            <motion.div key={selected.thread_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }} className="flex-1 flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-5 py-3 border-b border-white/[0.04] shrink-0 flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-0.5">
                  <button onClick={() => setViewMode("pdf")}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${viewMode === "pdf" ? "bg-white text-black" : "text-[#94A3B8] hover:text-white"}`}>
                    PDF Preview
                  </button>
                  <button onClick={() => setViewMode("details")}
                    className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${viewMode === "details" ? "bg-white text-black" : "text-[#94A3B8] hover:text-white"}`}>
                    Analytics
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white">{selected.molecule}</span>
                  <span className="text-[10px] text-[#334155] ml-2 font-mono">{selected.thread_id.slice(0, 14)}…</span>
                </div>
                {dlUrl && (
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={pdfUrl!} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> New tab
                    </a>
                    <a href={dlUrl} download
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-xs font-semibold text-black transition-colors">
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">

                  {/* ── PDF Preview ── */}
                  {viewMode === "pdf" && pdfUrl ? (
                    <motion.div key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full h-full p-3">
                      <div className="w-full h-full rounded-xl overflow-hidden border border-white/[0.06] bg-[#111318] relative"
                        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)" }}>
                        {/* Top chrome bar */}
                        <div className="h-8 bg-[#1a1d24] border-b border-white/[0.04] flex items-center px-3 gap-2 shrink-0">
                          <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F87171]/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/40" />
                            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]/40" />
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[9px] text-[#334155] font-mono truncate">AgentRX_Report_{selected.thread_id.slice(0, 8)}.pdf</span>
                          </div>
                        </div>
                        <iframe key={pdfUrl} src={pdfUrl} className="w-full border-0"
                          style={{ height: "calc(100% - 32px)" }}
                          title={`${selected.molecule} report`} />
                      </div>
                    </motion.div>
                  ) : viewMode === "pdf" ? (
                    <motion.div key="no-pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex-1 flex items-center justify-center h-full text-[#475569] flex-col gap-2">
                      <FileText className="w-8 h-8 opacity-20" /><span className="text-sm">PDF not available</span>
                    </motion.div>
                  ) : null}

                  {/* ── Analytics / Details View ── */}
                  {viewMode === "details" && (
                    <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full overflow-y-auto p-5 space-y-4">

                      {detailLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading insights…
                        </div>
                      ) : (
                        <>
                          {/* ── KPI Hero ── */}
                          <div className="grid grid-cols-4 gap-3">
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                              className="p-4 rounded-xl bg-gradient-to-br from-[#6366F1]/10 to-transparent border border-[#6366F1]/15">
                              <div className="flex items-center gap-1.5 mb-2">
                                <BarChart3 className="w-3 h-3 text-[#6366F1]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6366F1]">Market</span>
                              </div>
                              <div className="text-2xl font-bold text-white">
                                {tamNum > 0 ? `$${tamNum}` : "—"}{tamNum > 0 && <span className="text-sm text-[#6366F1] ml-0.5">B</span>}
                              </div>
                              <div className="text-[9px] text-[#475569] mt-1">TAM Estimate</div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                              className="p-4 rounded-xl bg-gradient-to-br from-[#10B981]/10 to-transparent border border-[#10B981]/15">
                              <div className="flex items-center gap-1.5 mb-2">
                                <Activity className="w-3 h-3 text-[#10B981]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#10B981]">Viability</span>
                              </div>
                              <div className="text-2xl font-bold text-white">{ins?.clinical_viability || "—"}</div>
                              <div className="text-[9px] text-[#475569] mt-1">Clinical Rating</div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                              className="p-4 rounded-xl bg-gradient-to-br from-[#F59E0B]/10 to-transparent border border-[#F59E0B]/15">
                              <div className="flex items-center gap-1.5 mb-2">
                                <ShieldCheck className="w-3 h-3 text-[#F59E0B]" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#F59E0B]">Patent</span>
                              </div>
                              <div className="text-2xl font-bold text-white">{ins?.patent_freedom || "—"}</div>
                              <div className="text-[9px] text-[#475569] mt-1">FTO Status</div>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                              className="p-4 rounded-xl bg-gradient-to-br from-[#EC4899]/10 to-transparent border border-[#EC4899]/15 flex items-center gap-3">
                              <Gauge value={Math.round(repScore)} max={10} color="#EC4899" size={52} />
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#EC4899]">Score</span>
                                <div className="text-[9px] text-[#475569] mt-0.5">Repurposing</div>
                              </div>
                            </motion.div>
                          </div>

                          {/* ── Supply + Lead row ── */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl border border-white/[0.06] bg-black/30 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center">
                                <Package className="w-4 h-4 text-[#06B6D4]" />
                              </div>
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#06B6D4]">Supply Chain</div>
                                <div className="text-sm font-semibold text-white mt-0.5">{ins?.supply_chain_risk || "—"}</div>
                              </div>
                            </div>
                            <div className="p-4 rounded-xl border border-white/[0.06] bg-black/30 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
                                <Target className="w-4 h-4 text-[#10B981]" />
                              </div>
                              <div>
                                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#10B981]">Lead Candidate</div>
                                <div className="text-sm font-semibold text-white mt-0.5">{candidates[0]?.disease_name || "—"}</div>
                              </div>
                            </div>
                          </div>

                          {/* ── Candidates Table ── */}
                          {candidates.length > 0 && (
                            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                              <div className="flex items-center justify-between px-5 py-2.5 bg-black/40 border-b border-white/[0.04]">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                  <Beaker className="w-4 h-4 text-[#94A3B8]" /> Candidates
                                  <span className="text-[10px] text-[#475569] font-normal">({candidates.length})</span>
                                </h3>
                                <StatusChip label={`${candidates.filter(c => c.fto_status === "CLEAR" || c.fto_status === "Clear").length} Clear`} variant="success" />
                              </div>
                              <div className="divide-y divide-white/[0.03]">
                                {candidates.map((c, i) => (
                                  <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.015] transition-colors">
                                    <div className="w-6 h-6 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                                      <span className="text-[10px] font-bold text-[#64748B]">{i + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-semibold text-white truncate">{c.disease_name}</div>
                                    </div>
                                    <div className="text-right shrink-0 w-20">
                                      <div className="text-xs font-semibold text-white">{c.tam_estimate || "—"}</div>
                                      <div className="text-[8px] text-[#334155]">TAM</div>
                                    </div>
                                    <StatusChip
                                      label={c.fto_status === "CLEAR" || c.fto_status === "Clear" ? "CLEAR" : c.fto_status || "Pending"}
                                      variant={c.fto_status === "CLEAR" || c.fto_status === "Clear" ? "success" : "warning"}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ── Summary ── */}
                          {ins?.executive_summary && (
                            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                              <div className="px-5 py-2.5 bg-black/40 border-b border-white/[0.04] flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#94A3B8]" />
                                <h3 className="text-sm font-semibold text-white">Executive Summary</h3>
                              </div>
                              <div className="px-5 py-4">
                                <p className="text-sm text-[#94A3B8] leading-relaxed">{ins.executive_summary}</p>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
