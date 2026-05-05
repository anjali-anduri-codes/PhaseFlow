import { Calendar, Dumbbell, Home, MessageCircle, User } from 'lucide-react';

type NavScreen = 'home' | 'workouts-library' | 'gemma-chat' | 'calendar' | 'settings';

interface BottomNavProps {
  activeScreen: NavScreen;
  onNavigate: (screen: string) => void;
}

function itemClass(isActive: boolean): string {
  return `flex flex-col items-center gap-1 py-2 px-2 transition-colors ${
    isActive ? 'text-[var(--flowfit-sage)]' : 'text-[var(--flowfit-text-secondary)]'
  }`;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const isChatActive = activeScreen === 'gemma-chat';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
      <div className="grid grid-cols-5 items-end max-w-md mx-auto">
        <button onClick={() => onNavigate('home')} className={itemClass(activeScreen === 'home')}>
          <Home size={24} />
          <span className="text-xs">Home</span>
        </button>

        <button
          onClick={() => onNavigate('workouts-library')}
          className={itemClass(activeScreen === 'workouts-library')}
        >
          <Dumbbell size={24} />
          <span className="text-xs">Workouts</span>
        </button>

        <button onClick={() => onNavigate('gemma-chat')} className={itemClass(isChatActive)}>
          <div
            className={`w-14 h-14 rounded-full bg-[var(--flowfit-sage)] text-white shadow-lg flex items-center justify-center -translate-y-4 transition-all ${
              isChatActive
                ? 'ring-4 ring-[var(--flowfit-sage)]/35 scale-105'
                : 'ring-4 ring-[var(--flowfit-sage)]/20'
            }`}
          >
            <MessageCircle size={24} />
          </div>
          <span className="text-xs text-[var(--flowfit-sage)]">Chat</span>
        </button>

        <button onClick={() => onNavigate('calendar')} className={itemClass(activeScreen === 'calendar')}>
          <Calendar size={24} />
          <span className="text-xs">Calendar</span>
        </button>

        <button onClick={() => onNavigate('settings')} className={itemClass(activeScreen === 'settings')}>
          <User size={24} />
          <span className="text-xs">Account</span>
        </button>
      </div>
    </div>
  );
}