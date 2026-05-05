interface EnergyCheckInProps {
  selectedLevel?: number;
  onSelect?: (level: number) => void;
}

const energyLevels = [
  { level: 1, label: 'Drained' },
  { level: 2, label: 'Low' },
  { level: 3, label: 'Okay' },
  { level: 4, label: 'Good' },
  { level: 5, label: 'Strong' }
];

export function EnergyCheckIn({ selectedLevel, onSelect }: EnergyCheckInProps) {
  return (
    <div className="flex gap-2 w-full">
      {energyLevels.map(({ level, label }) => (
        <button
          key={level}
          onClick={() => onSelect?.(level)}
          className={`flex-1 flex flex-col items-center justify-center gap-2 py-3 px-2 rounded-xl min-h-[44px] transition-all ${
            selectedLevel === level
              ? 'bg-[var(--PhaseFlow-sage)] text-white'
              : 'bg-[var(--PhaseFlow-off-white)] text-[var(--PhaseFlow-text-primary)] hover:bg-gray-200'
          }`}
        >
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-3 rounded-sm ${
                  i < level
                    ? selectedLevel === level
                      ? 'bg-white'
                      : 'bg-[var(--PhaseFlow-sage)]'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs">{label}</span>
        </button>
      ))}
    </div>
  );
}
