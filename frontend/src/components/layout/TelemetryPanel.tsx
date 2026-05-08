"use client";

import { usePipelineStore } from '@/store/usePipelineStore';
import { PulsingDot } from '@/components/shared/PulsingDot';
import { CheckCircle, Globe, Shield, TrendingUp, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const agents = [
  { id: 'web-intel',  name: 'Web Intelligence',   Icon: Globe,       dataSource: 'PubMed Entrez' },
  { id: 'patent',     name: 'Patent Landscape',    Icon: Shield,      dataSource: 'USPTO PatentsView' },
  { id: 'commercial', name: 'Commercial Viab.',    Icon: TrendingUp,  dataSource: 'IQVIA API' },
  { id: 'supply',     name: 'IQVIA Supply Chain',  Icon: Truck,       dataSource: 'EXIM API' },
];

export function TelemetryPanel() {
  const { status, progressPercent } = usePipelineStore();
  
  // Mock live logs
  const visibleLogs = [
    { id: 1, message: '[web-intel] fetching pubmed enterez for AMPK', level: 'idle' },
    { id: 2, message: '[web-intel] found 451 overlapping abstracts', level: 'success' },
    { id: 3, message: '[patent] scanning uspto patentsview...', level: 'warning' },
  ];

  const getAgentStatus = (idx: number): 'queued' | 'done' | 'running' | 'error' => {
    if (status === 'idle') return 'queued';
    if (idx === 0) return 'done';
    if (idx === 1) return 'running';
    return 'queued';
  };

  return (
    <div className="w-[240px] bg-[#13161B] border-l border-[#252830] flex flex-col overflow-hidden shrink-0">
      
      {/* AGENT STATUS GRID */}
      <div className="px-4 pt-4 pb-3 border-b border-[#252830]">
        <p className="text-[11px] font-medium tracking-[0.06em] text-[#4A5060] uppercase">Agents</p>
      </div>
      
      <div className="flex flex-col py-1.5 overflow-y-auto">
        {agents.map((agent, idx) => {
          const agentStatus = getAgentStatus(idx);
          return (
            <div key={agent.id} className={`mx-3 my-1.5 p-3 rounded-lg border transition-colors
              ${agentStatus === 'running' ? 'bg-[#1A1300] border-[#5C4010]' : ''}
              ${agentStatus === 'done'    ? 'bg-[#0D1A14] border-[#1A4030]' : ''}
              ${agentStatus === 'queued'  ? 'bg-[#13161B] border-[#252830] opacity-50' : ''}
              ${agentStatus === 'error'   ? 'bg-[#1A0D0D] border-[#4A1A1A]' : ''}
            `}>
              <div className="flex items-center gap-2 mb-1.5">
                <agent.Icon size={14} className={
                  agentStatus === 'running' ? 'text-[#D4920A]' : 
                  agentStatus === 'done' ? 'text-[#3A9E6F]' : 'text-[#4A5060]'
                } />
                <span className={`text-[12px] font-medium flex-1 min-w-0 truncate ${
                  agentStatus === 'running' ? 'text-[#D4920A]' : 
                  agentStatus === 'done' ? 'text-[#3A9E6F]' : 'text-[#4A5060]'
                }`}>
                  {agent.name}
                </span>
                {agentStatus === 'running' && <PulsingDot color="amber" size="sm" />}
                {agentStatus === 'done'    && <CheckCircle size={12} className="text-[#3A9E6F]" />}
              </div>
              
              <p className={`text-[10px] font-mono ${
                agentStatus === 'running' ? 'text-[#A06808]' :
                agentStatus === 'done'    ? 'text-[#2A7050]' : 'text-[#4A5060]'
              }`}>
                {agentStatus === 'running' ? 'Scanning...' : agentStatus === 'done' ? 'Complete' : 'Waiting...'}
              </p>
              
              {agentStatus === 'running' && (
                <div className="mt-2 h-0.5 bg-[#252830] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#D4920A] rounded-full"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* LIVE LOG STREAM */}
      <div className="flex-1 overflow-hidden flex flex-col px-4 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium tracking-[0.06em] text-[#4A5060] uppercase">Live Log</span>
          {status === 'running' && <PulsingDot color="green" size="xs" />}
        </div>
        
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <AnimatePresence initial={false}>
            {visibleLogs.map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`font-mono text-[10px] leading-relaxed truncate
                  ${log.level === 'success' ? 'text-[#2A7050]' : ''}
                  ${log.level === 'warning' ? 'text-[#A06808]' : ''}
                  ${log.level === 'error'   ? 'text-[#902020]' : ''}
                  ${log.level === 'idle'    ? 'text-[#3A4050]' : ''}
                `}
              >
                {log.message}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* STATS FOOTER */}
      <div className="mt-auto border-t border-[#252830] px-4 py-3 grid grid-cols-3 gap-0">
        {[
          { label: 'CANDIDATES', value: 12, color: '#E8E9EB' },
          { label: 'IP CLEARED', value: 5,  color: '#D4920A' },
          { label: 'VIABLE',     value: '—', color: '#4A5060' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="font-mono text-[18px] font-semibold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-[9px] tracking-[0.06em] text-[#4A5060] uppercase mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
