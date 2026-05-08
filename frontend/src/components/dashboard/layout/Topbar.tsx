import MonoText from "../../landing/ui/MonoText"

export default function Topbar() {
  return (
    <div className="h-full flex items-center justify-between px-6 gap-8">
      {/* Search area */}
      <div className="flex-1 max-w-2xl flex items-center gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search Intelligence Hub..."
            className="w-full h-9 pl-10 pr-4 bg-[#111111] border border-[#1a1a1a] rounded text-xs text-[#fafafa] placeholder-muted focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        {/* Molecule Quick Action */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#111111] border border-[#1a1a1a] rounded-md">
          <MonoText className="text-[10px] text-blue-400">SMILES:</MonoText>
          <input
            type="text"
            placeholder="Enter molecular string..."
            className="bg-transparent border-none outline-none text-[10px] font-mono text-muted w-40 placeholder-muted/50"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 pr-4 border-r border-[#1a1a1a] h-6">
          <div className="text-[10px] font-mono text-muted uppercase tracking-tighter">Current Session:</div>
          <MonoText className="text-[10px] text-[#fafafa]">CTX-9942-B</MonoText>
        </div>

        <button className="h-9 px-4 border border-[#1a1a1a] bg-[#0a0a0a] hover:bg-[#1a1a1a] rounded text-[10px] font-semibold uppercase tracking-widest transition-colors">
          Initialize Agent
        </button>
        
        <button className="h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold uppercase tracking-widest shadow-lg shadow-blue-900/20 transition-all">
          Generate Report
        </button>

        {/* Notifications */}
        <div className="w-9 h-9 border border-[#1a1a1a] flex items-center justify-center rounded cursor-pointer hover:bg-[#1a1a1a] relative group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted group-hover:text-foreground transition-colors">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full border border-[#050505]" />
        </div>
      </div>
    </div>
  )
}
