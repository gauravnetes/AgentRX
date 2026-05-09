interface AgentCardProps {
  name: string
  status?: "active" | "idle" | "error"
  activity?: string
}

export default function AgentCard({ name, status = "idle", activity = "0 tasks" }: AgentCardProps) {
  const statusColors = {
    active: "bg-green-500",
    idle: "bg-gray-500",
    error: "bg-red-500",
  }

  return (
    <div className="border border-gray-800 bg-gray-900 rounded-lg p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-gray-700 bg-gray-800 rounded flex items-center justify-center text-sm">
            [ICON]
          </div>
          <div>
            <div className="font-medium text-sm">{name}</div>
            <div className="text-xs text-gray-500">{activity}</div>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
      </div>

      {/* Progress/activity bar placeholder */}
      <div className="h-1 bg-gray-800 rounded overflow-hidden">
        <div
          className={`h-full ${status === "active" ? "bg-green-900/50 w-2/3" : "bg-gray-700 w-1/4"
            }`}
        />
      </div>
    </div>
  )
}
