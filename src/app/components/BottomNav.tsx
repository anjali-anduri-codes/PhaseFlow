import { Calendar, Dumbbell, Home, MessageCircle, User } from 'lucide-react';

type NavScreen = 'home' | 'workouts-library' | 'gemma-chat' | 'calendar' | 'settings';

interface BottomNavProps {
  activeScreen: NavScreen;
  onNavigate: (screen: string) => void;
}

function itemClass(isActive: boolean): string {
  return `flex items-center justify-center py-1 px-2 transition-colors ${
    isActive ? 'text-[var(--PhaseFlow-sage)]' : 'text-[var(--PhaseFlow-text-secondary)]'
  }`;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const isChatActive = activeScreen === 'gemma-chat';

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-20">
      <div className="grid grid-cols-5 items-center w-full">
        <button onClick={() => onNavigate('home')} className={itemClass(activeScreen === 'home')}>
          <Home size={20} />
        </button>

        <button
          onClick={() => onNavigate('workouts-library')}
          className={itemClass(activeScreen === 'workouts-library')}
        >
          <Dumbbell size={20} />
        </button>

        <button onClick={() => onNavigate('gemma-chat')} className={itemClass(isChatActive)}>
          <div
            className={`w-10 h-10 rounded-full bg-[var(--PhaseFlow-sage)] text-white shadow-md flex items-center justify-center -translate-y-2 transition-all ${
              isChatActive
                ? 'ring-2 ring-[var(--PhaseFlow-sage)]/35 scale-105'
                : 'ring-2 ring-[var(--PhaseFlow-sage)]/20'
            }`}
          >
            <MessageCircle size={18} />
          </div>
        </button>

        <button onClick={() => onNavigate('calendar')} className={itemClass(activeScreen === 'calendar')}>
          <Calendar size={20} />
        </button>

        <button onClick={() => onNavigate('settings')} className={itemClass(activeScreen === 'settings')}>
          <User size={20} />
        </button>
      </div>
    </div>
  );
}