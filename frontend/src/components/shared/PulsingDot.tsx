type PulsingDotProps = { color: 'amber' | 'green' | 'red' | 'blue'; size?: 'xs' | 'sm' | 'md' }

export function PulsingDot({ color, size = 'sm' }: PulsingDotProps) {
  const colors = {
    amber: '#D4920A', green: '#3A9E6F', red: '#C04040', blue: '#4A90C4'
  }
  const sizes = { xs: 5, sm: 7, md: 9 }
  const px = sizes[size]
  
  return (
    <span className="relative inline-flex">
      <span 
        className="animate-ping absolute inline-flex rounded-full opacity-60"
        style={{ background: colors[color], width: px, height: px }}
      />
      <span 
        className="relative inline-flex rounded-full"
        style={{ background: colors[color], width: px, height: px }}
      />
    </span>
  )
}
