import { CycleProgressBar } from './CycleProgressBar';

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

interface PhaseCardProps {
  phase: Phase;
  day: number;
  totalDays: number;
  description: string;
  energyLevel?: number;
}

const phaseConfig = {
  menstrual: {
    color: 'var(--phase-menstrual)',
    label: 'Menstrual phase',
    bgColor: 'rgba(184, 76, 58, 0.08)'
  },
  follicular: {
    color: 'var(--phase-follicular)',
    label: 'Follicular phase',
    bgColor: 'rgba(74, 124, 89, 0.08)'
  },
  ovulatory: {
    color: 'var(--phase-ovulatory)',
    label: 'Ovulatory phase',
    bgColor: 'rgba(92, 75, 138, 0.08)'
  },
  luteal: {
    color: 'var(--phase-luteal)',
    label: 'Luteal phase',
    bgColor: 'rgba(160, 114, 42, 0.08)'
  }
};

export function PhaseCard({ phase, day, totalDays, description, energyLevel = 3 }: PhaseCardProps) {
  const config = phaseConfig[phase];

  return (
    <div
      className="p-6 rounded-2xl"
      style={{ backgroundColor: config.bgColor }}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 style={{ color: config.color }}>{config.label}</h3>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: i < energyLevel ? config.color : 'rgba(0,0,0,0.1)'
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-[var(--flowfit-text-secondary)] mb-4">{description}</p>

      <CycleProgressBar
        currentDay={day}
        totalDays={totalDays}
        phaseColor={config.color}
      />
    </div>
  );
}
