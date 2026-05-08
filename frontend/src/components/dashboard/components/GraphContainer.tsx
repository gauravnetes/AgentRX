export default function GraphContainer() {
  return (
    <div className="h-full flex flex-col border border-gray-800 bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-300">Agent Network Graph</div>
          <div className="text-xs text-gray-500">Interactive topology view</div>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-gray-700 bg-gray-950 rounded text-xs text-gray-400 hover:text-gray-200">
            Zoom
          </button>
          <button className="px-3 py-1 border border-gray-700 bg-gray-950 rounded text-xs text-gray-400 hover:text-gray-200">
            Reset
          </button>
        </div>
      </div>

      {/* SVG graph placeholder */}
      <div className="flex-1 border border-gray-800 bg-gray-950 rounded relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 20, 40, 60, 80, 100].map((val) => (
            <g key={val}>
              <line
                x1={val}
                y1="0"
                x2={val}
                y2="100"
                stroke="#1a1a1a"
                strokeWidth="0.5"
              />
              <line
                x1="0"
                y1={val}
                x2="100"
                y2={val}
                stroke="#1a1a1a"
                strokeWidth="0.5"
              />
            </g>
          ))}

          {/* Node connections (edges) */}
          <line x1="25" y1="25" x2="75" y2="25" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="25" y1="25" x2="25" y2="75" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="75" y1="25" x2="75" y2="75" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="25" y1="75" x2="75" y2="75" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="25" y1="25" x2="75" y2="75" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="75" y1="25" x2="25" y2="75" stroke="#333" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* Agent nodes */}
          <circle cx="25" cy="25" r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
          <text x="25" y="22" fill="#666" fontSize="3" textAnchor="middle">
            Clinical
          </text>

          <circle cx="75" cy="25" r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
          <text x="75" y="22" fill="#666" fontSize="3" textAnchor="middle">
            Patent
          </text>

          <circle cx="25" cy="75" r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
          <text x="25" y="72" fill="#666" fontSize="3" textAnchor="middle">
            Market
          </text>

          <circle cx="75" cy="75" r="4" fill="#111" stroke="#333" strokeWidth="0.5" />
          <text x="75" y="72" fill="#666" fontSize="3" textAnchor="middle">
            WebIntel
          </text>
        </svg>

        {/* Node tooltip placeholder */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-950/80 px-2 py-1 rounded border border-gray-800">
          Click a node to view agent details
        </div>
      </div>
    </div>
  )
}
