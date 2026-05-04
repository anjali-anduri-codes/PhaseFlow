interface GemmaBadgeProps {
  text?: string;
  variant?: 'default' | 'privacy';
}

export function GemmaBadge({ text = 'Powered by Gemma 4', variant = 'default' }: GemmaBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5C4B8A] text-white text-sm">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" fill="currentColor" opacity="0.2"/>
        <circle cx="8" cy="8" r="3" fill="currentColor"/>
      </svg>
      <span>{variant === 'privacy' ? 'Analysed on-device · Private' : text}</span>
    </div>
  );
}
