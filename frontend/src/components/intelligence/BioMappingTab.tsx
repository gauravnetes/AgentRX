"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

type DiseaseCandidate = {
  id: string;
  diseaseName: string;
  overlapScore: number;
  mechanismSummary: string;
  pubmedCount: number;
  pathway: string;
};

const mockCandidates: DiseaseCandidate[] = [
  { id: '1', diseaseName: 'Rheumatoid Arthritis', overlapScore: 88, mechanismSummary: 'Strong PI3K/AKT inhibition overlap observed in synoviocyte models.', pubmedCount: 142, pathway: 'PI3K / AKT' },
  { id: '2', diseaseName: 'Lupus Erythematosus', overlapScore: 74, mechanismSummary: 'Moderate modulation of inflammatory cytokines via AMPK activation.', pubmedCount: 86, pathway: 'AMPK' },
  { id: '3', diseaseName: 'Psoriasis', overlapScore: 62, mechanismSummary: 'Partial alignment with keratinocyte hyperproliferation pathways.', pubmedCount: 45, pathway: 'mTOR' },
  { id: '4', diseaseName: 'Multiple Sclerosis', overlapScore: 45, mechanismSummary: 'Weak connection through general immune suppression mechanisms.', pubmedCount: 12, pathway: 'JAK/STAT' },
];

export function BioMappingTab() {
  const [threshold, setThreshold] = useState(50);
  
  const filteredCandidates = mockCandidates.filter(c => c.overlapScore >= threshold);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-[11px] font-medium tracking-widest text-[#4A5060] uppercase">
            Pathway Candidates
          </p>
          <p className="text-[11px] font-mono text-[#4A5060] mt-0.5">
            451 PubMed abstracts · AMPK / PI3K pathway overlap
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#4A5060]">Min overlap</span>
          <input 
            type="range" 
            min={0} 
            max={100} 
            value={threshold} 
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-20 accent-[#2563EB]" 
          />
          <span className="font-mono text-[11px] text-[#8A8F9A] w-8">{threshold}%</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pb-4">
        {filteredCandidates.map(candidate => {
          const tier = candidate.overlapScore > 80 ? 'high' : candidate.overlapScore > 60 ? 'mid' : 'low';
          
          return (
            <motion.div
              key={candidate.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg border cursor-pointer transition-colors group
                ${tier === 'high' ? 'bg-[#0F2018] border-[#1A4030] hover:border-[#2A6040]' : ''}
                ${tier === 'mid'  ? 'bg-[#0F1A28] border-[#1A3050] hover:border-[#2A5080]' : ''}
                ${tier === 'low'  ? 'bg-[#1A1D24] border-[#252830] hover:border-[#3A4050]' : ''}
              `}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className={`text-[13px] font-medium 
                  ${tier === 'high' ? 'text-[#3A9E6F]' : tier === 'mid' ? 'text-[#4A90C4]' : 'text-[#8A8F9A]'}`}>
                  {candidate.diseaseName}
                </span>
                <span className={`font-mono text-[11px] 
                  ${tier === 'high' ? 'text-[#2A7050]' : tier === 'mid' ? 'text-[#2A5080]' : 'text-[#4A5060]'}`}>
                  {candidate.overlapScore}%
                </span>
              </div>
              
              {/* Score bar */}
              <div className="h-0.5 w-full bg-[#252830] rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700
                    ${tier === 'high' ? 'bg-[#3A9E6F]' : tier === 'mid' ? 'bg-[#4A90C4]' : 'bg-[#4A5060]'}`}
                  style={{ width: `${candidate.overlapScore}%` }}
                />
              </div>
              
              <p className="text-[10px] text-[#4A5060] mt-1.5 leading-relaxed">
                {candidate.mechanismSummary}
              </p>
              
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] font-mono text-[#4A5060]">
                  {candidate.pubmedCount} papers
                </span>
                <span className="text-[10px] text-[#252830]">·</span>
                <span className="text-[10px] font-mono text-[#4A5060]">
                  {candidate.pathway}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
