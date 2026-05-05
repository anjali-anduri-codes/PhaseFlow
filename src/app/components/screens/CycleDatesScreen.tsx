import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { InputField } from '../InputField';

interface CycleDatesScreenProps {
  onNext: (payload: { lastCycleStartDate: string; cycleLength: number }) => void;
  title?: string;
  infoText?: string;
  continueLabel?: string;
}

export function CycleDatesScreen({
  onNext,
  title = 'When did your last cycle begin?',
  infoText = 'Not sure? Enter your best estimate — FlowFit learns over time.',
  continueLabel = 'Continue'
}: CycleDatesScreenProps) {
  // Set default to 5 days ago
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 5);
  const defaultDateStr = defaultDate.toISOString().split('T')[0];

  const [date, setDate] = useState(defaultDateStr);
  const [cycleLength, setCycleLength] = useState(28);

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">{title}</h1>
      </div>

      <div className="flex-1 space-y-6">
        <div>
          <InputField
            type="date"
            label="Last cycle start date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="DD / MM / YYYY"
          />
        </div>

        <div>
          <label className="block mb-3">
            My cycle is typically {cycleLength} days
          </label>
          <div className="px-4">
            <input
              type="range"
              min="21"
              max="35"
              value={cycleLength}
              onChange={(e) => setCycleLength(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--flowfit-off-white)] rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--flowfit-sage) 0%, var(--flowfit-sage) ${
                  ((cycleLength - 21) / 14) * 100
                }%, var(--flowfit-off-white) ${((cycleLength - 21) / 14) * 100}%, var(--flowfit-off-white) 100%)`
              }}
            />
            <div className="flex justify-between mt-2 text-sm text-[var(--flowfit-text-secondary)] font-['JetBrains_Mono']">
              <span>21</span>
              <span>28</span>
              <span>35</span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[var(--flowfit-off-white)] rounded-xl">
          <p className="text-sm text-[var(--flowfit-text-secondary)]">
            {infoText}
          </p>
        </div>
      </div>

      <PrimaryButton onClick={() => onNext({ lastCycleStartDate: date, cycleLength })}>
        {continueLabel}
      </PrimaryButton>
    </div>
  );
}
