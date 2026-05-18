import { useState } from 'react';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { DataSourceScreen } from './components/screens/DataSourceScreen';
import { NameEntryScreen } from './components/screens/NameEntryScreen';
import { AboutYouIntroScreen } from './components/screens/AboutYouIntroScreen';
import { CycleDatesScreen } from './components/screens/CycleDatesScreen';
import { GoogleAuthScreen } from './components/screens/GoogleAuthScreen';
import { GoogleFitConsentScreen } from './components/screens/GoogleFitConsentScreen';
import { GoogleFitSyncScreen } from './components/screens/GoogleFitSyncScreen';
import { GoalsScreen } from './components/screens/GoalsScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { WorkoutLogInputScreen } from './components/screens/WorkoutLogInputScreen';
import { WorkoutLogResultScreen } from './components/screens/WorkoutLogResultScreen';
import { CalendarScreen } from './components/screens/CalendarScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { WorkoutsLibraryScreen } from './components/screens/WorkoutsLibraryScreen';
import { WorkoutActiveScreen } from './components/screens/WorkoutActiveScreen';
import { WorkoutCompleteScreen } from './components/screens/WorkoutCompleteScreen';
import { GemmaChatScreen } from './components/screens/GemmaChatScreen';
import {
  getHomeInsights,
  HomeInsights,
  parseWorkoutLog,
  WorkoutLogAnalysis,
  WorkoutRecommendation
} from './services/gemma';
import {
  clearGoogleNeedsManualCycleSetup,
  getGoogleNeedsManualCycleSetup,
  getSelectedDataSource,
  setSelectedDataSource
} from './services/googleHealth';
import {
  getSavedGeneratedWorkouts,
  saveGeneratedWorkout,
  SavedGeneratedWorkout
} from './services/workoutLibrary';

type DataSource = 'manual' | 'google' | null;

type Screen =
  | 'welcome'
  | 'data-source'
  | 'google-auth'
  | 'google-fit-consent'
  | 'google-fit-sync'
  | 'name-entry'
  | 'about-you-intro'
  | 'cycle-dates'
  | 'cycle-dates-quick'
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
  | 'gemma-chat';

interface WorkoutSessionSummary {
  elapsedSeconds: number;
  completedExercises: number;
  totalExercises: number;
  phase: string;
}

function normalizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }

  const lower = trimmed.toLowerCase();
  return `${lower[0].toUpperCase()}${lower.slice(1)}`;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [selectedDataSource, setSelectedDataSourceState] = useState<DataSource>(() =>
    getSelectedDataSource()
  );
  const [needsManualCycleEntry, setNeedsManualCycleEntry] = useState<boolean>(() =>
    getGoogleNeedsManualCycleSetup()
  );
  const [lastWorkoutLogText, setLastWorkoutLogText] = useState('');
  const [lastWorkoutAnalysis, setLastWorkoutAnalysis] = useState<WorkoutLogAnalysis | null>(null);
  const [workoutAnalysisError, setWorkoutAnalysisError] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [onboardingCycle, setOnboardingCycle] = useState<{
    lastCycleStartDate: string;
    lastPeriodFrom: string;
    lastPeriodTo: string;
    cycleLength: number;
  } | null>(null);
  const [onboardingGoals, setOnboardingGoals] = useState<string[]>([]);
  const [latestHomeInsights, setLatestHomeInsights] = useState<HomeInsights | null>(null);
  const [activeWorkoutPlan, setActiveWorkoutPlan] = useState<WorkoutRecommendation | null>(null);
  const [lastWorkoutSession, setLastWorkoutSession] = useState<WorkoutSessionSummary | null>(null);
  const [savedGeneratedWorkouts, setSavedGeneratedWorkouts] = useState<SavedGeneratedWorkout[]>(() =>
    getSavedGeneratedWorkouts()
  );

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen as Screen);
  };

  const handleAnalyseWorkoutLog = async (payload: {
    workoutName: string;
    logText: string;
  }) => {
    setLastWorkoutLogText(payload.logText);
    setWorkoutAnalysisError(null);

    try {
      const analysis = await parseWorkoutLog({
        logText: payload.logText,
        phase: latestHomeInsights?.phase || 'follicular',
        cycleDay: latestHomeInsights?.cycleDay || 1
      });

      setLastWorkoutAnalysis(analysis);
      setCurrentScreen('workout-log-result');
    } catch (error) {
      setLastWorkoutAnalysis(null);
      setWorkoutAnalysisError(
        error instanceof Error ? error.message : 'Gemma analysis failed. Please try again.'
      );
      setCurrentScreen('workout-log-input');
    }
  };

  const ensureWorkoutPlan = async (): Promise<WorkoutRecommendation | null> => {
    if (latestHomeInsights?.recommendation) {
      return latestHomeInsights.recommendation;
    }

    if (!onboardingCycle) {
      return null;
    }

    try {
      const insights = await getHomeInsights({
        energyRating: 3,
        userName,
        lastCycleStartDate: onboardingCycle.lastCycleStartDate,
        lastPeriodFrom: onboardingCycle.lastPeriodFrom,
        lastPeriodTo: onboardingCycle.lastPeriodTo,
        cycleLength: onboardingCycle.cycleLength,
        goals: onboardingGoals,
        dataSource: selectedDataSource
      });

      setLatestHomeInsights(insights);
      return insights.recommendation;
    } catch {
      return null;
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={() => setCurrentScreen('data-source')} />;
      case 'data-source':
        return (
          <DataSourceScreen
            onNext={(dataSource) => {
              setSelectedDataSourceState(dataSource);
              setSelectedDataSource(dataSource);
              if (dataSource === 'google') {
                setCurrentScreen('google-auth');
                return;
              }
              setCurrentScreen('name-entry');
            }}
          />
        );
      case 'name-entry':
        return (
          <NameEntryScreen
            initialName={userName}
            onNext={(name) => {
              setUserName(normalizeName(name));
              setCurrentScreen('about-you-intro');
            }}
          />
        );
      case 'about-you-intro':
        return (
          <AboutYouIntroScreen
            userName={userName || 'there'}
            onNext={() => setCurrentScreen('cycle-dates')}
          />
        );
      case 'google-auth':
        return <GoogleAuthScreen onNext={() => setCurrentScreen('google-fit-consent')} />;
      case 'google-fit-consent':
        return <GoogleFitConsentScreen onNext={() => setCurrentScreen('google-fit-sync')} />;
      case 'google-fit-sync':
        return (
          <GoogleFitSyncScreen
            onContinue={(hasCycleData) => {
              setNeedsManualCycleEntry(!hasCycleData);
              setCurrentScreen('goals');
            }}
          />
        );
      case 'cycle-dates':
        return (
          <CycleDatesScreen
            onNext={(payload) => {
              setOnboardingCycle(payload);
              if (payload.userName) {
                setUserName(normalizeName(payload.userName));
              }
              setLatestHomeInsights(null);
              setCurrentScreen('goals');
            }}
          />
        );
      case 'cycle-dates-quick':
        return (
          <CycleDatesScreen
            title="Complete your cycle baseline"
            continueLabel="Save cycle details"
            infoText="We could not find cycle records in Google Fit. Add this once to personalize your recommendations."
            onNext={(payload) => {
              setOnboardingCycle(payload);
              if (payload.userName) {
                setUserName(normalizeName(payload.userName));
              }
              setLatestHomeInsights(null);
              setNeedsManualCycleEntry(false);
              clearGoogleNeedsManualCycleSetup();
              setCurrentScreen('home');
            }}
            initialUserName={userName}
          />
        );
      case 'goals':
        return (
          <GoalsScreen
            onNext={(selectedGoals) => {
              setOnboardingGoals(selectedGoals);
              setLatestHomeInsights(null);
              setCurrentScreen('home');
            }}
          />
        );
      case 'home':
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            dataSource={selectedDataSource}
            showCycleSetupPrompt={selectedDataSource === 'google' && needsManualCycleEntry}
            onOpenCycleSetup={() => setCurrentScreen('cycle-dates-quick')}
            cycleContext={onboardingCycle}
            userName={userName}
            goals={onboardingGoals}
            initialInsights={latestHomeInsights}
            onInsightsLoaded={setLatestHomeInsights}
            onStartWorkout={(recommendation) => {
              setActiveWorkoutPlan(recommendation);
              setCurrentScreen('workout-active');
            }}
          />
        );
      case 'workouts-library':
        return (
          <WorkoutsLibraryScreen
            onNavigate={handleNavigate}
            savedGeneratedWorkouts={savedGeneratedWorkouts}
            onSelectSavedWorkout={(savedId) => {
              const selected = savedGeneratedWorkouts.find((item) => item.id === savedId);
              if (!selected) {
                return;
              }

              setActiveWorkoutPlan(selected.recommendation);
              setCurrentScreen('workout-active');
            }}
            onSelectWorkout={async (_id) => {
              const plan = await ensureWorkoutPlan();
              setActiveWorkoutPlan(plan);
              setCurrentScreen('workout-active');
            }}
          />
        );
      case 'workout-active':
        return (
          <WorkoutActiveScreen
            onExit={() => setCurrentScreen('workouts-library')}
            onComplete={(summary) => {
              setLastWorkoutSession(summary);
              setCurrentScreen('workout-complete');
            }}
            onChat={() => setCurrentScreen('gemma-chat')}
            workoutPlan={activeWorkoutPlan}
            currentPhase={latestHomeInsights?.phase}
          />
        );
      case 'workout-complete':
        return (
          <WorkoutCompleteScreen
            onFinish={() => setCurrentScreen('home')}
            onLogWorkout={() => setCurrentScreen('workout-log-input')}
            summary={lastWorkoutSession}
          />
        );
      case 'gemma-chat':
        return (
          <GemmaChatScreen
            onBack={() => setCurrentScreen('home')}
            onNavigate={handleNavigate}
            userName={userName}
            cycleContext={onboardingCycle}
            goals={onboardingGoals}
            latestHomeInsights={latestHomeInsights}
            onSaveWorkoutFromChat={(plan) => {
              const saved = saveGeneratedWorkout(plan);
              setSavedGeneratedWorkouts((prev) => [saved, ...prev].slice(0, 30));
            }}
            onStartWorkoutFromChat={(plan) => {
              const saved = saveGeneratedWorkout(plan);
              setSavedGeneratedWorkouts((prev) => [saved, ...prev].slice(0, 30));
              setActiveWorkoutPlan(plan);
              setCurrentScreen('workout-active');
            }}
          />
        );
      case 'workout-log-input':
        return (
          <WorkoutLogInputScreen
            onBack={() => setCurrentScreen('home')}
            onAnalyse={handleAnalyseWorkoutLog}
            analysisError={workoutAnalysisError}
          />
        );
      case 'workout-log-result':
        return (
          <WorkoutLogResultScreen
            onBack={() => setCurrentScreen('workout-log-input')}
            onSave={() => setCurrentScreen('home')}
            logText={lastWorkoutLogText}
            analysis={lastWorkoutAnalysis}
          />
        );
      case 'calendar':
        return <CalendarScreen onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsScreen onNavigate={handleNavigate} />;
      default:
        return (
          <HomeScreen
            onNavigate={handleNavigate}
            dataSource={selectedDataSource}
            showCycleSetupPrompt={selectedDataSource === 'google' && needsManualCycleEntry}
            onOpenCycleSetup={() => setCurrentScreen('cycle-dates-quick')}
            cycleContext={onboardingCycle}
            userName={userName}
            goals={onboardingGoals}
            initialInsights={latestHomeInsights}
            onInsightsLoaded={setLatestHomeInsights}
            onStartWorkout={(recommendation) => {
              setActiveWorkoutPlan(recommendation);
              setCurrentScreen('workout-active');
            }}
          />
        );
    }
  };

  return (
    <div className="PhaseFlow-device-wall relative isolate min-h-screen w-full flex items-center justify-center overflow-hidden px-0 py-0 sm:px-6 sm:py-4">
      <div className="PhaseFlow-device-wall-orb PhaseFlow-device-wall-orb-a" />
      <div className="PhaseFlow-device-wall-orb PhaseFlow-device-wall-orb-b" />
      <div className="PhaseFlow-device-wall-orb PhaseFlow-device-wall-orb-c" />
      <div className="relative z-10 w-full flex-shrink-0 sm:w-auto">
        <div className="pointer-events-none absolute left-[-4px] top-28 hidden h-16 w-[2px] rounded-full bg-[#585f68] sm:block" />
        <div className="pointer-events-none absolute left-[-4px] top-48 hidden h-24 w-[2px] rounded-full bg-[#585f68] sm:block" />
        <div className="pointer-events-none absolute right-[-4px] top-40 hidden h-28 w-[2px] rounded-full bg-[#4f5660] sm:block" />

        <div className="relative w-full overflow-hidden bg-[linear-gradient(180deg,#7d858e_0%,#616972_44%,#4f5761_100%)] sm:w-[402px] sm:rounded-[2.55rem] sm:border-[6px] sm:border-[#5f6771] sm:shadow-[0_24px_56px_rgba(36,40,46,0.28)]">
          <div className="pointer-events-none absolute inset-x-3 top-2 hidden h-14 rounded-t-[2rem] bg-gradient-to-b from-white/16 to-transparent sm:block" />

          <div className="w-full bg-[var(--PhaseFlow-off-white)] relative overflow-hidden min-h-screen sm:min-h-0 sm:h-[844px] sm:w-[390px] sm:rounded-[2rem] sm:ring-1 sm:ring-black/10">
            <div className="pointer-events-none absolute left-1/2 top-3 z-30 hidden h-4 w-4 -translate-x-1/2 rounded-full bg-[#111111] shadow-[0_0_0_2px_rgba(34,34,34,0.9),0_0_0_4px_rgba(255,255,255,0.06)] sm:block" />
            {renderScreen()}
          </div>
        </div>
      </div>
    </div>
  );
}