import { useState } from 'react';
import { InputField } from '../InputField';
import { PrimaryButton } from '../PrimaryButton';
import { ArrowLeft } from 'lucide-react';

interface WorkoutLogInputScreenProps {
  onBack: () => void;
  onAnalyse: () => void;
}

const examplePhrases = [
  'Felt stronger than expected',
  'Finished all sets',
  'Had to take breaks',
  'Energy was low',
  'Great session'
];

export function WorkoutLogInputScreen({ onBack, onAnalyse }: WorkoutLogInputScreenProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [logText, setLogText] = useState('');

  return (
    <div className="flex flex-col h-full p-6 pt-12">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-[var(--flowfit-sage)]">
        <ArrowLeft size={20} />
        <span>Log</span>
      </button>

      <h1 className="mb-2">How did it go?</h1>
      <p className="text-[var(--flowfit-text-secondary)] mb-6">
        Write naturally — our AI will extract the details.
      </p>

      <div className="flex-1 space-y-4">
        <InputField
          placeholder="Workout name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
        />

        <div>
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-[var(--flowfit-off-white)] border-2 border-transparent focus:border-[var(--flowfit-sage)] transition-colors min-h-[120px] resize-none"
            placeholder="e.g. Felt stronger than expected today, finished all sets..."
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex gap-2">
            {examplePhrases.map((phrase) => (
              <button
                key={phrase}
                onClick={() => setLogText((prev) => (prev ? `${prev} ${phrase}` : phrase))}
                className="px-3 py-2 bg-white rounded-full text-sm text-[var(--flowfit-text-secondary)] border border-gray-200 whitespace-nowrap hover:border-[var(--flowfit-sage)] transition-colors"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      </div>

      <PrimaryButton
        onClick={onAnalyse}
        disabled={!logText.trim()}
        phaseColor="var(--phase-ovulatory)"
      >
        Analyse with Gemma 4
      </PrimaryButton>
    </div>
  );
}
