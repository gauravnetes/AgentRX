interface PipelineStepProps {
  name: string
  description?: string
  isActive?: boolean
  isCompleted?: boolean
}

export default function PipelineStep({ name, description, isActive = false, isCompleted = false }: PipelineStepProps) {
  const statusStyles = {
    default: "border-gray-800 bg-gray-900",
    active: "border-blue-900 bg-blue-950/30",
    completed: "border-green-900 bg-green-950/30",
  }

  const status = isActive ? "active" : isCompleted ? "completed" : "default"

  return (
    <div className={`flex flex-col items-center border rounded-lg p-4 text-center transition-all ${statusStyles[status]}`}>
      {/* Connector for horizontal layout */}
      <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-4 w-4 h-0.5 bg-gray-800" />

      {/* Step number */}
      <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center mb-2 ${
        isActive ? "bg-blue-900 text-blue-300" : isCompleted ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-500"
      }`}>
        {isCompleted ? "✓" : "•"}
      </div>

      {/* Step name */}
      <div className="text-sm font-medium mb-1">{name}</div>

      {/* Optional description */}
      {description && <div className="text-xs text-gray-500 hidden md:block">{description}</div>}
    </div>
  )
}
