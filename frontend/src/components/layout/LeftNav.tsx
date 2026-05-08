"use client";

import { LayoutDashboard, History, FileBarChart, Network, TrendingUp, Settings, Search, Play } from 'lucide-react';
import { usePipelineStore } from '@/store/usePipelineStore';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Pipeline', href: '/dashboard' },
  { icon: History,         label: 'Run History', href: '/runs', badge: 3 },
  { icon: FileBarChart,    label: 'Reports', href: '/reports' },
  { icon: Network,         label: 'Knowledge Graph', href: '/knowledge' },
  { icon: TrendingUp,      label: 'Trends', href: '/trends' },
  { icon: Settings,        label: 'Settings', href: '/settings' },
];

const recentRuns = [
  { id: '1', moleculeName: 'Thalidomide', relativeTime: '2h ago', status: 'done' },
  { id: '2', moleculeName: 'Aspirin', relativeTime: '5h ago', status: 'error' },
];

export function LeftNav() {
  const { startRun, status } = usePipelineStore();
  const [moleculeInput, setMoleculeInput] = useState('');

  const statusDotColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-[#3A9E6F]';
      case 'error': return 'bg-[#C04040]';
      case 'running': return 'bg-[#D4920A]';
      default: return 'bg-[#4A5060]';
    }
  };

  return (
    <div className="w-[220px] bg-[#13161B] border-r border-[#252830] p-[16px_10px] flex flex-col gap-1 shrink-0">
      
      {/* Molecule Input */}
      {status === 'idle' && (
        <div className="mb-4 pb-4 border-b border-[#252830]">
          <label className="text-[11px] font-medium tracking-[0.06em] text-[#4A5060] uppercase mb-2 block">
            Molecule
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5060]" />
            <input
              type="text"
              placeholder="Name or SMILES..."
              value={moleculeInput}
              onChange={(e) => setMoleculeInput(e.target.value)}
              className="w-full bg-[#1A1D24] border border-[#252830] rounded-lg pl-8 pr-3 py-2 text-[13px] text-[#E8E9EB] placeholder:text-[#4A5060] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
          <button 
            onClick={() => moleculeInput && startRun(moleculeInput)}
            className="w-full mt-2 py-2 rounded-lg text-[13px] font-medium bg-[#2563EB] text-white hover:bg-[#1D55D0] transition-colors flex items-center justify-center gap-2"
          >
            <Play size={13} />
            Start Pipeline
          </button>
        </div>
      )}

      {/* Nav Items */}
      {navItems.map((item, idx) => {
        const isActive = idx === 0; // Just mock first as active
        return (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors duration-100 ${
              isActive 
                ? 'bg-[#1A1D24] border border-[#252830] font-medium text-[#E8E9EB]' 
                : 'text-[#8A8F9A] hover:bg-[#1A1D24] hover:text-[#E8E9EB] border border-transparent'
            }`}
          >
            <item.icon size={16} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#1A3050] text-[#4A90C4]">
                {item.badge}
              </span>
            )}
          </a>
        );
      })}

      {/* Run History */}
      <div className="mt-auto pt-4 border-t border-[#252830]">
        <p className="text-[11px] font-medium tracking-[0.06em] text-[#4A5060] uppercase mb-2 px-1">
          Recent Runs
        </p>
        {recentRuns.map(run => (
          <div key={run.id} className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[#1A1D24] cursor-pointer group transition-colors">
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDotColor(run.status)}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#8A8F9A] truncate group-hover:text-[#E8E9EB] transition-colors">
                {run.moleculeName}
              </p>
              <p className="text-[10px] font-mono text-[#4A5060]">{run.relativeTime}</p>
            </div>
            <StatusBadge status={run.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
