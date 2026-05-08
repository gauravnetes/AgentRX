"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Sparkles, Send, Minimize2, Maximize2 } from "lucide-react";

interface AssistantWidgetProps {
  compact?: boolean;
  threadId?: string | null;
}

export function AssistantWidget({ compact: initialCompact = false, threadId }: AssistantWidgetProps) {
  const [isCompact, setIsCompact] = useState(initialCompact);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "I'm analyzing the patent landscape and biological pathways. Do you want me to prioritize specific therapeutic areas?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || !threadId || threadId === "mock-uuid-fallback") return;
    
    const userMsg = message.trim();
    setMessage("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, message: userMsg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply || "I couldn't process that request." }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: "Network error communicating with the agent." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      layout
      className={`bg-[#131A2A]/80 border border-white/[0.04] rounded-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-500 ${
        isCompact ? "h-14" : "h-[300px]"
      }`}
    >
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
        onClick={() => setIsCompact(!isCompact)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-semibold text-[#F5F7FA]">Analysis Assistant</span>
        </div>
        <button className="text-[#64748B] hover:text-[#F5F7FA] transition-colors">
          {isCompact ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {!isCompact && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col p-4 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-6 h-6 rounded border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className={`bg-white/5 rounded-xl p-3 text-sm text-[#E2E8F0] border border-white/10 ${msg.role === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded border border-white/20 bg-white/5 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-white animate-pulse" />
                  </div>
                  <div className="bg-white/5 rounded-xl rounded-tl-none p-3 text-sm text-[#E2E8F0] border border-white/10 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask about the analysis..."
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-4 pr-10 text-sm text-[#F5F7FA] placeholder:text-[#475569] focus:outline-none focus:border-white/40 transition-colors"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                  message.trim() && !isLoading ? "bg-white text-black" : "text-[#475569]"
                }`}
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
