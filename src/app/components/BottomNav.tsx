import { Calendar, Dumbbell, Home, MessageCircle, User } from 'lucide-react';

type NavScreen = 'home' | 'workouts-library' | 'gemma-chat' | 'calendar' | 'settings';

interface BottomNavProps {
  activeScreen: NavScreen;
  onNavigate: (screen: string) => void;
}

function itemClass(isActive: boolean): string {
  return `flex flex-col items-center gap-0.5 py-1 px-2 transition-colors ${
    isActive ? 'text-[var(--flowfit-sage)]' : 'text-[var(--flowfit-text-secondary)]'
  }`;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const isChatActive = activeScreen === 'gemma-chat';

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2 z-20">
      <div className="grid grid-cols-5 items-end w-full">
        <button onClick={() => onNavigate('home')} className={itemClass(activeScreen === 'home')}>
          <Home size={22} />
          <span className="text-[11px]">Home</span>
        </button>

        <button
          onClick={() => onNavigate('workouts-library')}
          className={itemClass(activeScreen === 'workouts-library')}
        >
          <Dumbbell size={22} />
          <span className="text-[11px]">Workouts</span>
        </button>

        <button onClick={() => onNavigate('gemma-chat')} className={itemClass(isChatActive)}>
          <div
            className={`w-12 h-12 rounded-full bg-[var(--flowfit-sage)] text-white shadow-lg flex items-center justify-center -translate-y-3 transition-all ${
              isChatActive
                ? 'ring-3 ring-[var(--flowfit-sage)]/35 scale-105'
                : 'ring-3 ring-[var(--flowfit-sage)]/20'
            }`}
          >
            <MessageCircle size={20} />
          </div>
          <span className="text-[11px] text-[var(--flowfit-sage)]">Chat</span>
        </button>

        <button onClick={() => onNavigate('calendar')} className={itemClass(activeScreen === 'calendar')}>
          <Calendar size={22} />
          <span className="text-[11px]">Calendar</span>
        </button>

        <button onClick={() => onNavigate('settings')} className={itemClass(activeScreen === 'settings')}>
          <User size={22} />
          <span className="text-[11px]">Account</span>
        </button>
      </div>
    </div>
  );
}