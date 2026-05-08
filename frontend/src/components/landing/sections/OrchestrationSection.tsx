import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import SectionHeader from "../shared/SectionHeader"
import MonoText from "../ui/MonoText"
import { AGENTS, METRICS } from "@/lib/mockData"

export default function OrchestrationSection() {
  return (
    <SectionWrapper id="orchestration" className="bg-[#0a0a0a]/50 border-y border-[#1a1a1a]">
      <Container>
        <div className="text-center mb-16">
          <div className="mb-4">
            <MonoText className="text-[10px] text-blue-500 uppercase tracking-[0.3em]">Phase 02: Multi-Agent Synchronization</MonoText>
          </div>
          <SectionHeader
            title="The Orchestrator."
            subtitle="Specialized AI agents working in perfect asynchronous synchrony."
          />
        </div>

        {/* Graph Visual Skeleton */}
        <div className="relative h-[600px] border border-[#1a1a1a] bg-[#050505] rounded-3xl my-16 overflow-hidden shadow-inner group">
          {/* Subtle grid in background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
          
          {/* Center Hub */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-24 h-24 border border-blue-500/30 bg-blue-500/5 rounded-full flex items-center justify-center backdrop-blur-md relative">
              <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-ping opacity-20" />
              <MonoText className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">Core</MonoText>
            </div>
          </div>

          {/* Floating Agent Nodes */}
          <div className="absolute top-[15%] left-[20%] w-48 p-4 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl shadow-2xl group-hover:-translate-y-2 transition-transform duration-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-muted uppercase">Clinical Trial Agent</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
              <div className="h-full w-2/3 bg-blue-500/50" />
            </div>
            <MonoText className="text-[9px] text-muted opacity-50 uppercase">Analyzing Phase III Results...</MonoText>
          </div>

          <div className="absolute top-[15%] right-[20%] w-48 p-4 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl shadow-2xl group-hover:-translate-y-2 transition-transform duration-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-muted uppercase">Patent Agent</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
              <div className="h-full w-1/2 bg-blue-500/50" />
            </div>
            <MonoText className="text-[9px] text-muted opacity-50 uppercase">Searching WIPO Database...</MonoText>
          </div>

          <div className="absolute bottom-[15%] left-[20%] w-48 p-4 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl shadow-2xl group-hover:translate-y-2 transition-transform duration-500">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-muted uppercase">Market Intelligence</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
              <div className="h-full w-3/4 bg-blue-500/50" />
            </div>
            <MonoText className="text-[9px] text-muted opacity-50 uppercase">Evaluating TAM/SAM...</MonoText>
          </div>

          <div className="absolute bottom-[15%] right-[20%] w-48 p-4 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl shadow-2xl group-hover:translate-y-2 transition-transform duration-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-muted uppercase">Literature Agent</span>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </div>
            <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
              <div className="h-full w-1/3 bg-blue-500/50" />
            </div>
            <MonoText className="text-[9px] text-muted opacity-50 uppercase">Processing PubMed Chunks...</MonoText>
          </div>

          {/* Connecting Lines Placeholder (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
            <line x1="25%" y1="20%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
            <line x1="75%" y1="20%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
            <line x1="25%" y1="80%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
            <line x1="75%" y1="80%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        {/* Technical Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {METRICS.map((metric) => (
            <div key={metric.id} className="text-left border-l border-[#1a1a1a] pl-6 py-2">
              <div className="text-3xl font-bold text-[#fafafa] mb-1 tabular-nums">
                {metric.value}
              </div>
              <div className="text-[10px] text-muted uppercase tracking-[0.2em] font-mono">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  )
}
