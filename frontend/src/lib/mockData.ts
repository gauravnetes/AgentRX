// Mock data for skeleton phase
// Real data will be injected in later phases

export const AGENTS = [
  { id: 1, name: "Clinical Agent", status: "active" as const },
  { id: 2, name: "Patent Agent", status: "active" as const },
  { id: 3, name: "Market Agent", status: "idle" as const },
  { id: 4, name: "Web Intelligence", status: "active" as const },
]

export const PIPELINE_STAGES = [
  "Biology",
  "Side Effects",
  "Patent Clearance",
  "Market Validation",
]

export const METRICS = [
  { id: 1, label: "Active Agents", value: "0" },
  { id: 2, label: "Analyses Today", value: "0" },
  { id: 3, label: "Patents Reviewed", value: "0" },
  { id: 4, label: "Opportunities", value: "0" },
]

export const PAIN_POINTS = [
  {
    id: 1,
    title: "Fragmented Data",
    description: "Research scattered across disconnected systems",
  },
  {
    id: 2,
    title: "Patent Conflicts",
    description: "Overlapping IP claims delay development",
  },
  {
    id: 3,
    title: "Slow Clinical Analysis",
    description: "Manual review processes take months",
  },
  {
    id: 4,
    title: "Missed Opportunities",
    description: "Market signals lost in data noise",
  },
]

export const OPPORTUNITIES = [
  {
    id: 1,
    title: "Emerging Therapeutics",
    value: "$2.4B",
    description: "Oncology adjuvant therapies market opportunity",
  },
  {
    id: 2,
    title: "Patent Cliff Analysis",
    value: "12 Assets",
    description: "High-value patents expiring in next 18 months",
  },
  {
    id: 3,
    title: "Competitive Landscape",
    value: "7 New Entrants",
    description: "Biotech startups entering target space",
  },
]

export const ACTIVITY_LOGS = [
  { time: "00:00:00", message: "System initialized" },
  { time: "00:00:00", message: "Agents loaded" },
  { time: "00:00:00", message: "Ready for analysis" },
]
