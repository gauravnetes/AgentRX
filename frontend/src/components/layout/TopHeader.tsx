"use client";

import { Dna, FlaskConical, Check, Plus } from 'lucide-react';
import { usePipelineStore } from '@/store/usePipelineStore';
import { PulsingDot } from '@/components/shared/PulsingDot';

export function TopHeader() {
  const { threadId, moleculeName, formula, status, currentPhase, elapsedTime } = usePipelineStore();

  const currentPhaseLabel = [
    'Bio Mapping',
    'Merging',
    'IP Clearance',
    'Approval Gate',
    'Commercial Intel'
  ][currentPhase - 1] || 'Running';

  return (
    <div className="h-[48px] bg-[#13161B] border-b border-[#252830] px-5 flex items-center gap-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center">
        <Dna size={18} className="text-[#4A90C4]" />
        <span className="ml-2 font-sans text-[14px] font-semibold text-[#E8E9EB]">AgentRX</span>
        <span className="mx-3 text-[#252830]">|</span>
        <span className="text-[10px] font-medium tracking-[0.1em] text-[#4A5060] uppercase">MISSION CONTROL</span>
      </div>

      <div className="flex-1" />

      {/* Molecule chip */}
      {status !== 'idle' && moleculeName && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0F1A28] border border-[#1A3050] text-[#4A90C4] text-[12px]">
          <FlaskConical size={13} />
          <span className="font-semibold">{moleculeName}</span>
          <span className="text-[10px] opacity-60 font-mono">{formula}</span>
        </div>
      )}

      {/* Pipeline status badge */}
      {status === 'running' && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#2A2010] border border-[#5C4010] text-[#D4920A] text-[12px] font-medium">
          <PulsingDot color="amber" />
          {currentPhaseLabel}
        </div>
      )}
      
      {status === 'complete' && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-[#0F2018] border border-[#1A4030] text-[#3A9E6F] text-[12px] font-medium">
          Complete
        </div>
      )}

      {/* Thread ID + elapsed time */}
      {threadId && (
        <span className="font-mono text-[10px] text-[#4A5060] ml-2">
          {threadId} · {elapsedTime}
        </span>
      )}

      {/* Approve button */}
      {status === 'awaiting_approval' && (
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium bg-[#1A1228] border border-[#3A2060] text-[#8A60C4] hover:bg-[#221530] hover:border-[#5030A0] transition-colors duration-150 ml-2">
          <Check size={13} />
          Approve & Continue
        </button>
      )}

      {/* New Run button */}
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium bg-[#2563EB] text-white hover:bg-[#1D55D0] transition-colors duration-150 ml-2">
        <Plus size={13} />
        New Run
      </button>
    </div>
  );
}
