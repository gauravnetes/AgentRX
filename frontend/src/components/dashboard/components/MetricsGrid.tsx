interface Metric {
  label: string
  value: string | number
  trend?: "up" | "down" | "neutral"
}

interface MetricsGridProps {
  metrics?: Metric[]
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const defaultMetrics: Metric[] = [
    { label: "Active Sessions", value: "0", trend: "up" },
    { label: "Patents Analyzed", value: "0", trend: "neutral" },
    { label: "Conflicts Found", value: "0", trend: "down" },
    { label: "Opportunities", value: "0", trend: "up" },
  ]

  const displayMetrics = metrics || defaultMetrics

  return (
    <div className="h-full flex flex-col">
      <div className="text-sm font-semibold text-gray-300 mb-4">Metrics</div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {displayMetrics.map((metric) => (
          <div
            key={metric.label}
            className="border border-gray-800 bg-gray-900 rounded p-4 flex flex-col justify-center"
          >
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
              {metric.label}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono text-gray-100">{metric.value}</span>
              {metric.trend && (
                <span
                  className={`text-xs ${metric.trend === "up"
                    ? "text-green-500"
                    : metric.trend === "down"
                      ? "text-red-500"
                      : "text-gray-500"
                    }`}
                >
                  {metric.trend === "up" && "▲"}
                  {metric.trend === "down" && "▼"}
                  {metric.trend === "neutral" && "●"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
