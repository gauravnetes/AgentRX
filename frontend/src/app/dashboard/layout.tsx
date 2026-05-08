import { TopHeader } from "@/components/layout/TopHeader";
import { LeftNav } from "@/components/layout/LeftNav";
import { TelemetryPanel } from "@/components/layout/TelemetryPanel";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-[#0D0F12] text-[#E8E9EB] overflow-hidden">
      <TopHeader />
      <div className="flex flex-1 overflow-hidden">
        <LeftNav />
        <div className="flex flex-col flex-1 overflow-hidden">
          {children}
        </div>
        <TelemetryPanel />
      </div>
    </div>
  );
}
