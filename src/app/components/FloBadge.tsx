interface FloBadgeProps {
  connected?: boolean;
}

export function FloBadge({ connected = true }: FloBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
      connected
        ? 'bg-[var(--PhaseFlow-sage)] text-white'
        : 'bg-gray-200 text-gray-600'
    }`}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2C8 2 12 4 12 8C12 10 10 12 8 14C6 12 4 10 4 8C4 4 8 2 8 2Z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>
      <span>Connected via Flo</span>
    </div>
  );
}
