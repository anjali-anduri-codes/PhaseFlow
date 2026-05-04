import { PhaseCalendarDay } from '../PhaseCalendarDay';
import { Home, Calendar as CalendarIcon, Dumbbell, MessageCircle } from 'lucide-react';

interface CalendarScreenProps {
  onNavigate: (screen: string) => void;
}

export function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  const daysInMonth = 30;
  const startDay = 3;

  const getPhase = (day: number): 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | null => {
    const cycleDay = ((day + 22 - 1) % 28) + 1;
    if (cycleDay <= 5) return 'menstrual';
    if (cycleDay <= 13) return 'follicular';
    if (cycleDay <= 17) return 'ovulatory';
    return 'luteal';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-6">
          <div className="pt-8">
            <h1>May 2026</h1>
          </div>

          <div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="text-center text-xs text-[var(--flowfit-text-secondary)] py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startDay - 1 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasWorkout = [3, 5, 8, 12, 15, 19].includes(day);
                return (
                  <PhaseCalendarDay
                    key={day}
                    day={day}
                    phase={getPhase(day)}
                    isToday={day === 2}
                    hasWorkout={hasWorkout}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(184, 76, 58, 0.15)' }} />
              <span className="text-sm">Menstrual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(74, 124, 89, 0.15)' }} />
              <span className="text-sm">Follicular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(92, 75, 138, 0.15)' }} />
              <span className="text-sm">Ovulatory</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'rgba(160, 114, 42, 0.15)' }} />
              <span className="text-sm">Luteal</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--flowfit-off-white)] rounded-xl">
            <h4 className="mb-2">Upcoming phase preview</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">
              Follicular phase starts in 6 days — your high-energy window.
            </p>
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
            onClick={() => onNavigate('workouts-library')}
            className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-text-secondary)]"
          >
            <Dumbbell size={24} />
            <span className="text-xs">Workouts</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-2 px-4 text-[var(--flowfit-sage)]">
            <CalendarIcon size={24} />
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
