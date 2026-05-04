type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

interface PhaseBadgeProps {
  phase: Phase;
}

const phaseConfig = {
  menstrual: { color: 'var(--phase-menstrual)', label: 'Menstrual' },
  follicular: { color: 'var(--phase-follicular)', label: 'Follicular' },
  ovulatory: { color: 'var(--phase-ovulatory)', label: 'Ovulatory' },
  luteal: { color: 'var(--phase-luteal)', label: 'Luteal' }
};

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  const config = phaseConfig[phase];

  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-sm text-white"
      style={{ backgroundColor: config.color }}
    >
      {config.label}
    </span>
  );
}
