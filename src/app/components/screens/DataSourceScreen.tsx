import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';
import { PencilLine, Activity } from 'lucide-react';

interface DataSourceScreenProps {
  onNext: (source: DataSource) => void;
}

type DataSource = 'manual' | 'google' | null;

export function DataSourceScreen({ onNext }: DataSourceScreenProps) {
  const [selected, setSelected] = useState<DataSource>('manual');

  const sources = [
    {
      id: 'manual' as DataSource,
      icon: PencilLine,
      label: 'Enter manually',
      description: 'Track your cycle yourself'
    },
    {
      id: 'google' as DataSource,
      icon: Activity,
      label: 'Google Fit',
      description: 'Connect Health Connect or Google Fit data'
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
                  ? 'border-[var(--PhaseFlow-sage)] bg-[var(--PhaseFlow-off-white)]'
                  : 'border-transparent bg-white'
              }`}
            >
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor:
                    selected === source.id ? 'var(--PhaseFlow-sage)' : 'var(--PhaseFlow-off-white)',
                  color: selected === source.id ? 'white' : 'var(--PhaseFlow-text-primary)'
                }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 text-left">
                <h4>{source.label}</h4>
                <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">
                  {source.description}
                </p>
              </div>
              {selected === source.id && (
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="PhaseFlow-selection-circle"
                >
                  <circle cx="12" cy="12" r="10" fill="var(--PhaseFlow-sage)" />
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

      {selected === 'google' && (
        <p className="text-xs text-center text-[var(--PhaseFlow-text-secondary)] mb-4">
          Google Fit sync uses secure account permissions only.
        </p>
      )}

      <PrimaryButton onClick={() => selected && onNext(selected)} disabled={!selected}>
        Continue
      </PrimaryButton>
    </div>
  );
}
