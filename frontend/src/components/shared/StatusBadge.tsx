export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    done:     'bg-[#0F2018] text-[#3A9E6F] border-[#1A4030]',
    running:  'bg-[#2A2010] text-[#D4920A] border-[#5C4010]',
    queued:   'bg-[#161A20] text-[#4A5060] border-[#252830]',
    blocked:  'bg-[#200F0F] text-[#C04040] border-[#4A1A1A]',
    scanning: 'bg-[#2A2010] text-[#D4920A] border-[#5C4010]',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border font-mono ${styles[status] ?? styles.queued}`}>
      {status}
    </span>
  )
}
