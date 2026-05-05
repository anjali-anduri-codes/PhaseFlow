type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | null;

interface PhaseCalendarDayProps {
  day: number;
  phase: Phase;
  isToday?: boolean;
  hasWorkout?: boolean;
}

const phaseColors = {
  menstrual: {
    background: 'rgba(214, 90, 74, 0.24)',
    border: 'var(--phase-menstrual)'
  },
  follicular: {
    background: 'rgba(92, 154, 108, 0.24)',
    border: 'var(--phase-follicular)'
  },
  ovulatory: {
    background: 'rgba(122, 103, 184, 0.24)',
    border: 'var(--phase-ovulatory)'
  },
  luteal: {
    background: 'rgba(197, 138, 58, 0.24)',
    border: 'var(--phase-luteal)'
  }
};

export function PhaseCalendarDay({ day, phase, isToday, hasWorkout }: PhaseCalendarDayProps) {
  return (
    <div className="flex flex-col items-center justify-center aspect-square relative">
      <div
        className={`w-full h-full flex items-center justify-center rounded-full transition-all ${
          isToday ? 'ring-2 ring-[var(--flowfit-sage)] ring-offset-2' : ''
        }`}
        style={{
          backgroundColor: phase ? phaseColors[phase].background : 'transparent',
          border: phase ? `1px solid ${phaseColors[phase].border}` : '1px solid transparent'
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
