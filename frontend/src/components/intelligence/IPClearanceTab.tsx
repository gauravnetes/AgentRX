"use client";

import { usePipelineStore } from '@/store/usePipelineStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Circle } from 'lucide-react';

type IPResult = {
  id: string;
  indication: string;
  status: 'cleared' | 'blocked' | 'scanning' | 'queued';
  patentId?: string;
  note: string;
};

const mockResults: IPResult[] = [
  { id: '1', indication: 'Rheumatoid Arthritis', status: 'cleared', note: 'No overlapping method-of-use claims found.' },
  { id: '2', indication: 'Lupus Erythematosus', status: 'scanning', note: 'Analyzing claims in US2019004... against formulation...' },
  { id: '3', indication: 'Psoriasis', status: 'blocked', patentId: 'US9821045B2', note: 'Direct conflict with active use patent expiring 2031.' },
  { id: '4', indication: 'Multiple Sclerosis', status: 'queued', note: 'Pending scan...' },
];

export function IPClearanceTab() {
  const { status, currentPhase } = usePipelineStore();
  const isRunning = currentPhase === 3 && status === 'running';

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto">
      {isRunning && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-[#2A2010] border border-[#5C4010] shrink-0">
          <div className="w-5 h-5 border-2 border-[#D4920A] border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-[12px] font-medium text-[#D4920A]">USPTO PatentsView scanning</p>
            <p className="text-[10px] font-mono text-[#A06808] mt-0.5">1/4 indications checked</p>
          </div>
          <div className="flex-1 ml-2">
            <div className="h-1 bg-[#1A1D24] rounded-full overflow-hidden">
              <motion.div className="h-full bg-[#D4920A] rounded-full"
                animate={{ width: `25%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 pb-4">
        {mockResults.map(result => (
          <div key={result.id} className={`flex items-center gap-3 p-3 rounded-lg border
            ${result.status === 'cleared'  ? 'bg-[#0F2018] border-[#1A4030]' : ''}
            ${result.status === 'blocked'  ? 'bg-[#200F0F] border-[#4A1A1A]' : ''}
            ${result.status === 'scanning' ? 'bg-[#2A2010] border-[#5C4010]' : ''}
            ${result.status === 'queued'   ? 'bg-[#161A20] border-[#252830] opacity-50' : ''}
          `}>
            
            {/* Status icon */}
            {result.status === 'cleared'  && <CheckCircle size={16} className="text-[#3A9E6F] flex-shrink-0" />}
            {result.status === 'blocked'  && <XCircle    size={16} className="text-[#C04040] flex-shrink-0" />}
            {result.status === 'scanning' && <Loader2    size={16} className="text-[#D4920A] animate-spin flex-shrink-0" />}
            {result.status === 'queued'   && <Circle     size={16} className="text-[#4A5060] flex-shrink-0" />}
            
            {/* Name + note */}
            <div className="flex-1 min-w-0">
              <p className={`text-[13px] font-medium
                ${result.status === 'cleared'  ? 'text-[#3A9E6F]' : ''}
                ${result.status === 'blocked'  ? 'text-[#C04040]' : ''}
                ${result.status === 'scanning' ? 'text-[#D4920A]' : ''}
                ${result.status === 'queued'   ? 'text-[#4A5060]' : ''}
              `}>{result.indication}</p>
              <p className="text-[10px] font-mono text-[#4A5060] mt-0.5 truncate">{result.note}</p>
            </div>
            
            {/* Patent ID if blocked */}
            {result.patentId && (
              <span className="font-mono text-[10px] text-[#C04040] bg-[#200F0F] px-2 py-0.5 rounded">
                {result.patentId}
              </span>
            )}
            
            {/* Status badge */}
            <StatusBadge status={result.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
