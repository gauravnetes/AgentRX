interface MonoTextProps {
  children: React.ReactNode
  className?: string
}

export default function MonoText({ children, className = "" }: MonoTextProps) {
  return <code className={`font-mono text-sm tracking-tight ${className}`}>{children}</code>
}
