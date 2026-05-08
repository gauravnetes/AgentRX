"use client";

import { FileDown, Table } from 'lucide-react';
import { usePipelineStore } from '@/store/usePipelineStore';

export function ExportTab() {
  const { threadId } = usePipelineStore();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
        {[
          { label: 'Candidates Found', value: 12 },
          { label: 'IP Cleared', value: 5 },
          { label: 'Viable Opportunities', value: 2 },
        ].map(stat => (
          <div key={stat.label} className="bg-[#13161B] border border-[#252830] rounded-lg p-4 text-center">
            <p className="font-mono text-[22px] font-semibold text-[#E8E9EB]">{stat.value}</p>
            <p className="text-[11px] text-[#4A5060] mt-1 uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Export actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] text-white text-[13px] font-medium hover:bg-[#1D55D0] transition-colors">
          <FileDown size={15} />
          Download PDF Report
        </button>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#13161B] border border-[#252830] text-[#8A8F9A] text-[13px] font-medium hover:border-[#3A4050] hover:text-[#E8E9EB] transition-colors">
          <Table size={15} />
          Export Excel
        </button>
      </div>
      
      <p className="text-[11px] font-mono text-[#4A5060]">
        Generated: {new Date().toISOString().split('T')[0]} · Thread: {threadId || '—'}
      </p>
    </div>
  );
}
