import { useState } from 'react';
import { PhaseCard } from '../PhaseCard';
import { EnergyCheckIn } from '../EnergyCheckIn';
import { WorkoutCard } from '../WorkoutCard';
import { Home, Calendar, Dumbbell, MessageCircle, TrendingUp, Flame, Award, Settings } from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [energyLevel, setEnergyLevel] = useState<number | undefined>(undefined);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-6">
          <div className="pt-8">
            <div className="flex items-center justify-between mb-1">
              <h1>Ready to train?</h1>
              <button
                onClick={() => onNavigate('settings')}
                className="p-2 rounded-full hover:bg-white transition-colors"
              >
                <Settings size={20} className="text-[var(--flowfit-text-secondary)]" />
              </button>
            </div>
            <div className="flex items-center gap-2 font-['JetBrains_Mono']">
              <span className="text-[var(--flowfit-text-secondary)]">Day 22</span>
              <span className="text-[var(--flowfit-text-secondary)]">·</span>
              <span style={{ color: 'var(--phase-luteal)' }}>Luteal phase</span>
            </div>
          </div>

          {/* Weekly Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Flame size={18} className="text-[var(--flowfit-terracotta)]" />
                <span className="text-xs text-[var(--flowfit-text-secondary)]">Streak</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-2xl">5</div>
              <span className="text-xs text-[var(--flowfit-text-secondary)]">days</span>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-[var(--flowfit-sage)]" />
                <span className="text-xs text-[var(--flowfit-text-secondary)]">This week</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-2xl">3</div>
              <span className="text-xs text-[var(--flowfit-text-secondary)]">workouts</span>
            </div>

            <div className="bg-white p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-[var(--phase-ovulatory)]" />
                <span className="text-xs text-[var(--flowfit-text-secondary)]">Level</span>
              </div>
              <div className="font-['JetBrains_Mono'] text-2xl">12</div>
              <span className="text-xs text-[var(--flowfit-text-secondary)]">progress</span>
            </div>
          </div>

          <PhaseCard
            phase="luteal"
            day={22}
            totalDays={28}
            description="Progesterone is peaking. Energy may taper — listen to your body."
            energyLevel={3}
          />

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
              name="Flow Pilates + Core"
              duration="35 min"
              intensity="Low intensity"
              phase="Luteal phase"
              reason="Your progesterone is at its peak. Low-impact movements help manage energy while building core stability and reducing bloating."
              exercises={[
                'Cat-cow flows (5 min)',
                'Modified plank holds (3 sets)',
                'Pelvic tilts and bridges (4 sets)',
                'Gentle spinal twists'
              ]}
              warmup="Start with 5 minutes of gentle stretching"
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
              Focus on magnesium-rich foods like dark leafy greens and nuts to support
              progesterone and reduce cramping.
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-sage)]">
            <Home size={24} />
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => onNavigate('workouts-library')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <Dumbbell size={24} />
            <span className="text-xs">Workouts</span>
          </button>
          <button
            onClick={() => onNavigate('calendar')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <Calendar size={24} />
            <span className="text-xs">Calendar</span>
          </button>
          <button
            onClick={() => onNavigate('gemma-chat')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <MessageCircle size={24} />
            <span className="text-xs">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
