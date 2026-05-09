"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Loader2, CheckCircle2, AlertTriangle,
  Clock, ExternalLink, ChevronRight, Target, ShieldCheck, TrendingUp
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
    final_candidates?: { disease_name: string; fto_status?: string; tam_estimate?: string }[];
    executive_summary?: string;
  };
};

export default function ReportsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [selected, setSelected] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/reports`)
      .then(r => r.json())
      .then((data: Run[]) => {
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          : [];
        setRuns(sorted);
        if (sorted.length > 0) loadDetail(sorted[0]);
      })
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (run: Run) => {
    setSelected(run);
    setPdfOpen(false);
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

  const pdfUrl = selected ? `${API_BASE_URL}/pipeline/report/${selected.thread_id}` : null;

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* ── Left: Run List ── */}
      <div className="w-[260px] shrink-0 h-full border-r border-white/[0.04] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.04] shrink-0">
          <h1 className="text-sm font-semibold text-[#F5F7FA] tracking-tight flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#94A3B8]" /> Intelligence Reports
          </h1>
          <p className="text-xs text-[#475569] mt-0.5">{runs.length} completed run{runs.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B] px-5 py-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          ) : runs.length === 0 ? (
            <p className="text-xs text-[#475569] px-5 py-6 leading-relaxed">
              No reports yet. Launch a pipeline from Overview.
            </p>
          ) : (
            runs.map((run, i) => {
              const active = selected?.thread_id === run.thread_id;
              return (
                <motion.button
                  key={run.thread_id}
                  onClick={() => loadDetail(run)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`w-full text-left px-4 py-3 border-b border-white/[0.03] flex items-start gap-3 transition-colors ${
                    active ? "bg-white/[0.06]" : "hover:bg-white/[0.02]"
                  }`}
                >
                  {run.status === "COMPLETED"
                    ? <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${active ? "text-[#10B981]" : "text-[#64748B]"}`} />
                    : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#F59E0B]" />
                  }
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${active ? "text-white" : "text-[#CBD5E1]"}`}>
                      {run.molecule}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#334155]" />
                      <span className="text-[10px] text-[#475569]">
                        {new Date(run.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {active && <ChevronRight className="w-4 h-4 text-white shrink-0 mt-0.5" />}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Detail / PDF ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex items-center justify-center text-[#475569] text-sm">
              Select a report to view details.
            </motion.div>
          ) : (
            <motion.div key={selected.thread_id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }} className="flex-1 flex flex-col overflow-hidden">

              {/* Header */}
              <div className="px-6 py-4 border-b border-white/[0.04] shrink-0 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#F5F7FA] tracking-tight">{selected.molecule}</h2>
                  <p className="text-[10px] text-[#475569] mt-0.5 font-mono">{selected.thread_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.status === "COMPLETED" && pdfUrl && (
                    <>
                      <button
                        onClick={() => setPdfOpen(!pdfOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {pdfOpen ? "Hide PDF" : "View PDF"}
                      </button>
                      <a
                        href={pdfUrl}
                        download
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-neutral-100 text-xs font-semibold text-black transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Body: scrollable detail OR pdf viewer */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {pdfOpen && pdfUrl ? (
                    <motion.div key="pdf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="w-full h-full relative">
                      <iframe
                        src={`${pdfUrl}#toolbar=1`}
                        className="w-full h-full border-0"
                        title={`${selected.molecule} report PDF`}
                      />
                      <a href={pdfUrl} target="_blank" rel="noreferrer"
                        className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/80 border border-white/10 text-xs text-white hover:bg-black transition-colors">
                        <ExternalLink className="w-3 h-3" /> Open in new tab
                      </a>
                    </motion.div>
                  ) : (
                    <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full overflow-y-auto custom-scrollbar p-6 space-y-5">

                      {detailLoading ? (
                        <div className="flex items-center gap-2 text-sm text-[#64748B]">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading report data…
                        </div>
                      ) : (
                        <>
                          {/* KPI row */}
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              {
                                label: "Clinical Viability",
                                value: selected.insights?.clinical_viability || "—",
                                icon: Target,
                                color: selected.insights?.clinical_viability === "High" ? "text-[#10B981]" : "text-[#94A3B8]"
                              },
                              {
                                label: "Patent Freedom",
                                value: selected.insights?.patent_freedom || "—",
                                icon: ShieldCheck,
                                color: selected.insights?.patent_freedom === "Clear" ? "text-[#F59E0B]" : "text-[#94A3B8]"
                              },
                              {
                                label: "Market TAM",
                                value: selected.insights?.tam ? `$${selected.insights.tam}B` : "—",
                                icon: TrendingUp,
                                color: "text-white"
                              },
                            ].map(kpi => {
                              const Icon = kpi.icon;
                              return (
                                <div key={kpi.label} className="p-4 rounded-xl bg-black/40 border border-white/[0.06]">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <Icon className="w-3.5 h-3.5 text-[#475569]" />
                                    <span className="text-[10px] uppercase tracking-wider text-[#475569]">{kpi.label}</span>
                                  </div>
                                  <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Candidates */}
                          {(selected.insights?.final_candidates?.length ?? 0) > 0 && (
                            <div className="p-5 rounded-xl bg-black/30 border border-white/[0.06]">
                              <h3 className="text-sm font-semibold text-[#F5F7FA] mb-3">Approved Candidates</h3>
                              <div className="space-y-2">
                                {selected.insights!.final_candidates!.map((c, i) => (
                                  <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                                    <div className="flex items-center gap-2">
                                      <Target className="w-3.5 h-3.5 text-[#10B981]" />
                                      <span className="text-sm text-white font-medium">{c.disease_name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      {c.tam_estimate && <span className="text-xs text-[#64748B]">{c.tam_estimate}</span>}
                                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        c.fto_status === "CLEAR" || c.fto_status === "Clear"
                                          ? "text-[#10B981] bg-[#10B981]/10" : "text-[#F59E0B] bg-[#F59E0B]/10"
                                      }`}>{c.fto_status || "FTO Pending"}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Executive Summary */}
                          {selected.insights?.executive_summary && (
                            <div className="p-5 rounded-xl bg-black/30 border border-white/[0.06]">
                              <h3 className="text-sm font-semibold text-[#F5F7FA] mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#94A3B8]" /> Executive Summary
                              </h3>
                              <p className="text-sm text-[#94A3B8] leading-relaxed">{selected.insights.executive_summary}</p>
                            </div>
                          )}

                          {/* PDF CTA */}
                          {pdfUrl && selected.status === "COMPLETED" && (
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-black/20">
                              <FileText className="w-5 h-5 text-[#475569] shrink-0" />
                              <div className="flex-1 text-sm text-[#94A3B8]">Full AI-generated PDF report is ready.</div>
                              <button
                                onClick={() => setPdfOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white transition-colors shrink-0"
                              >
                                View PDF →
                              </button>
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
