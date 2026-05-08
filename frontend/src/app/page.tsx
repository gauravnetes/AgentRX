import HeroSection from "@/components/landing/sections/HeroSection"
import ProblemSection from "@/components/landing/sections/ProblemSection"
import OrchestrationSection from "@/components/landing/sections/OrchestrationSection"
import PipelineSection from "@/components/landing/sections/PipelineSection"
import IntelligenceSection from "@/components/landing/sections/IntelligenceSection"
import ReportSection from "@/components/landing/sections/ReportSection"
import FinalCTASection from "@/components/landing/sections/FinalCTASection"

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <ProblemSection />
      <OrchestrationSection />
      <PipelineSection />
      <IntelligenceSection />
      <ReportSection />
      <FinalCTASection />
    </main>
  )
}
