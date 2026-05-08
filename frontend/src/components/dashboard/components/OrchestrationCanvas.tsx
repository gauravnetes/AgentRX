export default function OrchestrationCanvas() {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Live Orchestration Canvas</h2>
          <p className="text-sm text-gray-500">Real-time agent network activity</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">ACTIVE</span>
        </div>
      </div>

      {/* Graph visualization area placeholder */}
      <div className="flex-1 border border-gray-800 bg-gray-950 rounded-lg relative overflow-hidden">
        {/* SVG network placeholder */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connection lines (static for now) */}
          <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="#333" strokeWidth="1" />
          <line x1="30%" y1="30%" x2="30%" y2="70%" stroke="#333" strokeWidth="1" />
          <line x1="70%" y1="30%" x2="70%" y2="70%" stroke="#333" strokeWidth="1" />
          <line x1="30%" y1="70%" x2="70%" y2="70%" stroke="#333" strokeWidth="1" />

          {/* Agent nodes (circles) */}
          <circle cx="30%" cy="30%" r="40" fill="#111" stroke="#333" strokeWidth="2" />
          <text x="30%" y="30%" fill="#888" fontSize="12" textAnchor="middle" dominantBaseline="middle">
            Clinical
          </text>

          <circle cx="70%" cy="30%" r="40" fill="#111" stroke="#333" strokeWidth="2" />
          <text x="70%" y="30%" fill="#888" fontSize="12" textAnchor="middle" dominantBaseline="middle">
            Patent
          </text>

          <circle cx="30%" cy="70%" r="40" fill="#111" stroke="#333" strokeWidth="2" />
          <text x="30%" y="70%" fill="#888" fontSize="12" textAnchor="middle" dominantBaseline="middle">
            Market
          </text>

          <circle cx="70%" cy="70%" r="40" fill="#111" stroke="#333" strokeWidth="2" />
          <text x="70%" y="70%" fill="#888" fontSize="12" textAnchor="middle" dominantBaseline="middle">
            WebIntel
          </text>
        </svg>

        {/* Legend placeholder */}
        <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-gray-600 rounded-full" />
            <span>Active Agent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-gray-700 rounded-full bg-gray-800" />
            <span>Idle</span>
          </div>
        </div>
      </div>
    </div>
  )
}
