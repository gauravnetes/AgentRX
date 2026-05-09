"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertTriangle, Clock, ZoomIn, ZoomOut, RotateCcw, Pause, X, Trash2 } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.8;

// ── Column layout: each column is a phase, nodes within are stacked vertically
// cx = center x of the column, each node gets a y offset
const CARD_W = 188;
const CARD_H = 82;
const COL_GAP = 80; // horizontal gap between columns

const COLUMNS: {
  nodes: {
    id: string; label: string; sub: string; color: string; isGate?: boolean;
  }[];
}[] = [
  {
    nodes: [
      { id: "init", label: "Pipeline Init", sub: "MasterAgent bootstraps graph", color: "#6366F1" },
    ],
  },
  {
    nodes: [
      { id: "web",    label: "Web Intelligence",   sub: "PubMed + BioBERT NLP",       color: "#2563EB" },
      { id: "fusion", label: "Data Fusion Engine", sub: "Candidate de-duplication",   color: "#7C3AED" },
      { id: "patent", label: "Patent Landscape",   sub: "Europe PMC FTO clearance",   color: "#DB2777" },
    ],
  },
  {
    nodes: [
      { id: "hitl", label: "Human Approval Gate", sub: "Pipeline pauses for review", color: "#D97706", isGate: true },
    ],
  },
  {
    nodes: [
      { id: "commercial", label: "Commercial Viability", sub: "FDA + YFinance TAM",      color: "#059669" },
      { id: "supply",     label: "IQVIA Supply Chain",   sub: "EXIM + IQVIA trade risk", color: "#0891B2" },
    ],
  },
  {
    nodes: [
      { id: "report", label: "Report Generator", sub: "Gemini LLM + ReportLab PDF", color: "#EA580C" },
    ],
  },
  {
    nodes: [
      { id: "done", label: "Report Delivered", sub: "PDF + REST API available", color: "#0E7490" },
    ],
  },
];

// phase labels per column
const PHASE_LABELS = ["INIT", "PHASE 1", "HITL", "PHASE 2", "PHASE 2", "DONE"];

// ── Edges: [fromColIdx, fromNodeIdx, toColIdx, toNodeIdx]
const EDGES: [number, number, number, number][] = [
  [0, 0, 1, 0], // init → web
  [0, 0, 1, 1], // init → fusion
  [0, 0, 1, 2], // init → patent
  [1, 0, 2, 0], // web → hitl
  [1, 1, 2, 0], // fusion → hitl
  [1, 2, 2, 0], // patent → hitl
  [2, 0, 3, 0], // hitl → commercial
  [2, 0, 3, 1], // hitl → supply
  [3, 0, 4, 0], // commercial → report
  [3, 1, 4, 0], // supply → report
  [4, 0, 5, 0], // report → done
];

type NodeRect = { cx: number; cy: number; color: string };

function buildLayout() {
  const ROW_GAP = 16;
  const COL_PAD_X = 32;
  const TOP_PAD = 60;
  
  let x = COL_PAD_X;
  const colLayouts: NodeRect[][] = [];
  const canvasH_needed: number[] = [];

  COLUMNS.forEach(col => {
    const total = col.nodes.length * CARD_H + (col.nodes.length - 1) * ROW_GAP;
    canvasH_needed.push(total);
    colLayouts.push([]);
    col.nodes.forEach((node, ni) => {
      const cy = TOP_PAD + ni * (CARD_H + ROW_GAP) + CARD_H / 2;
      colLayouts[colLayouts.length - 1].push({ cx: x + CARD_W / 2, cy, color: node.color });
    });
    x += CARD_W + COL_GAP;
  });

  const canvasW = x - COL_GAP + COL_PAD_X;
  const maxH = Math.max(...canvasH_needed);
  const canvasH = TOP_PAD + maxH + 60;

  // Vertically center each column
  const colLayouts2: NodeRect[][] = colLayouts.map((col, ci) => {
    const total = COLUMNS[ci].nodes.length * CARD_H + (COLUMNS[ci].nodes.length - 1) * ROW_GAP;
    const offset = (maxH - total) / 2;
    return col.map(n => ({ ...n, cy: n.cy + offset }));
  });

  return { colLayouts: colLayouts2, canvasW, canvasH, COL_PAD_X };
}

