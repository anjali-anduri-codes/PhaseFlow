import { useState } from 'react';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { DataSourceScreen } from './components/screens/DataSourceScreen';
import { CycleDatesScreen } from './components/screens/CycleDatesScreen';
import { GoalsScreen } from './components/screens/GoalsScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { WorkoutLogInputScreen } from './components/screens/WorkoutLogInputScreen';
import { WorkoutLogResultScreen } from './components/screens/WorkoutLogResultScreen';
import { CalendarScreen } from './components/screens/CalendarScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { ComponentLibraryScreen } from './components/screens/ComponentLibraryScreen';
import { WorkoutsLibraryScreen } from './components/screens/WorkoutsLibraryScreen';
import { WorkoutActiveScreen } from './components/screens/WorkoutActiveScreen';
import { WorkoutCompleteScreen } from './components/screens/WorkoutCompleteScreen';
import { GemmaChatScreen } from './components/screens/GemmaChatScreen';
import { BookOpen } from 'lucide-react';

type Screen =
  | 'welcome'
  | 'data-source'
  | 'cycle-dates'
  | 'goals'
  | 'home'
  | 'workouts-library'
  | 'workout-detail'
  | 'workout-active'
  | 'workout-complete'
  | 'workout-log-input'
  | 'workout-log-result'
  | 'calendar'
  | 'settings'
  | 'gemma-chat'
  | 'component-library';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setCurrentScreen('data-source')} />;
      case 'data-source':
        return <DataSourceScreen onNext={() => setCurrentScreen('cycle-dates')} />;
      case 'cycle-dates':
        return <CycleDatesScreen onNext={() => setCurrentScreen('goals')} />;
      case 'goals':
        return <GoalsScreen onNext={() => setCurrentScreen('home')} />;
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'workouts-library':
        return (
          <WorkoutsLibraryScreen
            onNavigate={handleNavigate}
            onSelectWorkout={(id) => setCurrentScreen('workout-active')}
          />
        );
      case 'workout-active':
        return (
          <WorkoutActiveScreen
            onExit={() => setCurrentScreen('workouts-library')}
            onComplete={() => setCurrentScreen('workout-complete')}
            onChat={() => setCurrentScreen('gemma-chat')}
          />
        );
      case 'workout-complete':
        return (
          <WorkoutCompleteScreen
            onFinish={() => setCurrentScreen('home')}
            onLogWorkout={() => setCurrentScreen('workout-log-input')}
          />
        );
      case 'gemma-chat':
        return <GemmaChatScreen onBack={() => setCurrentScreen('home')} />;
      case 'workout-log-input':
        return (
          <WorkoutLogInputScreen
            onBack={() => setCurrentScreen('home')}
            onAnalyse={() => setCurrentScreen('workout-log-result')}
          />
        );
      case 'workout-log-result':
        return (
          <WorkoutLogResultScreen
            onBack={() => setCurrentScreen('workout-log-input')}
            onSave={() => setCurrentScreen('home')}
          />
        );
      case 'calendar':
        return <CalendarScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      case 'component-library':
        return <ComponentLibraryScreen onBack={() => setCurrentScreen('welcome')} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-[var(--flowfit-off-white)]">
      <div className="w-full max-w-[390px] h-full max-h-[844px] bg-[var(--flowfit-off-white)] relative overflow-hidden shadow-2xl">
        {renderScreen()}

        {currentScreen !== 'component-library' && (
          <button
            onClick={() => setCurrentScreen('component-library')}
            className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors z-50"
            title="View Component Library"
          >
            <BookOpen size={20} className="text-[var(--flowfit-sage)]" />
          </button>
        )}
      </div>
    </div>
  );
}