import { useState, useEffect, useMemo } from 'react';
import { X, Play, Pause, SkipForward, MessageCircle } from 'lucide-react';

interface WorkoutPlan {
  name: string;
  warmup?: string;
  exercises: string[];
}

interface WorkoutExercise {
  name: string;
  workSeconds: number;
  sets: number;
  restSeconds: number;
  repsText: string;
  description: string;
}

interface WorkoutActiveScreenProps {
  onExit: () => void;
  onComplete: (summary: {
    elapsedSeconds: number;
    completedExercises: number;
    totalExercises: number;
    phase: string;
  }) => void;
  onChat: () => void;
  workoutPlan?: WorkoutPlan | null;
  currentPhase?: string;
}

const defaultExercises = [
  {
    name: 'Cat-cow flows',
    workSeconds: 180,
    sets: 2,
    restSeconds: 20,
    repsText: '10-12 reps',
    description: 'Gentle mobility for spinal and hip comfort.'
  },
  {
    name: 'Modified plank holds',
    workSeconds: 45,
    sets: 3,
    restSeconds: 25,
    repsText: '45 sec hold',
    description: 'Core engagement with controlled breathing.'
  },
  {
    name: 'Pelvic tilts and bridges',
    workSeconds: 50,
    sets: 3,
    restSeconds: 25,
    repsText: '10-12 reps',
    description: 'Glute and core support with low joint stress.'
  },
  {
    name: 'Gentle spinal twists',
    workSeconds: 120,
    sets: 1,
    restSeconds: 0,
    repsText: '1 round',
    description: 'Cool down and release tension.'
  }
];

function phaseDefaults(phase?: string): { sets: number; workSeconds: number; restSeconds: number; repsText: string } {
  switch ((phase || '').toLowerCase()) {
    case 'menstrual':
      return { sets: 2, workSeconds: 40, restSeconds: 30, repsText: '8-10 reps' };
    case 'ovulatory':
      return { sets: 4, workSeconds: 50, restSeconds: 20, repsText: '10-12 reps' };
    case 'follicular':
      return { sets: 3, workSeconds: 45, restSeconds: 20, repsText: '10-12 reps' };
    case 'luteal':
    default:
      return { sets: 3, workSeconds: 45, restSeconds: 30, repsText: '10-12 reps' };
  }
}

function parseExercise(exerciseText: string, phase?: string): WorkoutExercise {
  const defaults = phaseDefaults(phase);
  const text = exerciseText.trim();
  const lower = text.toLowerCase();

  const xPattern = text.match(/(\d+)\s*[xX]\s*(\d+)/);
  const setsOfPattern = text.match(/(\d+)\s*sets?\s*(?:of)?\s*(\d+)/i);
  const setsPattern = text.match(/(\d+)\s*sets?/i);
  const repsPattern = text.match(/(\d+)\s*reps?/i);
  const timedPattern = text.match(/(\d+)\s*(sec|secs|second|seconds|min|mins|minute|minutes)/i);

  let sets = defaults.sets;
  let workSeconds = defaults.workSeconds;
  const restSeconds = defaults.restSeconds;
  let repsText = defaults.repsText;

  if (timedPattern) {
    const value = Number(timedPattern[1]);
    const unit = timedPattern[2].toLowerCase();
    workSeconds = unit.startsWith('min') ? value * 60 : value;
    sets = setsPattern ? Math.max(1, Number(setsPattern[1])) : 1;
    repsText = `${value} ${unit.startsWith('min') ? 'min' : 'sec'}`;
  } else if (xPattern) {
    sets = Math.max(1, Number(xPattern[1]));
    repsText = `${xPattern[2]} reps`;
  } else if (setsOfPattern) {
    sets = Math.max(1, Number(setsOfPattern[1]));
    repsText = `${setsOfPattern[2]} reps`;
  } else {
    if (setsPattern) {
      sets = Math.max(1, Number(setsPattern[1]));
    }

    if (repsPattern) {
      repsText = `${repsPattern[1]} reps`;
    }
  }

  if (/(breath|mobility|stretch|cool\s*down|walk)/i.test(lower) && !timedPattern) {
    sets = 1;
    workSeconds = 120;
    repsText = '1 round';
  }

  return {
    name: text,
    workSeconds,
    sets,
    restSeconds,
    repsText,
    description: `Perform ${repsText} for ${sets} set${sets > 1 ? 's' : ''}.`
  };
}

