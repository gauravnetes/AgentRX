import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import Button from "../ui/Button"
import MonoText from "../ui/MonoText"

export default function HeroSection() {
  return (
    <SectionWrapper id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden py-0">
      {/* Background visual elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
      </div>

      <Container className="relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <MonoText className="text-[10px] text-blue-400 uppercase tracking-[0.2em]">Next-Gen Pharma Intelligence</MonoText>
          </div>

          <h1 className="text-5xl lg:text-8xl font-bold tracking-tight mb-8 max-w-5xl mx-auto leading-[0.9] text-[#fafafa]">
            Molecules to Market <br />
            <span className="text-blue-500">Orchestrated.</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
            The multi-agent orchestration platform for pharmaceutical decision intelligence. 
            Discover breakthrough commercial opportunities through autonomous clinical, patent, and market analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="primary" className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20">
              Initialize Platform
            </Button>
            <Button variant="secondary" className="h-12 px-8 border border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#1a1a1a] text-[#fafafa] rounded-md text-xs font-bold uppercase tracking-widest transition-all">
              Watch Intelligence Flow
            </Button>
          </div>
        </div>
      </Container>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40">
        <MonoText className="text-[10px] uppercase tracking-[0.3em] text-muted">Scroll to Explore</MonoText>
        <div className="w-[1px] h-12 bg-gradient-to-b from-blue-500 to-transparent" />
      </div>
    </SectionWrapper>
  )
}
