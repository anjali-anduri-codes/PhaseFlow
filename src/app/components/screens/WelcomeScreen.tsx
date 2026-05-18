import { PrimaryButton } from '../PrimaryButton';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-between h-full p-8 pt-16">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="var(--PhaseFlow-sage)"
              opacity="0.1"
              className="PhaseFlow-heartbeat-ring PhaseFlow-heartbeat-ring-1"
            />
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="var(--phase-follicular)"
              opacity="0.15"
              className="PhaseFlow-heartbeat-ring PhaseFlow-heartbeat-ring-2"
            />
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="var(--phase-ovulatory)"
              opacity="0.2"
              className="PhaseFlow-heartbeat-ring PhaseFlow-heartbeat-ring-3"
            />
            <circle
              cx="100"
              cy="100"
              r="20"
              fill="var(--PhaseFlow-terracotta)"
              opacity="0.3"
              className="PhaseFlow-heartbeat-ring PhaseFlow-heartbeat-ring-4"
            />
            <path
              d="M 100 20 Q 160 60 140 120 Q 120 180 100 180 Q 80 180 60 120 Q 40 60 100 20 Z"
              fill="var(--PhaseFlow-sage)"
              opacity="0.2"
            />
          </svg>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="text-center space-y-3">
          <p
            className="text-2xl tracking-[0.06em] text-[var(--PhaseFlow-sage)] font-extrabold leading-none"
            style={{ animation: 'PhaseFlow-brand-settle 1.05s ease-out both' }}
          >
            PhaseFlow
          </p>
          <h1 className="text-3xl" style={{ animation: 'PhaseFlow-fade-up 0.95s ease-out 0.5s both' }}>
            Train with your cycle, not against it.
          </h1>
          <p className="text-[var(--PhaseFlow-text-secondary)]" style={{ animation: 'PhaseFlow-fade-up 1.05s ease-out 0.72s both' }}>
            Personalised workouts for every phase of your menstrual cycle.
          </p>
        </div>

        <div style={{ animation: 'PhaseFlow-fade-up 0.95s ease-out 0.92s both' }}>
          <PrimaryButton onClick={onNext}>
          Get started
          </PrimaryButton>
        </div>

        <p className="text-xs text-center text-[var(--PhaseFlow-text-secondary)]" style={{ animation: 'PhaseFlow-fade-in 1.0s ease-out 1.1s both' }}>
          For all menstruators, regardless of gender identity.
        </p>
      </div>
    </div>
  );
}
