import { PrimaryButton } from '../PrimaryButton';
import { GhostButton } from '../GhostButton';
import { GemmaBadge } from '../GemmaBadge';
import { ArrowLeft } from 'lucide-react';
import { WorkoutLogAnalysis } from '../../services/gemma';

interface WorkoutLogResultScreenProps {
  onBack: () => void;
  onSave: () => void;
  logText?: string;
  analysis?: WorkoutLogAnalysis | null;
}

export function WorkoutLogResultScreen({
  onBack,
  onSave,
  logText,
  analysis
}: WorkoutLogResultScreenProps) {
  const displayAnalysis: WorkoutLogAnalysis | null = analysis || null;

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
        <div className="px-4 py-3 rounded-xl bg-gray-100 text-[var(--flowfit-text-secondary)]">
          <p>{logText || 'No workout note provided.'}</p>
        </div>

        <div className="p-4 bg-[var(--flowfit-off-white)] rounded-xl border-2 border-[var(--phase-ovulatory)]">
          <div className="flex items-center justify-between mb-4">
            <h4>Gemma read this as:</h4>
            <GemmaBadge variant="privacy" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-[var(--flowfit-text-secondary)]">Energy</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-4 rounded-sm ${
                      displayAnalysis && i < displayAnalysis.energyRating
                        ? 'bg-[var(--phase-ovulatory)]'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-[var(--flowfit-text-secondary)]">Completion</span>
              <span className="font-['JetBrains_Mono']">
                {displayAnalysis ? `${displayAnalysis.completionPercent}%` : '--'}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[var(--flowfit-text-secondary)]">Mood</span>
              <span>{displayAnalysis ? displayAnalysis.mood : 'Unavailable'}</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg">
            <h4 className="text-sm mb-1">What FlowFit will adjust</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">
              {displayAnalysis
                ? displayAnalysis.adjustment
                : 'Gemma analysis was unavailable. Please retry from the log screen.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <PrimaryButton onClick={onSave}>Save log</PrimaryButton>
        <GhostButton onClick={onBack} className="w-full">
          Edit note
        </GhostButton>
      </div>
    </div>
  );
}