const LAYOUT = buildLayout();

function Edges() {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={LAYOUT.canvasW}
      height={LAYOUT.canvasH}
    >
      {EDGES.map(([fc, fn, tc, tn], i) => {
        const from = LAYOUT.colLayouts[fc]?.[fn];
        const to = LAYOUT.colLayouts[tc]?.[tn];
        if (!from || !to) return null;

        const fx = from.cx + CARD_W / 2;
        const fy = from.cy;
        const tx = to.cx - CARD_W / 2;
        const ty = to.cy;
        const midX = (fx + tx) / 2;

        const d = `M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`;

        return (
          <g key={i}>
            {/* glow */}
            <path d={d} fill="none" stroke={to.color} strokeWidth={6} strokeOpacity={0.1} />
            {/* line */}
            <path d={d} fill="none" stroke={to.color} strokeWidth={1.8} strokeOpacity={0.55}
              strokeDasharray="5 4" className="edge-animated" />
            {/* dot at destination */}
            <circle cx={tx} cy={ty} r={3.5} fill={to.color} opacity={0.8} />
          </g>
        );
      })}
    </svg>
  );
}

type RecentRun = { thread_id: string; molecule: string; status: string; created_at: string };

export default function PipelinePage() {
  const [runs, setRuns] = useState<RecentRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.9);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/reports`)
      .then(r => r.json())
      .then(d => setRuns(Array.isArray(d) ? d.slice(0, 12) : []))
      .catch(() => {})
      .finally(() => setLoadingRuns(false));
  }, []);

  const deleteRun = async (threadId: string) => {
    try {
      await fetch(`${API_BASE_URL}/reports/${threadId}`, { method: "DELETE" });
      setRuns(prev => prev.filter(r => r.thread_id !== threadId));
    } catch { /* silent */ }
  };

  const clearStuck = async () => {
    try {
      await fetch(`${API_BASE_URL}/reports/clear-stuck`, { method: "POST" });
      setRuns(prev => prev.map(r =>
        r.status === "RUNNING" || r.status === "PAUSED_FOR_HUMAN"
          ? { ...r, status: "FAILED" }
          : r
      ));
    } catch { /* silent */ }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * 0.002)));
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-3 border-b border-white/[0.05] shrink-0 flex items-center justify-between bg-black/30">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">Orchestration Pipeline</h1>
          <p className="text-[10px] text-[#475569] mt-0.5">Ctrl + scroll to zoom · hover nodes to inspect</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Phase legend */}
          <div className="flex items-center gap-3 mr-2">
            {[
              { label: "Phase 1", color: "#2563EB" },
              { label: "HITL", color: "#D97706" },
              { label: "Phase 2", color: "#059669" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-[#64748B]">{l.label}</span>
              </div>
            ))}
          </div>
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-1 py-1">
            <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(1)))}
              className="p-1.5 rounded hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[#64748B] min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(1)))}
              className="p-1.5 rounded hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom(0.9)}
              className="p-1.5 rounded hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors ml-0.5">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex items-center"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.038) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      >


        <div style={{ width: LAYOUT.canvasW * zoom, height: LAYOUT.canvasH * zoom, position: "relative" }}>
          <div style={{
            width: LAYOUT.canvasW,
            height: LAYOUT.canvasH,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0, left: 0,
          }}>
            {/* SVG edges */}
            <Edges />

            {/* Phase label headers */}
            {COLUMNS.map((col, ci) => {
              const rects = LAYOUT.colLayouts[ci];
              if (!rects.length) return null;
              const x = rects[0].cx - CARD_W / 2;
              const phaseColor = col.nodes[0].color;
              return (
                <div key={ci} className="absolute flex items-center gap-1.5"
                  style={{ left: x, top: 12, width: CARD_W }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: phaseColor }} />
                  <span className="text-[9px] font-bold tracking-[0.15em] uppercase"
                    style={{ color: phaseColor, opacity: 0.8 }}>
                    {PHASE_LABELS[ci]}
                  </span>
                </div>
              );
            })}

            {/* Node cards */}
            {COLUMNS.map((col, ci) =>
              col.nodes.map((node, ni) => {
                const rect = LAYOUT.colLayouts[ci]?.[ni];
                if (!rect) return null;
                const isHov = hovered === node.id;
                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (ci * 3 + ni) * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="absolute"
                    style={{
                      left: rect.cx - CARD_W / 2,
                      top: rect.cy - CARD_H / 2,
                      width: CARD_W,
                    }}
                  >
                    {/* glow behind */}
                    {isHov && (
                      <div className="absolute -inset-2 rounded-2xl opacity-30 blur-lg pointer-events-none"
                        style={{ background: node.color }} />
                    )}

                    <div
                      className="relative rounded-xl overflow-hidden transition-all duration-200"
                      style={{
                        background: isHov
                          ? `linear-gradient(135deg, ${node.color}30 0%, ${node.color}14 100%)`
                          : `linear-gradient(135deg, ${node.color}18 0%, rgba(0,0,0,0.6) 100%)`,
                        border: `1px solid ${isHov ? node.color + "70" : node.color + "28"}`,
                        boxShadow: isHov
                          ? `0 8px 28px ${node.color}35, 0 0 0 1px ${node.color}40`
                          : `0 2px 12px ${node.color}12`,
                        transform: isHov ? "translateY(-3px)" : "none",
                        height: isHov ? "auto" : CARD_H,
                        minHeight: CARD_H,
                      }}
                    >
                      {/* top stripe */}
                      <div className="h-[3px]" style={{ background: node.color }} />

                      <div className="px-3.5 py-2.5">
                        {/* top row */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: node.color }} />
                          {node.isGate && (
                            <span className="text-[8px] font-bold bg-[#D97706]/20 text-[#D97706] px-1.5 py-0.5 rounded-full border border-[#D97706]/30 flex items-center gap-0.5">
                              <Pause className="w-2 h-2" /> PAUSE
                            </span>
                          )}
                        </div>
                        <div className="text-[13px] font-semibold text-white leading-snug">{node.label}</div>
                        {/* sub only on hover */}
                        {isHov && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-[10px] mt-1 leading-relaxed"
                            style={{ color: `${node.color}cc` }}
                          >
                            {node.sub}
                          </motion.div>
                        )}
                        {!isHov && (
                          <div className="text-[10px] text-[#475569] mt-0.5 leading-snug truncate">{node.sub}</div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom: Recent Runs ── */}
      <div className="shrink-0 border-t border-white/[0.04] bg-black/30 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] uppercase tracking-widest text-[#334155] font-bold">Recent Runs</div>
          {runs.some(r => r.status === "RUNNING" || r.status === "PAUSED_FOR_HUMAN") && (
            <button
              onClick={clearStuck}
              className="flex items-center gap-1 text-[9px] text-[#F59E0B] hover:text-[#FCD34D] border border-[#F59E0B]/20 bg-[#F59E0B]/5 hover:bg-[#F59E0B]/10 px-2 py-1 rounded transition-colors"
            >
              <Trash2 className="w-2.5 h-2.5" /> Clear stuck
            </button>
          )}
        </div>
        <div className="flex items-center gap-3 overflow-x-auto">
          {loadingRuns ? (
            <div className="flex items-center gap-2 text-xs text-[#64748B]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          ) : runs.length === 0 ? (
            <p className="text-xs text-[#475569]">No pipeline runs yet. Launch from Overview.</p>
          ) : (
            runs.map((run, i) => (
              <motion.div
                key={run.thread_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] shrink-0 transition-colors"
              >
                {/* Delete button */}
                <button
                  onClick={() => deleteRun(run.thread_id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-900/60"
                >
                  <X className="w-2.5 h-2.5 text-[#94A3B8]" />
                </button>

                {run.status === "COMPLETED"
                  ? <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                  : run.status === "RUNNING" || run.status === "PAUSED_FOR_HUMAN"
                  ? <Loader2 className="w-3 h-3 text-[#F59E0B] animate-spin shrink-0" />
                  : <AlertTriangle className="w-3 h-3 text-[#F87171] shrink-0" />
                }
                <div>
                  <div className="text-[11px] font-semibold text-white">{run.molecule}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-2 h-2 text-[#334155]" />
                    <span className="text-[9px] text-[#475569]">{new Date(run.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
