"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, AlertTriangle, FlaskConical } from "lucide-react";

interface MoleculeInputProps {
  onLaunch: (molecule: string) => void;
}

// ── Mirror of the backend blacklist so we show errors instantly
const BLACKLIST = new Set([
  "test","hello","world","asdf","qwerty","foo","bar","baz","null","none",
  "undefined","n/a","na","drug","molecule","compound","substance","chemical",
  "medicine","pill",
]);

// Non-pharmaceutical consumer/tech/generic words that are obviously not molecules
const CONSUMER_KEYWORDS = [
  "iphone","samsung","google","amazon","laptop","computer","phone","tablet",
  "car","bike","shoe","shirt","tv","camera","watch","airpods","android",
  "windows","linux","app","software","website","ai","chatgpt","openai",
  "food","water","pizza","burger","coffee","tea","juice","beer","wine",
];

type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string; suggestion?: string };

function validateMolecule(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length < 3)
    return { valid: false, reason: "Name is too short. Try a pharmaceutical compound like Aspirin or Imatinib." };

  if (trimmed.length > 120)
    return { valid: false, reason: "Name is too long. Enter a single compound name." };

  if (/^\d+$/.test(trimmed))
    return { valid: false, reason: "A molecule name can't be just numbers.", suggestion: "Try: Aspirin, Metformin, Retinol" };

  if (!/[A-Za-z]/.test(trimmed))
    return { valid: false, reason: "Molecule names must contain letters.", suggestion: "Try: Aspirin, Metformin, Retinol" };

  if (BLACKLIST.has(trimmed.toLowerCase()))
    return { valid: false, reason: `"${trimmed}" is not a pharmaceutical compound.`, suggestion: "Try: Aspirin, Imatinib, Metformin" };

  const lower = trimmed.toLowerCase();
  const matchedKeyword = CONSUMER_KEYWORDS.find(kw => lower.includes(kw));
  if (matchedKeyword)
    return {
      valid: false,
      reason: `"${trimmed}" doesn't look like a molecule — this is a ${matchedKeyword} product.`,
      suggestion: "Try a pharmaceutical compound e.g. Aspirin, Retinol, Imatinib, Metformin",
    };

  // Heuristic: single word or short phrase with mostly letters is likely valid
  if (!/^[A-Za-z0-9\s\-\(\)\.,/]+$/.test(trimmed))
    return { valid: false, reason: "Molecule name contains unsupported characters.", suggestion: "Use letters, digits, hyphens, or parentheses" };

  return { valid: true };
}

const SUGGESTIONS = [
  "Aspirin", "Metformin", "Imatinib", "Retinol", "Cisplatin", "Rapamycin",
];

export function MoleculeInput({ onLaunch }: MoleculeInputProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<{ reason: string; suggestion?: string } | null>(null);

  const handleLaunch = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const result = validateMolecule(trimmed);
    if (!result.valid) {
      setError({ reason: result.reason, suggestion: result.suggestion });
      return;
    }

    setError(null);
    onLaunch(trimmed);
  };

  const handleChange = (v: string) => {
    setValue(v);
    if (error) setError(null); // clear error on any edit
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto h-full space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FlaskConical className="w-5 h-5 text-[#6366F1]" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6366F1]">AgentRX M2M Platform</span>
        </div>
        <h2 className="text-3xl font-light text-[#F5F7FA] tracking-tight">
          Initialize <span className="font-semibold text-white">Orchestration</span>
        </h2>
        <p className="text-[#94A3B8] text-sm max-w-md mx-auto">
          Enter a pharmaceutical molecule or compound to launch the multi-agent discovery pipeline.
        </p>
      </div>

      <div className="w-full space-y-3">
        {/* Input row */}
        <div className={`relative w-full transition-all duration-300 ${error ? "shake" : ""}`}>
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 transition-colors duration-300 ${isFocused ? "text-white" : error ? "text-[#F87171]" : "text-[#64748B]"}`} />
          </div>

          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && handleLaunch()}
            placeholder="Enter molecule name... (e.g., Aspirin, Imatinib)"
            className={`w-full bg-black/40 border rounded-full py-5 pl-14 pr-40 text-lg text-[#F5F7FA] placeholder:text-[#475569] focus:outline-none transition-all backdrop-blur-md ${
              error
                ? "border-[#F87171]/50 focus:border-[#F87171]"
                : isFocused
                ? "border-white/40 bg-black/60"
                : "border-white/10"
            }`}
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

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 px-5 py-3.5 rounded-xl bg-[#F87171]/8 border border-[#F87171]/20"
            >
              <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-[#F87171] font-medium">{error.reason}</p>
                {error.suggestion && (
                  <p className="text-xs text-[#94A3B8] mt-0.5">{error.suggestion}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestion pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
          <span className="text-[10px] text-[#334155] uppercase tracking-wider">Try:</span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setValue(s); setError(null); }}
              className="text-xs px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#64748B] hover:text-white hover:border-white/20 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
