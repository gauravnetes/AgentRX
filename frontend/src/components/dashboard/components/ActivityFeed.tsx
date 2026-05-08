interface Activity {
  type: "agent" | "analysis" | "alert" | "system"
  message: string
  timestamp: string
}

export default function ActivityFeed() {
  const activities: Activity[] = [
    { type: "agent", message: "Clinical Agent: Completed risk assessment for 247 compounds", timestamp: "00:00:01" },
    { type: "analysis", message: "Patent scan: 1,421 documents processed", timestamp: "00:00:05" },
    { type: "alert", message: "Conflict detected: US2024XXXXX overlaps target molecule", timestamp: "00:00:12" },
    { type: "system", message: "Market data refreshed: 47 new entries", timestamp: "00:00:18" },
    { type: "agent", message: "Web Intelligence: Monitored 12 new research papers", timestamp: "00:00:23" },
  ]

  const typeStyles = {
    agent: "bg-blue-900/30 border-blue-800",
    analysis: "bg-green-900/30 border-green-800",
    alert: "bg-red-900/30 border-red-800",
    system: "bg-gray-800 border-gray-700",
  }

  return (
    <div className="h-full flex flex-col border border-gray-800 bg-gray-900 rounded-lg p-4">
      <div className="text-sm font-semibold text-gray-300 mb-4">Live Activity Feed</div>

      {/* Activity list */}
      <div className="flex-1 overflow-auto space-y-2">
        {activities.map((activity, i) => (
          <div
            key={i}
            className={`text-xs p-3 rounded border-l-2 ${typeStyles[activity.type]}`}
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-gray-600 text-[10px] mt-0.5">
                {activity.timestamp}
              </span>
              <div className="flex-1">
                <div className="text-gray-300">{activity.message}</div>
              </div>
            </div>
          </div>
        ))}

        {/* More placeholder entries */}
        {[1, 2, 3].map((i) => (
          <div
            key={`extra-${i}`}
            className="text-xs p-3 rounded border-l-2 border-gray-800 bg-gray-950"
          >
            <div className="flex items-start gap-2">
              <span className="font-mono text-gray-600 text-[10px] mt-0.5">
                00:00:{String(30 + i * 5).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="h-2 bg-gray-700 rounded w-full" />
                <div className="h-2 bg-gray-700 rounded w-2/3 mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
