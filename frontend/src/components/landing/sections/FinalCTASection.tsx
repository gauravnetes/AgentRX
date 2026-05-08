import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import Button from "../ui/Button"
import MonoText from "../ui/MonoText"

export default function FinalCTASection() {
  return (
    <SectionWrapper id="cta" className="relative overflow-hidden py-32 border-t border-[#1a1a1a]">
      {/* Background visual */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <MonoText className="text-[10px] text-blue-500 uppercase tracking-[0.4em]">Ready to Orchestrate?</MonoText>
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold tracking-tight mb-8 text-[#fafafa]">
            The Future of Pharma <br />
            Intelligence is <span className="text-blue-500">Autonomous.</span>
          </h2>
          <p className="text-lg text-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Join the leading pharmaceutical companies using AgentRX to uncover hidden opportunities 
            through multi-agent decision intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" className="h-12 px-10 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20">
              Request Platform Access
            </Button>
            <Button variant="secondary" className="h-12 px-10 border border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#1a1a1a] text-[#fafafa] rounded-md text-xs font-bold uppercase tracking-widest transition-all">
              Technical Whitepaper
            </Button>
          </div>

          <div className="mt-24 pt-12 border-t border-[#1a1a1a]">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-lg font-bold tracking-[0.2em] text-[#fafafa]">
                AGENT<span className="text-blue-500">RX</span>
              </div>
              <div className="flex gap-8">
                {["Privacy", "Terms", "Security", "Contact"].map((item) => (
                  <a key={item} href="#" className="text-[10px] text-muted uppercase tracking-widest hover:text-blue-500 transition-colors">
                    {item}
                  </a>
                ))}
              </div>
              <MonoText className="text-[10px] text-muted opacity-50 uppercase">
                &copy; 2026 AgentRX Intelligence Corp.
              </MonoText>
            </div>
          </div>
        </div>
      </Container>
    </SectionWrapper>
  )
}
