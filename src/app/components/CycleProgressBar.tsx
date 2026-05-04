interface CycleProgressBarProps {
  currentDay: number;
  totalDays: number;
  phaseColor: string;
}

export function CycleProgressBar({ currentDay, totalDays, phaseColor }: CycleProgressBarProps) {
  const progress = (currentDay / totalDays) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 font-['JetBrains_Mono'] text-sm text-[var(--flowfit-text-secondary)]">
        <span>Day {currentDay}</span>
        <span>{totalDays} days</span>
      </div>
      <div className="w-full h-2 bg-[var(--flowfit-off-white)] rounded-full overflow-hidden">
        <div
          className="h-full transition-all rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: phaseColor
          }}
        />
      </div>
    </div>
  );
}
