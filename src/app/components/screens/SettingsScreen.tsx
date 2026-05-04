import { useState } from 'react';
import { FloBadge } from '../FloBadge';
import { Home, Calendar, Dumbbell, MessageCircle, ArrowLeft, Github } from 'lucide-react';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [gemmaOnDevice, setGemmaOnDevice] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-8">
          <div className="pt-8">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-2 mb-4 text-[var(--flowfit-sage)]">
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
                  <h4 className="mb-1">Flo app</h4>
                  <FloBadge connected />
                </div>
                <button className="text-[var(--phase-menstrual)] text-sm">Disconnect</button>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 opacity-50">
                <h4 className="mb-1">Apple Health</h4>
                <p className="text-sm text-[var(--flowfit-text-secondary)]">Not connected</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 opacity-50">
                <h4 className="mb-1">Google Fit</h4>
                <p className="text-sm text-[var(--flowfit-text-secondary)]">Not connected</p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-gray-200 opacity-50">
                <h4 className="mb-1">Manual entry</h4>
                <p className="text-sm text-[var(--flowfit-text-secondary)]">Not active</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4">AI & Privacy</h3>
            <div className="space-y-3">
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="mb-1">Run Gemma on-device (recommended)</h4>
                    <p className="text-sm text-[var(--flowfit-text-secondary)]">
                      Your data never leaves your phone
                    </p>
                  </div>
                  <button
                    onClick={() => setGemmaOnDevice(!gemmaOnDevice)}
                    className={`ml-4 w-12 h-7 rounded-full transition-colors relative ${
                      gemmaOnDevice ? 'bg-[var(--flowfit-sage)]' : 'bg-gray-300'
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
                    <p className="text-sm text-[var(--flowfit-text-secondary)]">
                      Sync your data across devices
                    </p>
                  </div>
                  <button
                    onClick={() => setCloudSync(!cloudSync)}
                    className={`ml-4 w-12 h-7 rounded-full transition-colors relative ${
                      cloudSync ? 'bg-[var(--flowfit-sage)]' : 'bg-gray-300'
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
                <span className="text-[var(--flowfit-text-secondary)]">App version</span>
                <span className="font-['JetBrains_Mono']">1.0.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--flowfit-text-secondary)]">GitHub</span>
                <a href="#" className="flex items-center gap-2 text-[var(--flowfit-sage)]">
                  <Github size={18} />
                  <span>View source</span>
                </a>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-sm text-[var(--flowfit-text-secondary)]">
                  Made by <span className="text-[var(--flowfit-text-primary)]">Infradian Labs</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <button
            onClick={() => onNavigate('home')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <Home size={24} />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <Calendar size={24} />
            <span className="text-xs">Calendar</span>
          </button>
          <button
            onClick={() => onNavigate('workout-log-input')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <FileText size={24} />
            <span className="text-xs">Log</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-sage)]">
            <SettingsIcon size={24} />
            <span className="text-xs">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
