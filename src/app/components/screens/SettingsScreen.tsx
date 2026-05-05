import { useEffect, useState } from 'react';
import { ArrowLeft, Github } from 'lucide-react';
import { GemmaStatus, getGemmaStatus } from '../../services/gemma';
import { BottomNav } from '../BottomNav';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [gemmaOnDevice, setGemmaOnDevice] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [gemmaStatus, setGemmaStatus] = useState<GemmaStatus | null>(null);
  const [isGemmaStatusLoading, setIsGemmaStatusLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadGemmaStatus = async () => {
      const status = await getGemmaStatus();
      if (isActive) {
        setGemmaStatus(status);
        setIsGemmaStatusLoading(false);
      }
    };

    void loadGemmaStatus();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-8">
          <div className="pt-8">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 mb-4 text-[var(--PhaseFlow-sage)]">
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1>Settings</h1>
          </div>

          <div>
            <h3 className="mb-4">Cycle data source</h3>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="mb-1">Manual entry</h4>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[var(--PhaseFlow-sage)] text-white">
                    Active
                  </span>
                </div>
                <button className="text-[var(--PhaseFlow-sage)] text-sm">Edit</button>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <h4 className="mb-1">Google Fit</h4>
                  <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">Not connected</p>
                </div>
                <button className="text-[var(--PhaseFlow-sage)] text-sm">Connect</button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4">AI & Privacy</h3>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div className="flex-1">
                    <h4 className="mb-1">Gemma cloud status</h4>
                    <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">
                      {isGemmaStatusLoading
                        ? 'Checking backend connection...'
                        : gemmaStatus?.message || 'Status unavailable'}
                    </p>
                    {!isGemmaStatusLoading && gemmaStatus?.model && (
                      <p className="text-xs text-[var(--PhaseFlow-text-secondary)] mt-1">
                        Model: {gemmaStatus.model}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                      isGemmaStatusLoading
                        ? 'bg-gray-100 text-gray-600'
                        : gemmaStatus?.ok
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isGemmaStatusLoading ? 'Checking' : gemmaStatus?.ok ? 'Connected' : 'Needs setup'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="mb-1">Run Gemma on-device (recommended)</h4>
                    <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">
                      Your data never leaves your phone
                    </p>
                  </div>
                  <button
                    onClick={() => setGemmaOnDevice(!gemmaOnDevice)}
                    className={`ml-4 w-12 h-7 rounded-full transition-colors relative ${
                      gemmaOnDevice ? 'bg-[var(--PhaseFlow-sage)]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        gemmaOnDevice ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="mb-1">Cross-device sync (Supabase)</h4>
                    <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">
                      Sync your data across devices
                    </p>
                  </div>
                  <button
                    onClick={() => setCloudSync(!cloudSync)}
                    className={`ml-4 w-12 h-7 rounded-full transition-colors relative ${
                      cloudSync ? 'bg-[var(--PhaseFlow-sage)]' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        cloudSync ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4">About</h3>
            <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--PhaseFlow-text-secondary)]">App version</span>
                <span className="font-['JetBrains_Mono']">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--PhaseFlow-text-secondary)]">GitHub</span>
                <a href="#" className="flex items-center gap-2 text-[var(--PhaseFlow-sage)]">
                  <Github size={18} />
                  <span>View source</span>
                </a>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-[var(--PhaseFlow-text-secondary)]">
                  Made by <span className="text-[var(--PhaseFlow-text-primary)]">Infradian Labs</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav activeScreen="settings" onNavigate={onNavigate} />
    </div>
  );
}
