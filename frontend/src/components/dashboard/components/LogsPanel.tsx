export default function LogsPanel() {
  // Sample log lines placeholder
  const sampleLogs = [
    "[00:00:01] Agent initialized: Clinical",
    "[00:00:02] Agent initialized: Patent",
    "[00:00:03] Agent initialized: Market",
    "[00:00:04] Agent initialized: WebIntel",
    "[00:00:05] Orchestration engine started",
    "[00:00:06] Loading reference databases...",
    "[00:00:07] Ready for molecule input",
  ]

  return (
    <div className="h-full flex flex-col border border-gray-800 bg-gray-950 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-300">System Logs</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">LIVE</span>
        </div>
      </div>

      {/* Log output area */}
      <div className="flex-1 overflow-auto font-mono text-xs space-y-1">
        {sampleLogs.map((log, i) => (
          <div key={i} className="flex gap-2 text-gray-400">
            <span className="text-gray-600 select-none">{log.slice(0, 9)}</span>
            <span className="flex-1">{log.slice(10)}</span>
          </div>
        ))}
        {/* Simulated streaming placeholder */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={`ext-${i}`} className="flex gap-2 text-gray-500">
            <span className="text-gray-700 select-none">[00:00:{String(8 + i).padStart(2, "0")}]</span>
            <span className="flex-1 bg-gray-800/50 h-2 w-3/4 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Log controls placeholder */}
      <div className="mt-3 pt-3 border-t border-gray-800 flex gap-2">
        <button className="flex-1 px-2 py-1 border border-gray-700 bg-gray-900 rounded text-xs text-gray-400 hover:text-gray-200">
          Clear
        </button>
        <button className="flex-1 px-2 py-1 border border-gray-700 bg-gray-900 rounded text-xs text-gray-400 hover:text-gray-200">
          Pause
        </button>
        <button className="flex-1 px-2 py-1 border border-gray-700 bg-gray-900 rounded text-xs text-gray-400 hover:text-gray-200">
          Download
        </button>
      </div>
    </div>
  )
}
