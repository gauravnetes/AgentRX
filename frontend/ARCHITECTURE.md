# AgentRX Application Architecture

## Overview

This document describes the complete skeleton architecture for the AgentRX platform, consisting of:

1. **Landing Page** (`/`) - Cinematic storytelling marketing site
2. **Dashboard** (`/dashboard`) - Mission control product interface

Both are built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4.

---

## File Structure

```
src/
├── app/
│   ├── globals.css                    # Global Tailwind styles + theme
│   ├── layout.tsx                     # Root layout (fonts, metadata)
│   ├── page.tsx                       # Landing page ("/")
│   ├── dashboard/
│   │   ├── layout.tsx                  # Dashboard shell (sidebar + panels)
│   │   └── page.tsx                    # Dashboard workspace
│
├── components/
│   ├── landing/                       # Marketing page components
│   │   ├── sections/                   # 7 full-width sections
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ProblemSection.tsx
│   │   │   ├── OrchestrationSection.tsx
│   │   │   ├── PipelineSection.tsx
│   │   │   ├── IntelligenceSection.tsx
│   │   │   ├── ReportSection.tsx
│   │   │   └── FinalCTASection.tsx
│   │   ├── shared/                     # Reusable layout components
│   │   │   ├── SectionWrapper.tsx
│   │   │   ├── Container.tsx
│   │   │   └── SectionHeader.tsx
│   │   └── ui/                         # Primitive UI elements
│   │       ├── Button.tsx
│   │       └── MonoText.tsx
│   │
│   └── dashboard/                      # Product dashboard components
│       ├── layout/                     # Dashboard shell panels
│       │   ├── Sidebar.tsx
│       │   ├── Topbar.tsx
│       │   └── InsightsPanel.tsx
│       ├── components/                 # Dashboard widgets
│       │   ├── OrchestrationCanvas.tsx
│       │   ├── AgentCard.tsx
│       │   ├── PipelineFlow.tsx
│       │   ├── PipelineStep.tsx
│       │   ├── MetricsGrid.tsx
│       │   ├── GraphContainer.tsx
│       │   ├── LogsPanel.tsx
│       │   ├── ActivityFeed.tsx
│       │   └── OpportunityCard.tsx
│       └── ui/
│           └── Button.tsx               # Dashboard-specific button
│
└── lib/
    ├── animations.ts                    # Framer Motion variants (stubs)
    └── mockData.ts                      # Placeholder data structures
```

---

## Routes

### `/` — Landing Page

**Path:** `src/app/page.tsx`

**Structure:** Composes 7 full-width sections in order:

1. `HeroSection` — Full-screen intro with headline, CTAs, mock dashboard preview
2. `ProblemSection` — Two-column (text + comparison) explaining pharma bottlenecks
3. `OrchestrationSection` — Node graph visualization with 4 AI agents
4. `PipelineSection` — Horizontal 4-stage mechanism-to-market pipeline
5. `IntelligenceSection` — Dashboard grid with live logs, metrics, chart, alerts
6. `ReportSection` — Report preview + opportunity cards + risk meter
7. `FinalCTASection` — Minimal closing with large CTA button

**Styling (Skeleton Phase):**
- Pure dark theme: `bg-black`, `border-gray-800`, `text-gray-400`
- No colors, gradients, or effects
- Gray-scale placeholder boxes only
- Tailwind utility classes exclusively

### `/dashboard` — Mission Control

**Path:** `src/app/dashboard/page.tsx` wrapped by `src/app/dashboard/layout.tsx`

**Layout Shell (3-panel fixed structure):**

```
┌──────────────────────────────────────────────────────────────────┐
│ Sidebar (256px) │ Topbar (64px)                                   │
│ ┌─────────────┐ │ ┌──────────────────────────────────────────────┐│
│ │   AGENTRX   │ │ │ [Search]  [Molecule]  [Btn][Avatar]         ││
│ │             │ │ └──────────────────────────────────────────────┘│
│ │ Nav items   │ │                                               │
│ │ • Agents    │ │                                               │
│ │ • Sessions  │ │   Main Workspace (flex-grow, scrollable)     │
│ │ • History   │ │   ┌─────────────────────────────────────────┐ │
│ │ • Settings  │ │   │                                     │   │ │
│ │             │ │   │   Page content injected here         │   │ │
│ │ [Profile]   │ │   │                                     │   │ │
│ └─────────────┘ │   └─────────────────────────────────────────┘ │
└─────────────────┼───────────────────────────────────────────────┘
                  │
                  │   Right Insights Panel (320px fixed)
                  │   ┌───────────────────────────────────────┐
                  │   │ Opportunities  │  Risk  │  Market    │
                  │   │ Card           │ Meter │  Size      │
                  │   │────────────────┼───────┼────────────│
                  │   │ [More widgets...]                    │
                  │   └───────────────────────────────────────┘
                  └───────────────────────────────────────────┘
```

**Dashboard Page Composition:**

**Row 1** (2/3 + 1/3 split):
- Left: `OrchestrationCanvas` — SVG placeholder with 4 agent nodes
- Right: `MetricsGrid` — 2x2 metric cards

