interface ButtonProps {
  children: React.ReactNode
  variant?: "primary" | "secondary"
  className?: string
}

export default function Button({ children, variant = "primary", className = "" }: ButtonProps) {
  const styles = {
    primary: "bg-white text-black px-6 py-3 rounded-full font-medium",
    secondary: "border border-gray-600 px-6 py-3 rounded-full font-medium",
  }

  return <button className={`${styles[variant]} ${className}`}>{children}</button>
}
