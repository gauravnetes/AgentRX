interface SectionHeaderProps {
  title: string
  subtitle?: string
}

export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-16">
      <div className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4">
        {title}
      </div>
      {subtitle && <h2 className="text-3xl font-semibold text-gray-100">{subtitle}</h2>}
    </div>
  )
}
