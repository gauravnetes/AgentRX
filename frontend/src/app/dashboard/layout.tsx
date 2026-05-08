import Sidebar from "@/components/dashboard/layout/Sidebar"
import Topbar from "@/components/dashboard/layout/Topbar"
import InsightsPanel from "@/components/dashboard/layout/InsightsPanel"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#050505] text-[#fafafa] overflow-hidden font-sans">
      {/* Sidebar - Fixed Width */}
      <aside className="w-64 border-r border-[#1a1a1a] flex-shrink-0 bg-[#0a0a0a] z-20">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar - Fixed Height */}
        <header className="h-14 border-b border-[#1a1a1a] flex-shrink-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
          <Topbar />
        </header>

        {/* Dashboard Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Scrolable Area */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#050505]">
            <div className="p-6 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>

          {/* Insights Panel - Collapsible in future, fixed for now */}
          <aside className="w-80 border-l border-[#1a1a1a] flex-shrink-0 bg-[#0a0a0a] overflow-y-auto hidden xl:block">
            <InsightsPanel />
          </aside>
        </div>
      </div>
    </div>
  )
}
