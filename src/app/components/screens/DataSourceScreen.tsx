import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { PencilLine, Heart, Activity, Leaf } from 'lucide-react';

interface DataSourceScreenProps {
  onNext: () => void;
}

type DataSource = 'manual' | 'apple' | 'google' | 'flo' | null;

export function DataSourceScreen({ onNext }: DataSourceScreenProps) {
  const [selected, setSelected] = useState<DataSource>('flo');

  const sources = [
    {
      id: 'manual' as DataSource,
      icon: PencilLine,
      label: 'Enter manually',
      description: 'Track your cycle yourself'
    },
    {
      id: 'apple' as DataSource,
      icon: Heart,
      label: 'Apple Health',
      description: 'Sync from Health app'
    },
    {
      id: 'google' as DataSource,
      icon: Activity,
      label: 'Google Fit',
      description: 'Connect fitness data'
    },
    {
      id: 'flo' as DataSource,
      icon: Leaf,
      label: 'Flo app',
      description: 'Import from Flo'
    }
  ];

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">How would you like to sync your cycle?</h1>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {sources.map((source) => {
          const Icon = source.icon;
          return (
            <button
              key={source.id}
              onClick={() => setSelected(source.id)}
              className={`w-full p-4 rounded-xl flex items-start gap-4 transition-all border-2 min-h-[72px] ${
                selected === source.id
                  ? 'border-[var(--flowfit-sage)] bg-[var(--flowfit-off-white)]'
                  : 'border-transparent bg-white'
              }`}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor:
                    selected === source.id ? 'var(--flowfit-sage)' : 'var(--flowfit-off-white)',
                  color: selected === source.id ? 'white' : 'var(--flowfit-text-primary)'
                }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 text-left">
                <h4>{source.label}</h4>
                <p className="text-sm text-[var(--flowfit-text-secondary)]">
                  {source.description}
                </p>
              </div>
              {selected === source.id && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="var(--flowfit-sage)" />
                  <path
                    d="M8 12l2 2 4-4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {selected === 'flo' && (
        <p className="text-xs text-center text-[var(--flowfit-text-secondary)] mb-4">
          Flo connects via secure OAuth. No password stored.
        </p>
      )}

      <PrimaryButton onClick={onNext} disabled={!selected}>
        Continue
      </PrimaryButton>
    </div>
  );
}
