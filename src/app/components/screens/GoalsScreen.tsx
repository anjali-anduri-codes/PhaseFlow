import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';

interface GoalsScreenProps {
  onNext: (selectedGoals: string[]) => void;
}

const goals = [
  'Build strength',
  'Manage energy',
  'Improve endurance',
  'Reduce cycle symptoms',
  'Stress relief',
  'Flexibility',
  'Weight management'
];

export function GoalsScreen({ onNext }: GoalsScreenProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">What do you want from PhaseFlow?</h1>
      </div>

      <div className="flex-1 mb-6">
        <div className="flex flex-wrap gap-3">
          {goals.map((goal) => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`px-4 py-3 rounded-full transition-all min-h-[44px] ${
                selectedGoals.includes(goal)
                  ? 'bg-[var(--flowfit-sage)] text-white'
                  : 'bg-white text-[var(--flowfit-text-primary)] border border-gray-200'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onNext([])}
          className="w-full px-4 py-2 text-[var(--flowfit-text-secondary)] hover:bg-[var(--flowfit-off-white)] rounded-lg transition-colors"
        >
          Skip for now
        </button>

        <PrimaryButton onClick={() => onNext(selectedGoals)} disabled={selectedGoals.length === 0}>
          Let's go
        </PrimaryButton>
      </div>
    </div>
  );
}
