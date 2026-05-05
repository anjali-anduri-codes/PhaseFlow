import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { Check } from 'lucide-react';
import { saveGoogleFitConsent } from '../../services/googleHealth';

interface GoogleFitConsentScreenProps {
  onNext: () => void;
}

export function GoogleFitConsentScreen({ onNext }: GoogleFitConsentScreenProps) {
  const [accepted, setAccepted] = useState(false);

  const permissions = [
    'Read Google Fit activity metrics',
    'Read Health Connect menstrual/cycle records',
    'Use synced data for personalized workout recommendations'
  ];

  const handleContinue = () => {
    if (!accepted) {
      return;
    }
    saveGoogleFitConsent(true);
    onNext();
  };

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">Consent to use Google Fit data</h1>
        <p className="text-[var(--flowfit-text-secondary)]">
          Review and approve what FlowFit can access.
        </p>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {permissions.map((permission) => (
          <div
            key={permission}
            className="w-full p-4 rounded-xl flex items-start gap-3 bg-white border border-gray-200"
          >
            <div className="mt-0.5 text-[var(--flowfit-sage)]">
              <Check size={18} />
            </div>
            <p className="text-sm">{permission}</p>
          </div>
        ))}

        <button
          onClick={() => setAccepted(!accepted)}
          className={`w-full p-4 rounded-xl border-2 text-left ${
            accepted
              ? 'border-[var(--flowfit-sage)] bg-[var(--flowfit-off-white)]'
              : 'border-gray-200 bg-white'
          }`}
        >
          <h4 className="mb-1">I consent to data usage</h4>
          <p className="text-sm text-[var(--flowfit-text-secondary)]">
            You can revoke this permission anytime in Settings.
          </p>
        </button>
      </div>

      <PrimaryButton onClick={handleContinue} disabled={!accepted}>
        Allow and continue
      </PrimaryButton>
    </div>
  );
}
