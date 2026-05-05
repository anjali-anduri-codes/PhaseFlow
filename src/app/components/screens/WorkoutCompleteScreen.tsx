import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { Check, TrendingUp, Zap, Heart } from 'lucide-react';

interface WorkoutCompleteScreenProps {
  onFinish: () => void;
  onLogWorkout: () => void;
  summary?: {
    elapsedSeconds: number;
    completedExercises: number;
    totalExercises: number;
    phase: string;
  } | null;
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPhase(phase: string): string {
  if (!phase || phase.toLowerCase() === 'unknown') {
    return 'Unknown';
  }

  return `${phase[0].toUpperCase()}${phase.slice(1).toLowerCase()}`;
}

export function WorkoutCompleteScreen({ onFinish, onLogWorkout, summary }: WorkoutCompleteScreenProps) {
  const [feeling, setFeeling] = useState<string | null>(null);

  const feelings = [
    { id: 'energized', label: 'Energized', icon: Zap },
    { id: 'accomplished', label: 'Accomplished', icon: TrendingUp },
    { id: 'tired', label: 'Tired but good', icon: Heart },
  ];

  return (
    <div className="flex flex-col h-full p-6 pt-16 bg-[var(--PhaseFlow-off-white)]">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-[var(--PhaseFlow-sage)] flex items-center justify-center">
          <Check size={48} className="text-white" />
        </div>

        <h1 className="mb-2">Workout complete!</h1>
        <p className="text-[var(--PhaseFlow-text-secondary)] mb-8">
          Great job listening to your body today.
        </p>

        <div className="w-full max-w-sm space-y-4 mb-8">
          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-[var(--PhaseFlow-text-secondary)]">Duration</span>
            <span className="font-['JetBrains_Mono']">{formatDuration(summary?.elapsedSeconds || 0)}</span>
          </div>

          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-[var(--PhaseFlow-text-secondary)]">Exercises</span>
            <span className="font-['JetBrains_Mono']">
              {summary ? `${summary.completedExercises}/${summary.totalExercises} completed` : '0 completed'}
            </span>
          </div>

          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-[var(--PhaseFlow-text-secondary)]">Phase</span>
            <span>{formatPhase(summary?.phase || 'Unknown')}</span>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <h4 className="mb-3 text-left">How are you feeling?</h4>
          <div className="flex gap-2">
            {feelings.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setFeeling(item.id)}
                  className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    feeling === item.id
                      ? 'bg-[var(--PhaseFlow-sage)] text-white'
                      : 'bg-white text-[var(--PhaseFlow-text-primary)]'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <PrimaryButton onClick={onLogWorkout}>
          Add notes to workout log
        </PrimaryButton>
        <button
          onClick={onFinish}
          className="w-full text-[var(--PhaseFlow-text-secondary)] py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
