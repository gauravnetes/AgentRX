import MonoText from "@/components/ui/mono-text"

export default function Sidebar() {
  const navItems = [
    { id: "01", label: "Intelligence Hub", active: true },
    { id: "02", label: "Agent Orchestration" },
    { id: "03", label: "Opportunity Analysis" },
    { id: "04", label: "Report Library" },
    { id: "05", label: "System Config" },
  ]

  return (
    <div className="h-full flex flex-col p-4">
      {/* Brand logo */}
      <div className="px-2 py-4 mb-6">
        <div className="text-xl font-bold tracking-[0.2em] text-[#fafafa]">
          AGENT<span className="text-blue-500">RX</span>
        </div>
        <div className="mt-1">
          <MonoText className="text-[10px] text-muted uppercase opacity-50">
            Decision Intelligence v0.1.0-alpha
          </MonoText>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <div
            key={item.id}
            className={`group px-3 py-2 rounded-md transition-all duration-200 cursor-pointer flex items-center gap-3 ${
              item.active 
                ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" 
                : "text-muted hover:text-foreground hover:bg-[#1a1a1a]"
            }`}
          >
            <MonoText className={`text-[10px] ${item.active ? "text-blue-500" : "opacity-40"}`}>
              {item.id}
            </MonoText>
            <span className="text-xs font-medium tracking-wide uppercase">
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* System Status */}
      <div className="mb-4 px-3 py-3 border border-[#1a1a1a] bg-[#050505] rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted uppercase font-mono">Orchestrator</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-500 font-mono">ACTIVE</span>
          </div>
        </div>
        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div className="h-full w-[85%] bg-blue-500" />
        </div>
      </div>

      {/* User profile */}
      <div className="border-t border-[#1a1a1a] pt-4 mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a1a] cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded border border-[#1a1a1a] bg-[#0a0a0a] flex items-center justify-center text-xs font-mono text-muted group-hover:border-muted">
            SR
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">Souvik Rahut</div>
            <div className="text-[10px] text-muted font-mono truncate">ID: 8824-001</div>
          </div>
        </div>
      </div>
    </div>
  )
}
