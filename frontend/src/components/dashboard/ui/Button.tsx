interface ButtonProps {
  children: React.ReactNode
  size?: "sm" | "md"
  className?: string
}

export default function Button({ children, size = "md", className = "" }: ButtonProps) {
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
  }

  return (
    <button className={`border border-gray-700 bg-gray-900 rounded ${sizes[size]} ${className}`}>
      {children}
    </button>
  )
}
