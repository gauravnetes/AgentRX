import OpportunityCard from "@/components/dashboard/components/OpportunityCard"

export default function InsightsPanel() {
  return (
    <div className="h-full p-4 space-y-6">
      {/* Panel header */}
      <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-800">
        Insights
      </div>

      {/* Opportunity cards */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
          Top Opportunities
        </div>
        {[1, 2, 3].map((i) => (
          <OpportunityCard key={i} />
        ))}
      </div>

      {/* Patent Risk indicator */}
      <div className="border border-gray-800 bg-gray-900 rounded-lg p-4">
        <div className="text-sm text-gray-500 mb-3 uppercase tracking-wide">
          Patent Risk
        </div>
        {/* Risk meter */}
        <div className="h-2 bg-gray-800 rounded overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-green-900 via-yellow-900 to-red-900" />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Low</span>
          <span>High</span>
        </div>
        {/* Current risk level */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-400">Current portfolio:</span>
          <span className="text-lg font-mono text-green-400">12%</span>
        </div>
      </div>

      {/* Market metrics */}
      <div className="border border-gray-800 bg-gray-900 rounded-lg p-4">
        <div className="text-sm text-gray-500 mb-2 uppercase tracking-wide">
          Market Size (TAM)
        </div>
        <div className="text-2xl font-mono text-gray-100 mb-1">$47.2B</div>
        <div className="text-xs text-green-500">↑ 8.4% YoY growth</div>
      </div>

      {/* Export actions */}
      <div className="space-y-2 pt-4 border-t border-gray-800">
        <button className="w-full px-4 py-2 border border-gray-700 bg-gray-900 hover:bg-gray-800 rounded text-sm text-gray-300 transition-colors text-left">
          📥 Download Full Report (PDF)
        </button>
        <button className="w-full px-4 py-2 border border-gray-700 bg-gray-900 hover:bg-gray-800 rounded text-sm text-gray-300 transition-colors text-left">
          📊 Export Data (Excel)
        </button>
        <button className="w-full px-4 py-2 border border-gray-700 bg-gray-900 hover:bg-gray-800 rounded text-sm text-gray-300 transition-colors text-left">
          📋 Copy Executive Summary
        </button>
      </div>
    </div>
  )
}
