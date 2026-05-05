import { PhaseCalendarDay } from '../PhaseCalendarDay';
import { BottomNav } from '../BottomNav';

interface CalendarScreenProps {
  onNavigate: (screen: string) => void;
}

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

const phaseStyles: Record<
  Phase,
  { label: string; color: string; chipBackground: string; previewText: string }
> = {
  menstrual: {
    label: 'Menstrual',
    color: 'var(--phase-menstrual)',
    chipBackground: 'rgba(214, 90, 74, 0.24)',
    previewText: 'your restorative window.'
  },
  follicular: {
    label: 'Follicular',
    color: 'var(--phase-follicular)',
    chipBackground: 'rgba(92, 154, 108, 0.24)',
    previewText: 'your high-energy window.'
  },
  ovulatory: {
    label: 'Ovulatory',
    color: 'var(--phase-ovulatory)',
    chipBackground: 'rgba(122, 103, 184, 0.24)',
    previewText: 'your peak-performance window.'
  },
  luteal: {
    label: 'Luteal',
    color: 'var(--phase-luteal)',
    chipBackground: 'rgba(197, 138, 58, 0.24)',
    previewText: 'your steady, recovery-aware window.'
  }
};

const PHASE_ORDER: Phase[] = ['menstrual', 'follicular', 'ovulatory', 'luteal'];

function getPhaseForCycleDay(cycleDay: number): Phase {
  if (cycleDay <= 5) return 'menstrual';
  if (cycleDay <= 13) return 'follicular';
  if (cycleDay <= 17) return 'ovulatory';
  return 'luteal';
}

function getCycleDayFromDate(date: Date): number {
  return ((date.getDate() + 22 - 1) % 28) + 1;
}

function getDaysUntilNextPhase(cycleDay: number): number {
  if (cycleDay <= 5) return 6 - cycleDay;
  if (cycleDay <= 13) return 14 - cycleDay;
  if (cycleDay <= 17) return 18 - cycleDay;
  return 29 - cycleDay;
}

export function CalendarScreen({ onNavigate }: CalendarScreenProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = monthStart.getDay();
  const todayCycleDay = getCycleDayFromDate(today);
  const currentPhase = getPhaseForCycleDay(todayCycleDay);
  const nextPhase = PHASE_ORDER[(PHASE_ORDER.indexOf(currentPhase) + 1) % PHASE_ORDER.length];
  const daysUntilNextPhase = getDaysUntilNextPhase(todayCycleDay);
  const monthTitle = monthStart.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric'
  });

  const getPhase = (day: number): 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | null => {
    const cycleDay = ((day + 22 - 1) % 28) + 1;
    return getPhaseForCycleDay(cycleDay);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-6">
          <div className="pt-8">
            <h1>{monthTitle}</h1>
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
              {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasWorkout = [3, 5, 8, 12, 15, 19].includes(day);
                const isToday =
                  day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear();
                return (
                  <PhaseCalendarDay
                    key={day}
                    day={day}
                    phase={getPhase(day)}
                    isToday={isToday}
                    hasWorkout={hasWorkout}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {(Object.keys(phaseStyles) as Phase[]).map((phase) => (
              <div key={phase} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{
                    backgroundColor: phaseStyles[phase].chipBackground,
                    borderColor: phaseStyles[phase].color
                  }}
                />
                <span className="text-sm">{phaseStyles[phase].label}</span>
              </div>
            ))}
          </div>

          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: phaseStyles[nextPhase].chipBackground,
              borderColor: phaseStyles[nextPhase].color
            }}
          >
            <h4 className="mb-2">Upcoming phase preview</h4>
            <p className="text-sm" style={{ color: phaseStyles[nextPhase].color }}>
              {phaseStyles[nextPhase].label} phase starts in {daysUntilNextPhase} day
              {daysUntilNextPhase === 1 ? '' : 's'} - {phaseStyles[nextPhase].previewText}
            </p>
          </div>
        </div>
      </div>

      <BottomNav activeScreen="calendar" onNavigate={onNavigate} />
    </div>
  );
}
