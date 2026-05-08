"use client"

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import LightPillar from "./LightPillar";
import { motion } from "framer-motion";

const STYLE_ID = "hero-animations";

/* ── Monochrome palette ───────────────────────────────────── */
const palettes = {
  dark: {
    surface: "bg-neutral-950 text-neutral-100",
    heading: "text-white",
    muted: "text-neutral-500",
    capsule: "bg-white/5 border-white/10 text-white/70",
    card: "bg-neutral-900/60",
    toggleSurface: "bg-white/5",
    toggle: "border-white/10 text-white/70",
    gridColor: "rgba(255, 255, 255, 0.04)",
    overlay:
      "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.75) 50%, rgba(10,10,10,0.95) 100%)",
  },
  light: {
    surface: "bg-neutral-100 text-neutral-900",
    heading: "text-neutral-900",
    muted: "text-neutral-500",
    capsule: "bg-neutral-200/60 border-neutral-300/50 text-neutral-600",
    card: "bg-white/80",
    toggleSurface: "bg-white",
    toggle: "border-neutral-300 text-neutral-600",
    gridColor: "rgba(0, 0, 0, 0.05)",
    overlay:
      "linear-gradient(180deg, rgba(245,245,245,0.96) 0%, rgba(245,245,245,0.7) 50%, rgba(245,245,245,0.96) 100%)",
  },
};

type Theme = "dark" | "light";

const getRootTheme = (): Theme => {
  if (typeof document === "undefined") return "dark";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.dataset?.theme === "dark") return "dark";
  if (root.classList.contains("light")) return "light";
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "dark";
};