export function WorkoutActiveScreen({ onExit, onComplete, onChat, workoutPlan, currentPhase }: WorkoutActiveScreenProps) {
  const exercises = useMemo(() => {
    if (!workoutPlan?.exercises?.length) {
      return defaultExercises;
    }

    const planExercises = workoutPlan.exercises.map((exercise) => parseExercise(exercise, currentPhase));

    if (workoutPlan.warmup) {
      return [
        {
          name: 'Warmup',
          workSeconds: 180,
          sets: 1,
          restSeconds: 0,
          repsText: '3 min prep',
          description: workoutPlan.warmup
        },
        ...planExercises
      ];
    }

    return planExercises;
  }, [workoutPlan, currentPhase]);

  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(exercises[0].workSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);

  useEffect(() => {
    setCurrentExercise(0);
    setCurrentSet(1);
    setTimeRemaining(exercises[0]?.workSeconds || 180);
    setIsPaused(false);
    setIsResting(false);
    setSessionStarted(false);
    setCompletedExercises([]);
    setSessionStartedAt(null);
  }, [exercises]);

  const completeSession = (finalCompletedCount: number) => {
    const now = Date.now();
    const elapsedSeconds = sessionStartedAt
      ? Math.max(1, Math.round((now - sessionStartedAt) / 1000))
      : 0;

    onComplete({
      elapsedSeconds,
      completedExercises: Math.min(finalCompletedCount, totalExercises),
      totalExercises,
      phase: currentPhase || 'Unknown'
    });
  };

  useEffect(() => {
    if (!sessionStarted || isPaused) {
      return;
    }

    if (timeRemaining === 0) {
      handleExerciseComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionStarted, isPaused, timeRemaining, isResting, currentExercise, currentSet]);

  const handleExerciseComplete = () => {
    const exercise = exercises[currentExercise];

    if (isResting) {
      setIsResting(false);
      setTimeRemaining(exercise.workSeconds);
      return;
    }

    if (currentSet < exercise.sets) {
      setIsResting(true);
      setCurrentSet(currentSet + 1);
      setTimeRemaining(exercise.restSeconds || 20);
    } else if (currentExercise < exercises.length - 1) {
      setCompletedExercises((prev) =>
        prev.includes(currentExercise) ? prev : [...prev, currentExercise]
      );
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      setTimeRemaining(exercises[currentExercise + 1].workSeconds);
      setIsResting(false);
    } else {
      setCompletedExercises((prev) => {
        const next = prev.includes(currentExercise) ? prev : [...prev, currentExercise];
        completeSession(next.length);
        return next;
      });
    }
  };

  const handleSkip = () => {
    setCompletedExercises((prev) =>
      prev.includes(currentExercise) ? prev : [...prev, currentExercise]
    );

    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      setTimeRemaining(exercises[currentExercise + 1].workSeconds);
      setIsResting(false);
    } else {
      setCompletedExercises((prev) => {
        const next = prev.includes(currentExercise) ? prev : [...prev, currentExercise];
        completeSession(next.length);
        return next;
      });
    }
  };

  const exercise = exercises[currentExercise];
  const totalExercises = exercises.length;
  const progress = ((currentExercise + (currentSet / exercise.sets)) / totalExercises) * 100;
  const trackedProgress = Math.round((completedExercises.length / totalExercises) * 100);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sessionStarted) {
    return (
      <div className="flex flex-col h-full bg-[var(--flowfit-off-white)] p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className="p-2 rounded-full bg-white text-[var(--flowfit-text-primary)]">
            <X size={24} />
          </button>
          <button onClick={onChat} className="p-2 rounded-full bg-white text-[var(--flowfit-sage)]">
            <MessageCircle size={24} />
          </button>
        </div>

        <h1 className="mb-2">Review workout plan</h1>
        <p className="text-[var(--flowfit-text-secondary)] mb-5">
          {workoutPlan?.name || 'Today\'s guided session'}
        </p>

        {workoutPlan?.warmup && (
          <div className="p-4 rounded-xl bg-white border border-gray-200 mb-4">
            <h4 className="mb-1">Warmup</h4>
            <p className="text-sm text-[var(--flowfit-text-secondary)]">{workoutPlan.warmup}</p>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <div className="space-y-2">
            {exercises.map((item, index) => (
              <div key={`${item.name}-${index}`} className="p-3 rounded-xl bg-white border border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm">{item.name}</h4>
                    <p className="text-xs text-[var(--flowfit-text-secondary)]">{item.description}</p>
                  </div>
                  <span className="text-xs text-[var(--flowfit-text-secondary)] font-['JetBrains_Mono']">
                    {item.sets} x {item.repsText}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setSessionStarted(true);
            setIsPaused(false);
            if (!sessionStartedAt) {
              setSessionStartedAt(Date.now());
            }
          }}
          className="w-full px-6 py-4 rounded-xl text-white bg-[var(--flowfit-sage)] min-h-[44px] mt-4"
        >
          Start session
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--flowfit-sage)]">
      {/* Header */}
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="p-2 rounded-full bg-white/20 text-white">
            <X size={24} />
          </button>
          <button onClick={onChat} className="p-2 rounded-full bg-white/20 text-white">
            <MessageCircle size={24} />
          </button>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-white/80 text-sm mb-2">
            <span>Exercise {currentExercise + 1} of {totalExercises}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-white/75">Plan tracked: {completedExercises.length}/{totalExercises} complete ({trackedProgress}%)</p>
      </div>

      {/* Exercise Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-white">
        {isResting ? (
          <>
            <div className="text-6xl font-['JetBrains_Mono'] mb-4">{formatTime(timeRemaining)}</div>
            <h2 className="mb-2 text-white">Rest</h2>
            <p className="text-white/80 text-center">
              Next: {exercises[currentExercise].name} (Set {currentSet} of {exercise.sets})
            </p>
          </>
        ) : (
          <>
            <div className="w-48 h-48 mb-8 rounded-2xl bg-white/10 flex items-center justify-center">
              {/* Exercise illustration placeholder */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="35" r="15" fill="white" opacity="0.3" />
                <rect x="45" y="55" width="30" height="40" rx="4" fill="white" opacity="0.3" />
                <rect x="30" y="60" width="15" height="8" rx="4" fill="white" opacity="0.3" />
                <rect x="75" y="60" width="15" height="8" rx="4" fill="white" opacity="0.3" />
                <rect x="45" y="95" width="12" height="20" rx="4" fill="white" opacity="0.3" />
                <rect x="63" y="95" width="12" height="20" rx="4" fill="white" opacity="0.3" />
              </svg>
            </div>

            <h1 className="mb-2 text-white text-center">{exercise.name}</h1>
            <p className="text-white/80 mb-6 text-center">{exercise.description}</p>

            <div className="text-white/90 mb-2 font-['JetBrains_Mono']">
              Target: {exercise.repsText}
            </div>

            {exercise.sets > 1 && (
              <div className="text-white/90 mb-4 font-['JetBrains_Mono']">
                Set {currentSet} of {exercise.sets}
              </div>
            )}

            <div className="text-7xl font-['JetBrains_Mono'] mb-8">
              {formatTime(timeRemaining)}
            </div>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 pb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={handleSkip}
            className="p-4 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            <SkipForward size={28} />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-6 rounded-full bg-white text-[var(--flowfit-sage)] hover:bg-white/90 transition-colors"
          >
            {isPaused ? <Play size={32} /> : <Pause size={32} />}
          </button>
        </div>

        <p className="text-center text-white/60 text-sm">
          {isPaused ? 'Paused - Take your time' : 'Keep going! Listen to your body'}
        </p>
      </div>
    </div>
  );
}
