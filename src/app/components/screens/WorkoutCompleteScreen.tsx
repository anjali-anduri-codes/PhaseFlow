import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { Check, TrendingUp, Zap, Heart } from 'lucide-react';

interface WorkoutCompleteScreenProps {
  onFinish: () => void;
  onLogWorkout: () => void;
}

export function WorkoutCompleteScreen({ onFinish, onLogWorkout }: WorkoutCompleteScreenProps) {
  const [feeling, setFeeling] = useState<string | null>(null);

  const feelings = [
    { id: 'energized', label: 'Energized', icon: Zap },
    { id: 'accomplished', label: 'Accomplished', icon: TrendingUp },
    { id: 'tired', label: 'Tired but good', icon: Heart },
  ];

  return (
    <div className="flex flex-col h-full p-6 pt-16 bg-[var(--flowfit-off-white)]">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 mb-6 rounded-full bg-[var(--flowfit-sage)] flex items-center justify-center">
          <Check size={48} className="text-white" />
        </div>

        <h1 className="mb-2">Workout complete!</h1>
        <p className="text-[var(--flowfit-text-secondary)] mb-8">
          Great job listening to your body today.
        </p>

        <div className="w-full max-w-sm space-y-4 mb-8">
          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-[var(--flowfit-text-secondary)]">Duration</span>
            <span className="font-['JetBrains_Mono']">35:24</span>
          </div>

          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-[var(--flowfit-text-secondary)]">Exercises</span>
            <span className="font-['JetBrains_Mono']">4 completed</span>
          </div>

          <div className="flex justify-between p-4 bg-white rounded-xl">
            <span className="text-[var(--flowfit-text-secondary)]">Phase</span>
            <span>Luteal</span>
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
                      ? 'bg-[var(--flowfit-sage)] text-white'
                      : 'bg-white text-[var(--flowfit-text-primary)]'
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
          className="w-full text-[var(--flowfit-text-secondary)] py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
