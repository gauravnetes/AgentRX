import { Sidebar } from "@/components/dashboard/sidebar";
import LightPillar from "@/components/ui/LightPillar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-black text-[#F5F7FA] overflow-hidden selection:bg-white/20 relative">
      
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 opacity-80 mix-blend-screen pointer-events-none">
        <LightPillar
          bottomColor="#bb58ff"
          topColor="#b791ff"
          intensity={0.8}
          rotationSpeed={0.3}
          glowAmount={0.001}
          pillarWidth={3.1}
          pillarHeight={0.3}
          noiseIntensity={0.4}
          pillarRotation={271}
          interactive={false}
          quality="high"
        />
      </div>

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative z-10 p-4 pl-0">
        <div className="w-full h-full flex rounded-2xl bg-black/40 border border-white/[0.08] backdrop-blur-3xl overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
