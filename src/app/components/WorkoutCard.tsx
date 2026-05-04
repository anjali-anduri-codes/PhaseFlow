import { GemmaBadge } from './GemmaBadge';

interface WorkoutCardProps {
  name: string;
  duration: string;
  intensity: string;
  phase: string;
  reason: string;
  exercises: string[];
  warmup?: string;
  onStart?: () => void;
  onRefresh?: () => void;
  state?: 'default' | 'loading' | 'error';
}

export function WorkoutCard({
  name,
  duration,
  intensity,
  phase,
  reason,
  exercises,
  warmup,
  onStart,
  onRefresh,
  state = 'default'
}: WorkoutCardProps) {
  if (state === 'loading') {
    return (
      <div className="p-6 bg-white rounded-2xl border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="p-6 bg-white rounded-2xl border border-[var(--phase-menstrual)]">
        <h3 className="mb-2">Unable to load workout</h3>
        <p className="text-[var(--flowfit-text-secondary)] mb-4">Please try again.</p>
        <button
          onClick={onRefresh}
          className="text-[var(--flowfit-sage)] underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-200">
      <h2 className="mb-3">{name}</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        <span className="px-3 py-1 bg-[var(--flowfit-off-white)] rounded-full text-sm">
          {duration}
        </span>
        <span className="px-3 py-1 bg-[var(--flowfit-off-white)] rounded-full text-sm">
          {intensity}
        </span>
        <span className="px-3 py-1 bg-[var(--flowfit-off-white)] rounded-full text-sm">
          {phase}
        </span>
      </div>

      <div className="p-4 bg-[var(--flowfit-off-white)] rounded-xl mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4>Why this workout</h4>
          <GemmaBadge text="Gemma 4" />
        </div>
        <p className="text-sm text-[var(--flowfit-text-secondary)]">{reason}</p>
      </div>

      <div className="mb-4">
        <h4 className="mb-2">Exercises</h4>
        <ul className="space-y-2">
          {exercises.map((exercise, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--flowfit-sage)] mt-2 flex-shrink-0"></span>
              <span className="text-sm">{exercise}</span>
            </li>
          ))}
        </ul>
      </div>

      {warmup && (
        <p className="text-sm text-[var(--flowfit-text-secondary)] mb-4 italic">
          {warmup}
        </p>
      )}

      <button
        onClick={onStart}
        className="w-full px-6 py-4 rounded-xl text-white bg-[var(--flowfit-sage)] min-h-[44px] mb-2"
      >
        Start workout
      </button>

      <button
        onClick={onRefresh}
        className="w-full px-4 py-2 text-[var(--flowfit-text-primary)] hover:bg-[var(--flowfit-off-white)] rounded-lg"
      >
        Refresh suggestion
      </button>
    </div>
  );
}
