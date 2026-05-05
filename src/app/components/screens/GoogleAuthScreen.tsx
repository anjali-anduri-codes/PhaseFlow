import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { ShieldCheck, Smartphone } from 'lucide-react';
import { authenticateWithGoogle } from '../../services/googleHealth';

interface GoogleAuthScreenProps {
  onNext: () => void;
}

export function GoogleAuthScreen({ onNext }: GoogleAuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    const result = await authenticateWithGoogle();
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Google sign-in failed. Please try again.');
      return;
    }

    onNext();
  };

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">Connect your Google account</h1>
        <p className="text-[var(--flowfit-text-secondary)]">
          Sign in to use Google Fit and Health Connect data in FlowFit.
        </p>
      </div>

      <div className="flex-1 space-y-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 flex gap-3">
          <div className="p-2 rounded-lg bg-[var(--flowfit-off-white)] text-[var(--flowfit-sage)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4>Secure sign-in</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">
              OAuth sign-in only. We never store your Google password.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200 flex gap-3">
          <div className="p-2 rounded-lg bg-[var(--flowfit-off-white)] text-[var(--flowfit-sage)]">
            <Smartphone size={20} />
          </div>
          <div>
            <h4>Google Fit access</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">
              We only request activity and cycle-tracking scopes needed for recommendations.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      <PrimaryButton onClick={handleGoogleAuth} variant={isLoading ? 'loading' : 'default'}>
        Continue with Google
      </PrimaryButton>
    </div>
  );
}
