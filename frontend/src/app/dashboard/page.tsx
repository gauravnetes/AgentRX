import OrchestrationCanvas from "@/components/dashboard/components/OrchestrationCanvas"
import MetricsGrid from "@/components/dashboard/components/MetricsGrid"
import PipelineFlow from "@/components/dashboard/components/PipelineFlow"
import ActivityFeed from "@/components/dashboard/components/ActivityFeed"
import MonoText from "@/components/landing/ui/MonoText"

export default function DashboardPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Info Line */}
      <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-tight uppercase">Project Analysis: <span className="text-blue-500">RX-772-OMEGA</span></h1>
          <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">
            <MonoText className="text-[10px] text-blue-500">Molecule: Imatinib Mesylate</MonoText>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <MonoText className="text-[10px] text-muted uppercase">Agents Syncing: 5/5</MonoText>
          </div>
          <MonoText className="text-[10px] text-muted">Started: 2026-05-08 14:22:01</MonoText>
        </div>
      </div>

      {/* Primary Row: Intelligence Canvas & Live Metrics */}
      <div className="grid grid-cols-12 gap-6 h-[600px]">
        {/* Main Orchestration Hub - 8/12 */}
        <div className="col-span-12 lg:col-span-8 flex flex-col border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl">
          <div className="px-4 py-2 border-b border-[#1a1a1a] flex items-center justify-between bg-[#111111]">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Multi-Agent Orchestration Canvas</span>
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
              <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
            </div>
          </div>
          <div className="flex-1 relative">
            <OrchestrationCanvas />
          </div>
        </div>

        {/* Real-time Metrics - 4/12 */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 shadow-lg">
            <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-6 border-b border-[#1a1a1a] pb-2">Intelligence Coverage</div>
            <MetricsGrid />
          </div>
          
          <div className="h-48 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 relative overflow-hidden group">
            <div className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3">System Health</div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Worker Latency</span>
                <MonoText className="text-xs text-[#fafafa]">14ms</MonoText>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Memory Usage</span>
                <MonoText className="text-xs text-[#fafafa]">4.2 GB</MonoText>
              </div>
              <div className="h-12 w-full flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                {[40, 70, 45, 90, 65, 30, 80, 55, 40, 60, 35, 75].map((h, i) => (
                  <div key={i} className="flex-1 bg-blue-500/30 rounded-t-[1px]" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Pipeline & Activity Feed */}
      <div className="grid grid-cols-12 gap-6 h-[400px]">
        {/* Pipeline Flow Visualization - 7/12 */}
        <div className="col-span-12 lg:col-span-7 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#111111] flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Mechanism-to-Market Pipeline</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              <span className="text-[10px] text-blue-500 font-mono">STEP 03: SYNTHESIS</span>
            </div>
          </div>
          <div className="flex-1 p-6">
            <PipelineFlow />
          </div>
        </div>

        {/* Live Activity Feed - 5/12 */}
        <div className="col-span-12 lg:col-span-5 border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#111111]">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Agent Telemetry & Logs</span>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <ActivityFeed />
          </div>
        </div>
      </div>

      {/* Tertiary Row: Opportunities Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-xl p-5 hover:border-blue-500/30 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded bg-[#111111] border border-[#1a1a1a] flex items-center justify-center text-blue-500 group-hover:border-blue-500/50 transition-colors">
                {i === 1 ? '🧬' : i === 2 ? '⚖️' : '📈'}
              </div>
              <MonoText className="text-[10px] text-muted">ID: OPT-{700 + i}</MonoText>
            </div>
            <h3 className="text-sm font-semibold mb-2 group-hover:text-blue-400 transition-colors">
              {i === 1 ? 'Oncology Repurposing' : i === 2 ? 'Patent Extension Path' : 'Emerging Market Entry'}
            </h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Identified a significant therapeutic overlap in clinical phase 2 data for rare neuro diseases.
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-green-500">92% MATCH</span>
              </div>
              <button className="text-[10px] font-mono text-blue-500 uppercase hover:underline">Details &rarr;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
