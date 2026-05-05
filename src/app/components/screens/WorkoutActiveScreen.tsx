import { useState, useEffect, useMemo } from 'react';
import { X, Play, Pause, SkipForward, MessageCircle } from 'lucide-react';

interface WorkoutPlan {
  name: string;
  warmup?: string;
  exercises: string[];
}

interface WorkoutActiveScreenProps {
  onExit: () => void;
  onComplete: () => void;
  onChat: () => void;
  workoutPlan?: WorkoutPlan | null;
}

const defaultExercises = [
  { name: 'Cat-cow flows', duration: 300, sets: 1, description: '5 minutes of gentle spinal movement' },
  { name: 'Modified plank holds', duration: 180, sets: 3, description: '30 seconds hold, 30 seconds rest' },
  { name: 'Pelvic tilts and bridges', duration: 240, sets: 4, description: '15 reps per set' },
  { name: 'Gentle spinal twists', duration: 180, sets: 1, description: '3 minutes each side' }
];

export function WorkoutActiveScreen({ onExit, onComplete, onChat, workoutPlan }: WorkoutActiveScreenProps) {
  const exercises = useMemo(() => {
    if (!workoutPlan?.exercises?.length) {
      return defaultExercises;
    }

    const planExercises = workoutPlan.exercises.map((exercise) => ({
      name: exercise,
      duration: 180,
      sets: 1,
      description: 'Gemma-selected movement for today.'
    }));

    if (workoutPlan.warmup) {
      return [
        {
          name: 'Warmup',
          duration: 180,
          sets: 1,
          description: workoutPlan.warmup
        },
        ...planExercises
      ];
    }

    return planExercises;
  }, [workoutPlan]);

  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(exercises[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);

  useEffect(() => {
    setCurrentExercise(0);
    setCurrentSet(1);
    setTimeRemaining(exercises[0]?.duration || 180);
    setIsPaused(false);
    setIsResting(false);
    setSessionStarted(false);
    setCompletedExercises([]);
  }, [exercises]);

  useEffect(() => {
    if (!sessionStarted) {
      return;
    }

    if (!isPaused && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeRemaining === 0) {
      handleExerciseComplete();
    }
  }, [timeRemaining, isPaused]);

  const handleExerciseComplete = () => {
    const exercise = exercises[currentExercise];

    if (currentSet < exercise.sets) {
      setIsResting(true);
      setCurrentSet(currentSet + 1);
      setTimeRemaining(30); // 30 second rest
    } else if (currentExercise < exercises.length - 1) {
      setCompletedExercises((prev) =>
        prev.includes(currentExercise) ? prev : [...prev, currentExercise]
      );
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      setTimeRemaining(exercises[currentExercise + 1].duration);
      setIsResting(false);
    } else {
      setCompletedExercises((prev) =>
        prev.includes(currentExercise) ? prev : [...prev, currentExercise]
      );
      onComplete();
    }
  };

  const handleSkip = () => {
    setCompletedExercises((prev) =>
      prev.includes(currentExercise) ? prev : [...prev, currentExercise]
    );

    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
      setCurrentSet(1);
      setTimeRemaining(exercises[currentExercise + 1].duration);
      setIsResting(false);
    } else {
      onComplete();
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
                    {formatTime(item.duration)}
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
              Next: {exercises[currentExercise].name}
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