**Row 2** (1/2 + 1/2 split):
- Left: `PipelineFlow` — 4-stage horizontal pipeline
- Right: `ActivityFeed` — Timestamped log entries

**Row 3** (full-width stack):
- Agent cards (stacked)
- System logs with controls

---

## Component Details

### Landing Shared Components

#### `SectionWrapper`
Simple section wrapper with standardized padding and bottom border.

```tsx
<section className="py-24 lg:py-32 border-b border-gray-800">...</section>
```

#### `Container`
Fixed-width container with responsive horizontal padding.

```tsx
<div className="max-w-7xl mx-auto px-6 lg:px-12">...</div>
```

#### `SectionHeader`
Consistent section titles with uppercase label and optional subtitle.

```tsx
<div>
  <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
    {title}
  </div>
  {subtitle && <h2 className="text-3xl font-semibold">{subtitle}</h2>}
</div>
```

### Dashboard Layout Components

#### `Sidebar`
Fixed-width navigation sidebar with:
- Logo (AGENTRX brand)
- 4 navigation items (Agents, Sessions, History, Settings)
- User profile placeholder at bottom

**Styling:** `w-64`, `border-r`, `p-4`, vertical flex layout

#### `Topbar`
Fixed-height top bar with:
- Search input (left)
- Molecule SMILES input (center, hidden on mobile)
- Action buttons (New Analysis, Export) + avatar (right)

**Styling:** `h-16`, `border-b`, `flex`, `items-center`

#### `InsightsPanel`
Scrollable right sidebar with:
- Opportunity cards (stack of 3)
- Patent risk meter (progress bar)
- Market size metric
- Export action buttons

**Styling:** `w-80`, `border-l`, `overflow-auto`

---

## Styling Conventions (Skeleton Phase)

### Allowed Utilities
- Layout: `flex`, `grid`, `container`, `max-w-*`, `mx-auto`
- Spacing: `p-*`, `m-*`, `gap-*`, `py-*`, `px-*`
- Borders: `border`, `border-gray-800`, `border-gray-700`
- Backgrounds: `bg-black`, `bg-gray-900`, `bg-gray-950`
- Typography: `text-sm` - `text-2xl`, `text-gray-400/500/600`
- Misc: `rounded`, `overflow-auto`, `overflow-hidden`, `relative`, `absolute`

### Prohibited (for now)
- ❌ Gradients (except minimal gray fades)
- ❌ Icons (use `[ICON]` text or emoji placeholders)
- ❌ Animations (no Framer Motion yet)
- ❌ Shadows/glow effects
- ❌ Backdrop blur or glassmorphism
- ❌ Charts (use simple bar blocks)
- ❌ Custom CSS variables (beside theme)
- ❌ SVGs with complex paths (simple shapes only)

---

## Data Flow

### Mock Data (`lib/mockData.ts`)

Exports static arrays used across components:

```typescript
AGENTS: Array<{ id, name, status }>
PIPELINE_STAGES: string[]
METRICS: Array<{ id, label, value }>
PAIN_POINTS: Array<{ id, title, description }>
OPPORTUNITIES: Array<{ id, title, value, description }>
ACTIVITY_LOGS: Array<{ time, message }>
```

**Note:** All values are static strings/numbers. Real-time state will be added in Phase 3.

---

## Scaffolding Completed ✅

**Total Files Created:** 42

**Routing:**
- `src/app/page.tsx` → "/" ✅
- `src/app/dashboard/page.tsx` → "/dashboard" ✅

**Components:**
- Landing sections: 7 ✅
- Landing shared: 3 ✅
- Landing UI: 2 ✅
- Dashboard layout: 3 ✅
- Dashboard components: 9 ✅
- Dashboard UI: 1 ✅

**Utilities:**
- `lib/animations.ts` (stub)
- `lib/mockData.ts`

**Index exports:** 5 barrel files for clean imports

**Build Status:** ✅ Success (TypeScript passes, 2 routes generated)

---

## Next Phase Roadmap

### Phase 2: Visual Foundation (Not Started)
- Apply dark theme (graphite backgrounds, subtle borders)
- Introduce accent color (subtle blue/purple)
- Add icon library (Lucide)
- Typography hierarchy (Geist font sizes, weights)
- Basic hover states
- Section dividers and spacing polish

### Phase 3: Animation & Interactivity (Not Started)
- Framer Motion scroll-triggered animations
- Parallax effects
- Node graph interactivity
- Pipeline hover expansions
- Live log streaming effect
- Count-up number animations

### Phase 4: Production Integration (Not Started)
- API data connections
- Real state management
- Authentication middleware
- Error boundaries
- Performance optimization

---

## Design Principles

**Skeleton Phase Focus:**
- Architecture scalability
- Clear component boundaries
- Wireframe-level layout only
- Separation: landing (marketing) vs dashboard (product)

**Future Visual Identity:**
- Apple-level storytelling
- Linear/Vercel minimalism
- Enterprise biotech aesthetic
- Calm, immersive, futuristic

---

## Quick Start

To run the development server:
```bash
cd frontend
npm run dev
```

Visit:
- Landing: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

---

**Status:** Skeleton complete. Ready for Phase 2 visual design implementation.
