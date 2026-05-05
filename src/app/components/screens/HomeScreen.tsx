import { useEffect, useState } from 'react';
import { PhaseCard } from '../PhaseCard';
import { EnergyCheckIn } from '../EnergyCheckIn';
import { WorkoutCard } from '../WorkoutCard';
import { MessageCircle, TrendingUp, Flame, Award, Settings } from 'lucide-react';
import { getHomeInsights, HomeInsights } from '../../services/gemma';
import { BottomNav } from '../BottomNav';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  dataSource?: 'manual' | 'google' | null;
  showCycleSetupPrompt?: boolean;
  onOpenCycleSetup?: () => void;
  cycleContext?: {
    lastCycleStartDate: string;
    cycleLength: number;
  } | null;
  goals?: string[];
  onInsightsLoaded?: (insights: HomeInsights) => void;
}

export function HomeScreen({
  onNavigate,
  dataSource,
  showCycleSetupPrompt = false,
  onOpenCycleSetup,
  cycleContext,
  goals = [],
  onInsightsLoaded
}: HomeScreenProps) {
  const [energyLevel, setEnergyLevel] = useState<number | undefined>(undefined);
  const [homeInsights, setHomeInsights] = useState<HomeInsights | null>(null);
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadHomeInsights = async () => {
      setIsInsightsLoading(true);
      setInsightsError(null);

      try {
        const result = await getHomeInsights({
          energyRating: energyLevel ?? 3,
          lastCycleStartDate: cycleContext?.lastCycleStartDate,
          cycleLength: cycleContext?.cycleLength,
          goals,
          dataSource
        });

        if (isActive) {
          setHomeInsights(result);
          onInsightsLoaded?.(result);
        }
      } catch (error) {
        if (isActive) {
          setHomeInsights(null);
          setInsightsError(
            error instanceof Error ? error.message : 'Unable to load home insights from Gemma.'
          );
        }
      } finally {
        if (isActive) {
          setIsInsightsLoading(false);
        }
      }
    };

    void loadHomeInsights();

    return () => {
      isActive = false;
    };
  }, [energyLevel, cycleContext?.lastCycleStartDate, cycleContext?.cycleLength, dataSource, goals, onInsightsLoaded]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-6">
          <div className="pt-8">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div
                  className="flowfit-rotating-icon flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{
                    backgroundColor: 'var(--flowfit-off-white)',
                    color: 'var(--flowfit-sage)',
                    animation: 'flowfit-rotate 3.5s linear infinite'
                  }}
                  aria-label="FlowFit app icon"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="8" fill="currentColor" opacity="0.12" />
                    <path
                      d="M10 3.5c2.3 1.2 4.7 3.2 4.1 6.3-.4 2.2-2.2 4-4.1 5.7-1.9-1.7-3.7-3.5-4.1-5.7-.6-3.1 1.8-5.1 4.1-6.3Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h1>Ready to train?</h1>
              </div>
              <button
                onClick={() => onNavigate('settings')}
                className="p-2 rounded-full hover:bg-white transition-colors"
              >
                <Settings size={20} className="text-[var(--flowfit-text-secondary)]" />
              </button>
            </div>
            <div className="flex items-center gap-2 font-['JetBrains_Mono']">
              <span className="text-[var(--flowfit-text-secondary)]">
                Day {homeInsights?.cycleDay ?? '--'}
              </span>
              <span className="text-[var(--flowfit-text-secondary)]">·</span>
              <span style={{ color: 'var(--phase-luteal)' }}>
                {homeInsights ? `${homeInsights.phase[0].toUpperCase()}${homeInsights.phase.slice(1)} phase` : 'Phase unavailable'}
              </span>
            </div>
          </div>

          {showCycleSetupPrompt && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="mb-1">Complete your cycle baseline</h4>
                  <p className="text-sm text-[var(--flowfit-text-secondary)]">
                    {dataSource === 'google'
                      ? 'Google Fit is connected, but no cycle data was found. Add your cycle dates once to personalize your workouts.'
                      : 'Add your cycle dates to improve recommendation accuracy.'}
                  </p>
                </div>
                <button
                  onClick={onOpenCycleSetup}
                  className="px-3 py-2 rounded-lg bg-[var(--flowfit-sage)] text-white text-sm whitespace-nowrap"
                >
                  Add now
                </button>
              </div>
            </div>
          )}

          {/* Weekly Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={18} className="text-[var(--flowfit-terracotta)]" />
                <span className="text-xs text-[var(--flowfit-text-secondary)]">Streak</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-2xl">{homeInsights?.stats.streakDays ?? '--'}</div>
              <span className="text-xs text-[var(--flowfit-text-secondary)]">days</span>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-[var(--flowfit-sage)]" />
                <span className="text-xs text-[var(--flowfit-text-secondary)]">This week</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-2xl">{homeInsights?.stats.workoutsThisWeek ?? '--'}</div>
              <span className="text-xs text-[var(--flowfit-text-secondary)]">workouts</span>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-[var(--phase-ovulatory)]" />
                <span className="text-xs text-[var(--flowfit-text-secondary)]">Level</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-2xl">{homeInsights?.stats.levelProgress ?? '--'}</div>
              <span className="text-xs text-[var(--flowfit-text-secondary)]">progress</span>
            </div>
          </div>

          {homeInsights && (
            <PhaseCard
              phase={homeInsights.phase}
              day={homeInsights.cycleDay}
              totalDays={homeInsights.totalDays}
              description={homeInsights.phaseDescription}
              energyLevel={energyLevel ?? 3}
            />
          )}

          {insightsError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{insightsError}</p>
            </div>
          )}

          <div>
            <h4 className="mb-3">How do you feel today?</h4>
            <EnergyCheckIn selectedLevel={energyLevel} onSelect={setEnergyLevel} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4>Recommended for you</h4>
              <button
                onClick={() => onNavigate('workouts-library')}
                className="text-sm text-[var(--flowfit-sage)]"
              >
                Browse all
              </button>
            </div>
            <WorkoutCard
              name={homeInsights?.recommendation.name || (isInsightsLoading ? 'Loading recommendation...' : 'Recommendation unavailable')}
              duration={homeInsights?.recommendation.duration || '--'}
              intensity={homeInsights?.recommendation.intensity || '--'}
              phase={homeInsights?.recommendation.phase || 'Current phase'}
              reason={
                homeInsights?.recommendation.reason ||
                (isInsightsLoading
                  ? 'Gemma is preparing your personalized workout based on your current phase and energy.'
                  : insightsError || 'Recommendation unavailable.')
              }
              exercises={homeInsights?.recommendation.exercises || ['Check your Gemma API setup and retry.']}
              warmup={homeInsights?.recommendation.warmup || 'No warmup available'}
              onStart={() => onNavigate('workout-active')}
            />
          </div>

          {/* Quick Actions */}
          <div>
            <h4 className="mb-3">Quick actions</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('gemma-chat')}
                className="p-4 bg-gradient-to-br from-[var(--phase-ovulatory)] to-[var(--phase-ovulatory)]/80 rounded-xl text-white text-left"
              >
                <MessageCircle size={24} className="mb-2" />
                <h4 className="text-white mb-1">Ask Gemma</h4>
                <p className="text-xs text-white/80">Get AI coaching advice</p>
              </button>

              <button
                onClick={() => onNavigate('workout-log-input')}
                className="p-4 bg-white rounded-xl border border-gray-200 text-left"
              >
                <TrendingUp size={24} className="mb-2 text-[var(--flowfit-sage)]" />
                <h4 className="mb-1">Log workout</h4>
                <p className="text-xs text-[var(--flowfit-text-secondary)]">Track your progress</p>
              </button>
            </div>
          </div>

          <div className="p-4 bg-[var(--flowfit-off-white)] rounded-xl">
            <h4 className="mb-2">Phase tip</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">
              {homeInsights?.phaseTip || (isInsightsLoading ? 'Gemma is generating your phase tip...' : 'No phase tip available.')}
            </p>
          </div>
        </div>
      </div>

      <BottomNav activeScreen="home" onNavigate={onNavigate} />
    </div>
  );
}
