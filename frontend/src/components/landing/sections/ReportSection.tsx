import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import SectionHeader from "../shared/SectionHeader"
import MonoText from "../ui/MonoText"

export default function ReportSection() {
  return (
    <SectionWrapper id="reports" className="bg-[#050505] relative overflow-hidden">
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <div className="mb-4">
              <MonoText className="text-[10px] text-blue-500 uppercase tracking-[0.3em]">Phase 04: Structured Output</MonoText>
            </div>
            <SectionHeader
              title="Decision-Ready Reports."
              subtitle="Export comprehensive intelligence as professional artifacts."
              className="text-left"
            />
            <p className="text-lg text-muted leading-relaxed mb-8">
              Transform days of agent orchestration into a single, cohesive intelligence report. 
              Our reports are designed for executive review, featuring deep-dive patent analysis, 
              clinical risk scoring, and market viability projections.
            </p>
            
            <ul className="space-y-4 mb-12">
              {[
                "Executive Summary of Repurposing Potential",
                "Full Patent Landscape & Freedom to Operate",
                "Clinical Trial Design Recommendations",
                "Commercial Value & Pricing Analysis"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-[#fafafa]">
                  <div className="w-1 h-1 bg-blue-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Report Visual Skeleton */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-blue-500/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <div className="relative border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl shadow-2xl p-8 max-w-md mx-auto transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
              <div className="flex justify-between items-center mb-12">
                <div className="text-lg font-bold tracking-widest uppercase">AGENT<span className="text-blue-500">RX</span></div>
                <MonoText className="text-[10px] text-muted">REPORT ID: 2026-X88</MonoText>
              </div>
              
              <div className="space-y-6">
                <div className="h-4 bg-[#1a1a1a] rounded w-3/4" />
                <div className="h-4 bg-[#1a1a1a] rounded w-full" />
                <div className="h-4 bg-[#1a1a1a] rounded w-5/6" />
                
                <div className="py-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 border border-[#1a1a1a] bg-[#050505] rounded-md" />
                    <div className="h-24 border border-[#1a1a1a] bg-[#050505] rounded-md" />
                  </div>
                </div>
                
                <div className="h-20 border border-[#1a1a1a] bg-[#050505] rounded-md flex items-center justify-center">
                  <MonoText className="text-[10px] text-muted opacity-30">PROPRIETARY ANALYSIS</MonoText>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  )
}
