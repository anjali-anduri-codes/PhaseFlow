import { useEffect, useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { CloudOff, RefreshCw } from 'lucide-react';
import { syncGoogleFitCycleData } from '../../services/googleHealth';

interface GoogleFitSyncScreenProps {
  onContinue: (hasCycleData: boolean) => void;
}

export function GoogleFitSyncScreen({ onContinue }: GoogleFitSyncScreenProps) {
  const [isSyncing, setIsSyncing] = useState(true);
  const [hasCycleData, setHasCycleData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const runSync = async () => {
      setIsSyncing(true);
      setError(null);

      const result = await syncGoogleFitCycleData();
      if (!isMounted) {
        return;
      }

      setIsSyncing(false);
      if (!result.success) {
        setError(result.error || 'Unable to sync Google Fit data.');
        setHasCycleData(false);
        return;
      }

      setHasCycleData(result.hasCycleData);
    };

    runSync();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">Syncing Google Fit data</h1>
        <p className="text-[var(--flowfit-text-secondary)]">
          We checked your Google Fit and Health Connect records.
        </p>
      </div>

      <div className="flex-1 space-y-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-200 flex gap-3">
          <div className="p-2 rounded-lg bg-[var(--flowfit-off-white)] text-[var(--flowfit-sage)]">
            <RefreshCw size={20} />
          </div>
          <div>
            <h4>{isSyncing ? 'Sync in progress' : 'Activity data synced'}</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">
              {isSyncing
                ? 'Checking Google Fit and Health Connect records...'
                : 'Steps, training load, and workout history are connected.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!hasCycleData && (
          <div className="bg-white rounded-xl p-4 border border-amber-200 flex gap-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <CloudOff size={20} />
            </div>
            <div>
              <h4>No cycle records found</h4>
              <p className="text-sm text-[var(--flowfit-text-secondary)]">
                We will ask you once on your landing page to enter your cycle baseline manually.
              </p>
            </div>
          </div>
        )}
      </div>

      <PrimaryButton
        onClick={() => onContinue(hasCycleData)}
        disabled={isSyncing}
        variant={isSyncing ? 'loading' : 'default'}
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
