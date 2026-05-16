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
    <div className="size-full flex items-center justify-center bg-[var(--PhaseFlow-off-white)]">
      <div className="w-full max-w-[390px] h-full max-h-[844px] bg-[var(--PhaseFlow-off-white)] relative overflow-hidden shadow-2xl">
        {renderScreen()}
      </div>
    </div>
  );
}