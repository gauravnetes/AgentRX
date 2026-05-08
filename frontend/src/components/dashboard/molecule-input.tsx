"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";

interface MoleculeInputProps {
  onLaunch: (molecule: string) => void;
}

export function MoleculeInput({ onLaunch }: MoleculeInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleLaunch = () => {
    if (value.trim()) {
      onLaunch(value.trim());
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-full space-y-8"
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-light text-[#F5F7FA] tracking-tight">
          Initialize <span className="font-semibold text-white">Orchestration</span>
        </h2>
        <p className="text-[#94A3B8] text-sm max-w-md mx-auto">
          Enter a molecule, compound, or target to launch the multi-agent discovery pipeline.
        </p>
      </div>

      <div 
        className={`relative w-full transition-all duration-500 rounded-full ${
          isFocused ? "border-white/40 shadow-none" : "border-white/10"
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-white" : "text-[#64748B]"}`} />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && handleLaunch()}
          placeholder="Enter molecule name... (e.g., Aspirin, Imatinib)"
          className="w-full bg-black/40 border border-white/10 rounded-full py-5 pl-14 pr-40 text-lg text-[#F5F7FA] placeholder:text-[#475569] focus:outline-none focus:border-white/40 focus:bg-black/60 transition-all backdrop-blur-md"
        />

        <div className="absolute inset-y-0 right-2 flex items-center">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLaunch}
            disabled={!value.trim()}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide uppercase transition-all duration-300 ${
              value.trim() 
                ? "bg-white text-black hover:bg-neutral-200" 
                : "bg-white/[0.04] text-[#64748B] cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Launch
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