function MinimalHeroSection() {
  const [theme, setTheme] = useState<Theme>(() => getRootTheme());
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  /* inject animations */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.innerHTML = `
      @keyframes hero-reveal {
        0%   { opacity: 0; transform: translateY(32px) scale(0.98); filter: blur(10px); }
        60%  { filter: blur(0); }
        100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
      }

      /* ── Liquid glass button (Jelly) ─────────────────────── */
      .glass-btn {
        position: relative;
        overflow: hidden;
        background: linear-gradient(
          135deg,
          rgba(255,255,255,0.08) 0%,
          rgba(255,255,255,0.02) 50%,
          rgba(255,255,255,0.05) 100%
        );
        backdrop-filter: blur(24px) saturate(1.8);
        -webkit-backdrop-filter: blur(24px) saturate(1.8);
        border: 1px solid rgba(255,255,255,0.2);
        box-shadow:
          0 8px 32px -8px rgba(0,0,0,0.5),
          inset 0 2px 4px rgba(255,255,255,0.15),
          inset 0 -2px 4px rgba(0,0,0,0.2);
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .glass-btn::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(
          135deg,
          rgba(255,255,255,0.12) 0%,
          transparent 60%
        );
        pointer-events: none;
      }
      .glass-btn:hover {
        border-color: rgba(255,255,255,0.25);
        box-shadow:
          0 12px 36px -8px rgba(0,0,0,0.6),
          0 0 0 1px rgba(255,255,255,0.05),
          inset 0 2px 4px rgba(255,255,255,0.18);
        background: linear-gradient(
          135deg,
          rgba(255,255,255,0.1) 0%,
          rgba(255,255,255,0.04) 50%,
          rgba(255,255,255,0.08) 100%
        );
      }
      .glass-btn:active { /* Handled by Framer Motion */ }

      /* Light mode override */
      .light-mode .glass-btn {
        background: linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.02) 100%);
        border-color: rgba(0,0,0,0.1);
        box-shadow: 0 8px 24px -8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6);
        color: #171717;
      }
      .light-mode .glass-btn:hover {
        border-color: rgba(0,0,0,0.2);
        box-shadow: 0 12px 36px -8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.7);
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.remove();
    };
  }, []);

  /* sync theme */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const sync = () => setTheme(getRootTheme());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onMedia = () => sync();
    media?.addEventListener("change", onMedia);
    return () => { obs.disconnect(); media?.removeEventListener("change", onMedia); };
  }, []);

  /* reveal on mount */
  useEffect(() => {
    if (!sectionRef.current) return;
    const node = sectionRef.current;
    const obs = new IntersectionObserver(
      (e) => { if (e[0]?.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const palette = useMemo(() => palettes[theme], [theme]);

  const toggleTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const next = root.classList.contains("dark") ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    root.classList.toggle("light", next === "light");
    setTheme(next);
  };

  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden transition-colors duration-700 ${palette.surface} ${theme === "light" ? "light-mode" : ""}`}
      style={{ "--grid-color": palette.gridColor } as React.CSSProperties}
    >
      {/* ── Background ──────────────────────────────────── */}
      {/* Removed hardcoded bg-black to allow palette.surface to handle theme colors */}
      
      {/* Three.js LightPillar Background */}
      <div style={{ width: '100%', height: '100vh', position: 'absolute', top: 0, left: 0, zIndex: 0, opacity: 0.8 }}>
        <LightPillar
          bottomColor="#bb58ff"
          topColor="#b791ff"
          intensity={1.1}
          rotationSpeed={0.4}
          glowAmount={0.001}
          pillarWidth={3.1}
          pillarHeight={0.3}
          noiseIntensity={0.4}
          pillarRotation={271}
          interactive={true}
          mixBlendMode="color-dodge"
          quality="high"
        />
      </div>

      {/* ── Centered hero section ────────────────────── */}
      <section
        ref={sectionRef}
        className={`relative z-10 flex items-center justify-center min-h-screen px-6 py-20 ${
          visible ? "animate-[hero-reveal_0.9s_cubic-bezier(.22,.68,0,1)_forwards]" : "opacity-0"
        }`}
      >
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-10">
          {/* ── Landscape Card ─────────────────────────── */}
          <div
            className={`w-full ${palette.card} rounded-3xl border border-white/[0.06] dark:border-white/[0.06] shadow-[0_24px_80px_-20px_rgba(0,0,0,0.6)] transition-colors duration-500 overflow-hidden`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 items-stretch min-h-[420px]">
              {/* Left: Copy */}
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
                }}
                className="flex flex-col justify-center gap-6 p-8 sm:p-10 lg:p-14"
              >
                {/* Capsule */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                  className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] uppercase tracking-[0.45em] ${palette.capsule}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                  Decision Intelligence Platform
                </motion.div>

                {/* Title — BIG AgentRX */}
                <motion.h1
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                  className={`font-bold leading-[0.85] tracking-[-0.05em] ${palette.heading}`}
                  style={{ fontSize: "clamp(3rem, 7vw, 5.5rem)" }}
                >
                  Agent<span className="opacity-50">RX</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                  className={`max-w-sm text-sm leading-relaxed ${palette.muted}`}
                >
                  Autonomous multi-agent orchestration for pharmaceutical
                  intelligence. From biological pathways to market viability —
                  in minutes, not months.
                </motion.p>

                {/* CTAs */}
                <motion.div 
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                  className="flex items-center gap-4 flex-wrap pt-2"
                >
                  <motion.div
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href="/dashboard"
                      className="glass-btn rounded-full px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.35em] text-white"
                    >
                      Launch Platform
                    </Link>
                  </motion.div>
                  <motion.button
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    type="button"
                    onClick={toggleTheme}
                    className={`inline-flex items-center gap-3 rounded-full border px-4 py-2.5 text-[11px] uppercase tracking-[0.3em] transition-colors hover:bg-white/5 ${palette.toggleSurface} ${palette.toggle}`}
                    aria-pressed={theme === "dark"}
                  >
                    <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                    {theme === "dark" ? "Light" : "Dark"} mode
                  </motion.button>
                </motion.div>

                {/* Stats */}
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                  className={`flex items-center gap-6 pt-2 text-[10px] uppercase tracking-[0.35em] ${palette.muted}`}
                >
                  <span>4 AI Agents</span>
                  <span className="h-3 w-px bg-current opacity-20" />
                  <span>M2M Pipeline</span>
                </motion.div>
              </motion.div>

              {/* Right: Abstract Image */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative min-h-[280px] md:min-h-0"
              >
                <video
                  src="/llm.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="object-cover w-full h-full absolute inset-0"
                />
                {/* Subtle left-edge gradient to blend into card */}
                <div className={`absolute inset-0 bg-gradient-to-r ${theme === 'dark' ? 'from-neutral-900/20' : 'from-white/20'} via-transparent to-transparent hidden md:block`} />
              </motion.div>
            </div>
          </div>

          {/* ── Footnote ─────────────────────────────── */}
          <div
            className={`w-full flex items-center justify-between text-[10px] uppercase tracking-[0.4em] px-2 ${palette.muted}`}
          >
            <span>Pharma intelligence, orchestrated.</span>
            <span>Built for decision-makers.</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default MinimalHeroSection;
export { MinimalHeroSection };
