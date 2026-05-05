import { useState } from 'react';
import { InputField } from '../InputField';
import { PrimaryButton } from '../PrimaryButton';
import { ArrowLeft } from 'lucide-react';

interface WorkoutLogInputScreenProps {
  onBack: () => void;
  onAnalyse: (payload: { workoutName: string; logText: string }) => Promise<void> | void;
  analysisError?: string | null;
}

export function WorkoutLogInputScreen({
  onBack,
  onAnalyse,
  analysisError = null
}: WorkoutLogInputScreenProps) {
  const [workoutName, setWorkoutName] = useState('');
  const [logText, setLogText] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);

  const handleAnalyse = async () => {
    if (!logText.trim() || isAnalysing) {
      return;
    }

    setIsAnalysing(true);
    try {
      await onAnalyse({ workoutName, logText });
    } finally {
      setIsAnalysing(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-6 pt-12">
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-[var(--PhaseFlow-sage)]">
        <ArrowLeft size={20} />
        <span>Log</span>
      </button>

      <h1 className="mb-2">How did it go?</h1>
      <p className="text-[var(--PhaseFlow-text-secondary)] mb-6">
        Write naturally — our AI will extract the details.
      </p>

      <div className="flex-1 space-y-4">
        {analysisError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{analysisError}</p>
          </div>
        )}

        <InputField
          placeholder="Workout name"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
        />

        <div>
          <textarea
            className="w-full px-4 py-3 rounded-xl bg-[var(--PhaseFlow-off-white)] border-2 border-gray-200 focus:border-[var(--PhaseFlow-sage)] transition-colors min-h-[120px] resize-none"
            placeholder="e.g. Felt stronger than expected today, finished all sets..."
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
          />
        </div>

      </div>

      <PrimaryButton
        onClick={handleAnalyse}
        disabled={!logText.trim()}
        variant={isAnalysing ? 'loading' : 'default'}
        phaseColor="var(--phase-ovulatory)"
      >
        Analyse with Gemma 4
      </PrimaryButton>
    </div>
  );
}
