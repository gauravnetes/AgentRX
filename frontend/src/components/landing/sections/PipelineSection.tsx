import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import SectionHeader from "../shared/SectionHeader"
import { PIPELINE_STAGES } from "@/lib/mockData"

export default function PipelineSection() {
  return (
    <SectionWrapper id="pipeline">
      <Container>
        <SectionHeader
          title="MECHANISM-TO-MARKET PIPELINE"
          subtitle="From biological insight to commercial intelligence — fully automated."
        />

        {/* Horizontal pipeline container */}
        <div className="relative py-12">
          {/* Progress line (static placeholder) */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 -translate-y-1/2" />

          {/* Pipeline stages */}
          <div className="relative flex justify-between items-stretch">
            {PIPELINE_STAGES.map((stage, index) => (
              <div key={stage} className="flex flex-col items-center flex-1 max-w-xs mx-auto">
                {/* Stage card */}
                <div className="relative z-10 w-full border border-gray-800 bg-gray-900 rounded-lg p-6 text-center transition-all duration-300 hover:border-gray-600 hover:bg-gray-800/50 cursor-default">
                  {/* Stage number badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black border border-gray-700 text-xs px-3 py-1 rounded-full text-gray-500">
                    STAGE {index + 1}
                  </div>

                  {/* Icon placeholder */}
                  <div className="text-4xl mb-4 opacity-50">[ICON]</div>

                  {/* Stage title */}
                  <h3 className="text-lg font-semibold mb-2">{stage}</h3>

                  {/* Description placeholder */}
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {stage === "Biology" && "Molecular analysis and target identification"}
                    {stage === "Side Effects" && "Safety profiling and toxicity assessment"}
                    {stage === "Patent Clearance" && "IP landscape mapping and freedom-to-operate"}
                    {stage === "Market Validation" && "Revenue forecasting and competitive analysis"}
                  </p>

                  {/* Expandable content placeholder (shown on hover in Phase 3) */}
                  <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-600 hidden group-hover:block">
                    [Expand for details...]
                  </div>
                </div>

                {/* Arrow connector (except last) */}
                {index < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -translate-y-1/2 -right-4 text-gray-600">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline stats placeholder */}
        <div className="mt-16 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl font-mono mb-1">~2.4s</div>
            <div className="text-sm text-gray-500">Avg. Cycle Time</div>
          </div>
          <div>
            <div className="text-2xl font-mono mb-1">94.7%</div>
            <div className="text-sm text-gray-500">Clearance Rate</div>
          </div>
          <div>
            <div className="text-2xl font-mono mb-1">1,247</div>
            <div className="text-sm text-gray-500">Pipelines Active</div>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  )
}
