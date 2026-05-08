import Container from "../shared/Container"
import SectionWrapper from "../shared/SectionWrapper"
import SectionHeader from "../shared/SectionHeader"
import MonoText from "../ui/MonoText"

export default function IntelligenceSection() {
  return (
    <SectionWrapper id="intelligence">
      <Container>
        <div className="text-center mb-16">
          <div className="mb-4">
            <MonoText className="text-[10px] text-blue-500 uppercase tracking-[0.3em]">Phase 03: Autonomous Synthesis</MonoText>
          </div>
          <SectionHeader
            title="Beyond Search."
            subtitle="AgentRX doesn't just find data. It synthesizes intelligence."
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            { 
              title: "Mechanism Mapping", 
              desc: "Deep analysis of biological pathways and drug-target interactions.",
              id: "01"
            },
            { 
              title: "Clinical Trajectory", 
              desc: "Predicting trial outcomes based on historical meta-data and real-world evidence.",
              id: "02"
            },
            { 
              title: "Market Viability", 
              desc: "Calculating commercial potential and competitive landscape in real-time.",
              id: "03"
            }
          ].map((item) => (
            <div key={item.id} className="p-8 border border-[#1a1a1a] bg-[#0a0a0a] rounded-2xl hover:border-blue-500/30 transition-all group">
              <div className="mb-6">
                <MonoText className="text-[10px] text-muted opacity-40 group-hover:text-blue-500 group-hover:opacity-100 transition-all tracking-widest">
                  MODULE_{item.id}
                </MonoText>
              </div>
              <h3 className="text-xl font-bold mb-4 text-[#fafafa]">{item.title}</h3>
              <p className="text-muted leading-relaxed text-sm mb-8">
                {item.desc}
              </p>
              <div className="pt-6 border-t border-[#1a1a1a] group-hover:border-blue-500/10 transition-colors">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-blue-500/40' : 'bg-[#1a1a1a]'}`} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </SectionWrapper>
  )
}
