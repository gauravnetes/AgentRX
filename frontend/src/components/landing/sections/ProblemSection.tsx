import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import SectionHeader from "../shared/SectionHeader"
import MonoText from "../ui/MonoText"
import { PAIN_POINTS } from "@/lib/mockData"

export default function ProblemSection() {
  return (
    <SectionWrapper id="problem" className="border-t border-[#1a1a1a]">
      <Container>
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          {/* Left: Narrative - 5/12 */}
          <div className="lg:col-span-5">
            <div className="mb-4">
              <MonoText className="text-[10px] text-blue-500 uppercase tracking-[0.3em]">Phase 01: The Bottleneck</MonoText>
            </div>
            <SectionHeader
              title="Intelligence is Siloed."
              subtitle="Pharma research is fragmented, slow, and misses critical market signals."
              className="text-left"
            />
            <p className="text-lg text-muted leading-relaxed mb-12">
              Traditional pharmaceutical intelligence is siloed across teams, tools, and continents.
              Critical patent conflicts hide in plain sight. Market opportunities slip through the cracks
              while manual processes grind innovation to a halt.
            </p>

            {/* Pain points */}
            <div className="space-y-8">
              {PAIN_POINTS.slice(0, 3).map((point, i) => (
                <div key={point.id} className="group">
                  <div className="flex items-center gap-4 mb-2">
                    <MonoText className="text-[10px] text-muted opacity-40 group-hover:opacity-100 transition-opacity">0{i + 1}</MonoText>
                    <h3 className="text-sm font-semibold uppercase tracking-wider">{point.title}</h3>
                  </div>
                  <p className="text-muted text-sm leading-relaxed pl-8 border-l border-[#1a1a1a] group-hover:border-blue-500/50 transition-colors">
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual Comparison - 7/12 */}
          <div className="lg:col-span-7 hidden lg:block sticky top-32">
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-[#1a1a1a] bg-[#111111] flex items-center justify-between">
                <MonoText className="text-[10px] text-muted uppercase">Intelligence Flow Analysis</MonoText>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/20" />
                  <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" />
                </div>
              </div>
              <div className="p-8 space-y-12">
                {/* Manual Workflow */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-muted uppercase">Manual Legacy Workflow</span>
                    <span className="text-[10px] font-mono text-red-500">INEFFICIENT</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-12 border border-[#1a1a1a] bg-[#050505] rounded-md flex items-center justify-center grayscale opacity-30">
                        <div className="w-1/2 h-1 bg-[#1a1a1a] rounded" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="w-[1px] h-8 bg-gradient-to-b from-[#1a1a1a] to-blue-500/30" />
                </div>

                {/* AgentRX Workflow */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-muted uppercase">AgentRX Orchestrated Intelligence</span>
                    <span className="text-[10px] font-mono text-blue-500">OPTIMIZED</span>
                  </div>
                  <div className="relative h-24 border border-blue-500/20 bg-blue-500/5 rounded-md flex items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]" />
                    <MonoText className="text-xs text-blue-400 group-hover:scale-110 transition-transform">AUTONOMOUS SYNTHESIS ACTIVE</MonoText>
                    {/* Animated scanning line */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/50 animate-[scan_3s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  )
}
