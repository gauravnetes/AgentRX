interface ContainerProps {
  children: React.ReactNode
  className?: string
}

export default function Container({ children, className = "" }: ContainerProps) {
  return <div className={`max-w-7xl mx-auto px-6 lg:px-12 ${className}`}>{children}</div>
}
