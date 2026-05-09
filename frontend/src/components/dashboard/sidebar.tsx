"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Network, 
  LayoutDashboard, 
  Activity, 
  FlaskConical, 
  FileText, 
  TrendingUp, 
  Settings,
  Hexagon
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: Network, label: "Pipeline", href: "/dashboard/pipeline" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-20 lg:w-64 h-full flex flex-col justify-between py-6 px-4 bg-transparent shrink-0 z-20">
      
      {/* Brand */}
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="w-8 h-8 rounded border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[#F5F7FA] hidden lg:block">
          AgentRX
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 space-y-2">
        <div className="px-2 mb-4 text-[10px] font-medium tracking-[0.2em] text-[#64748B] uppercase hidden lg:block">
          Platform
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.href} className="block relative outline-none">
              <motion.div 
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors duration-300 ${
                  isActive 
                    ? "text-white" 
                    : "text-[#94A3B8] hover:text-[#F5F7FA] hover:bg-white/[0.02]"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active" 
                    className="absolute inset-0 bg-white/10 rounded-lg z-0" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon className={`w-5 h-5 relative z-10 ${isActive ? "text-white" : ""}`} />
                <span className="text-sm font-medium relative z-10 hidden lg:block">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Area */}
      <div className="mt-auto space-y-2">
        <div className="px-2 mb-4 text-[10px] font-medium tracking-[0.2em] text-[#64748B] uppercase hidden lg:block">
          System
        </div>
        <Link href="/dashboard/settings" className="block outline-none">
          <motion.div 
            whileHover={{ x: 4 }}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-[#94A3B8] hover:text-[#F5F7FA] hover:bg-white/[0.02] transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium hidden lg:block">Settings</span>
          </motion.div>
        </Link>
        
        {/* Environment Indicator */}
        <div className="mt-6 px-4 py-3 rounded-xl bg-[#131A2A]/80 border border-white/[0.04] flex items-center justify-center lg:justify-start gap-3 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <div className="flex-col hidden lg:flex">
            <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Status</span>
            <span className="text-xs font-medium text-[#F5F7FA]">Operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
