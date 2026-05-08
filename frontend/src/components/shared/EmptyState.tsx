import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center">
      <div className="p-3 rounded-xl bg-[#1A1D24] border border-[#252830]">
        <Icon size={22} className="text-[#4A5060]" />
      </div>
      <p className="text-[13px] font-medium text-[#8A8F9A]">{title}</p>
      <p className="text-[11px] text-[#4A5060] max-w-[200px] leading-relaxed">{description}</p>
    </div>
  );
}
