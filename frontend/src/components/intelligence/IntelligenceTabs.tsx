"use client";

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { usePipelineStore } from '@/store/usePipelineStore';
import { EmptyState } from '@/components/shared/EmptyState';
import { Network } from 'lucide-react';
import { BioMappingTab } from './BioMappingTab';
import { IPClearanceTab } from './IPClearanceTab';
import { MarketIntelTab } from './MarketIntelTab';
import { ExportTab } from './ExportTab';

export function IntelligenceTabs() {
  const [activeTab, setActiveTab] = useState('bio');
  const { status, currentPhase } = usePipelineStore();

  if (status === 'idle') {
    return (
      <EmptyState 
        icon={Network} 
        title="Awaiting Molecule" 
        description="Enter a molecule name or SMILES in the sidebar to begin the M2M pipeline orchestration." 
      />
    );
  }

  const tabs = [
    { id: 'bio',     label: 'Bio Mapping',   count: 4,   locked: false },
    { id: 'ip',      label: 'IP Clearance',  count: 4,   locked: currentPhase < 3 },
    { id: 'market',  label: 'Market Intel',  count: 2,   locked: currentPhase < 4 },
    { id: 'export',  label: 'Export',        count: null,locked: status !== 'complete' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-[#252830] px-4 bg-[#0D0F12] shrink-0">
        {tabs.map(tab => (
          <button key={tab.id}
            onClick={() => !tab.locked && setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-[#2563EB] text-[#E8E9EB]'
                : 'border-transparent text-[#4A5060] hover:text-[#8A8F9A]'}
              ${tab.locked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
            disabled={tab.locked}
          >
            <div className="flex items-center gap-1.5">
              {tab.locked && <Lock size={11} />}
              {tab.label}
              {tab.count !== null && (
                <span className="font-mono text-[10px] px-1.5 rounded bg-[#1A1D24] text-[#4A90C4]">
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-hidden p-4">
        {activeTab === 'bio' && <BioMappingTab />}
        {activeTab === 'ip' && <IPClearanceTab />}
        {activeTab === 'market' && <MarketIntelTab />}
        {activeTab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}
