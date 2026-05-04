type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | null;

interface PhaseCalendarDayProps {
  day: number;
  phase: Phase;
  isToday?: boolean;
  hasWorkout?: boolean;
}

const phaseColors = {
  menstrual: 'rgba(184, 76, 58, 0.15)',
  follicular: 'rgba(74, 124, 89, 0.15)',
  ovulatory: 'rgba(92, 75, 138, 0.15)',
  luteal: 'rgba(160, 114, 42, 0.15)'
};

export function PhaseCalendarDay({ day, phase, isToday, hasWorkout }: PhaseCalendarDayProps) {
  return (
    <div className="flex flex-col items-center justify-center aspect-square relative">
      <div
        className={`w-full h-full flex items-center justify-center rounded-full transition-all ${
          isToday ? 'ring-2 ring-[var(--flowfit-sage)] ring-offset-2' : ''
        }`}
        style={{
          backgroundColor: phase ? phaseColors[phase] : 'transparent'
        }}
      >
        <span className="text-sm font-['JetBrains_Mono']">{day}</span>
      </div>
      {hasWorkout && (
        <div className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-[var(--flowfit-sage)]" />
      )}
    </div>
  );
}
