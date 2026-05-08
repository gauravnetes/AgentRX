import React from "react"
import { PIPELINE_STAGES } from "@/lib/mockData"

export default function PipelineFlow() {
  return (
    <div className="h-full flex flex-col">
      <div className="text-sm font-semibold text-gray-300 mb-4">Pipeline Flow</div>

      {/* Horizontal pipeline */}
      <div className="flex items-center justify-between flex-1">
        {PIPELINE_STAGES.map((stage, index) => (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center flex-1 max-w-xs">
              {/* Stage card */}
              <div className="w-full border border-gray-800 bg-gray-900 rounded-lg p-4 text-center relative">
                {/* Stage number */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-black border border-gray-700 text-[10px] px-2 py-0.5 rounded-full text-gray-500">
                  {index + 1}
                </div>

                {/* Icon placeholder */}
                <div className="text-2xl mb-2 opacity-50">[ICON]</div>

                <div className="text-sm font-medium mb-1">{stage}</div>
                <div className="text-xs text-gray-500">
                  {stage === "Biology" && "Molecular analysis"}
                  {stage === "Side Effects" && "Safety profiling"}
                  {stage === "Patent Clearance" && "IP clearance"}
                  {stage === "Market Validation" && "Market sizing"}
                </div>
              </div>

              {/* Connector line */}
              {index < PIPELINE_STAGES.length - 1 && (
                <div className="hidden md:block w-4 h-0.5 bg-gray-800 mt-6" />
              )}
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Overall Progress</span>
          <span>Stage 2 of 4</span>
        </div>
        <div className="h-1 bg-gray-800 rounded overflow-hidden">
          <div className="h-full w-1/2 bg-blue-900/50" />
        </div>
      </div>
    </div>
  )
}
