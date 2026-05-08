interface SectionWrapperProps {
  children: React.ReactNode
  id?: string
  className?: string
}

export default function SectionWrapper({ children, id, className = "" }: SectionWrapperProps) {
  return (
    <section id={id} className={`py-24 lg:py-32 border-b border-gray-800 ${className}`}>
      {children}
    </section>
  )
}
