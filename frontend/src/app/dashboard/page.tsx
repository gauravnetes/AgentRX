"use client";

import { usePipelineStore } from '@/store/usePipelineStore';
import { PipelineDAG } from '@/components/pipeline/PipelineDAG';
import { IntelligenceTabs } from '@/components/intelligence/IntelligenceTabs';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { status, currentPhase, progressPercent } = usePipelineStore();

  return (
    <>
      <div className="h-[170px] border-b border-[#252830] bg-[#0D0F12] p-[14px_20px_12px] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium tracking-widest text-[#4A5060] uppercase">
              M2M Pipeline
            </span>
            {status !== 'idle' && (
              <span className="text-[11px] font-mono text-[#4A5060]">
                Phase {currentPhase}/5
              </span>
            )}
          </div>
          {status !== 'idle' && (
            <div className="flex items-center gap-3">
              <div className="w-32 h-1 bg-[#1A1D24] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#2563EB] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#8A8F9A]">{progressPercent}%</span>
            </div>
          )}
        </div>
        
        <PipelineDAG />
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col bg-[#0D0F12]">
        <IntelligenceTabs />
      </div>
    </>
  );
}
