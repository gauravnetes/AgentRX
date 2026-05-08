interface OpportunityCardProps {
  title?: string
  value?: string
  description?: string
}

export default function OpportunityCard({
  title = "Opportunity Title",
  value = "$0M",
  description = "Opportunity description placeholder"
}: OpportunityCardProps) {
  return (
    <div className="border border-gray-800 bg-gray-900 rounded-lg p-4 hover:border-gray-600 transition-colors cursor-pointer">
      {/* Category badge */}
      <div className="text-xs text-blue-400 uppercase tracking-wide mb-2 font-medium">
        Opportunity
      </div>

      {/* Title */}
      <div className="text-sm font-semibold text-gray-100 mb-1">{title}</div>

      {/* Value */}
      <div className="text-xl font-mono text-gray-100 mb-2">{value}</div>

      {/* Description */}
      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{description}</p>

      {/* Action placeholder */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
          View analysis →
        </div>
      </div>
    </div>
  )
}
