import { WorkoutRecommendation } from './gemma';

const STORAGE_KEY = 'phaseflow.generatedWorkouts';

export interface SavedGeneratedWorkout {
  id: string;
  generatedAt: string;
  recommendation: WorkoutRecommendation;
}

function safeParseSavedWorkouts(raw: string | null): SavedGeneratedWorkout[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SavedGeneratedWorkout[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => !!item?.id && !!item?.generatedAt && !!item?.recommendation);
  } catch {
    return [];
  }
}

export function getSavedGeneratedWorkouts(): SavedGeneratedWorkout[] {
  return safeParseSavedWorkouts(window.localStorage.getItem(STORAGE_KEY))
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
}

export function saveGeneratedWorkout(recommendation: WorkoutRecommendation): SavedGeneratedWorkout {
  const current = getSavedGeneratedWorkouts();
  const saved: SavedGeneratedWorkout = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generatedAt: new Date().toISOString(),
    recommendation
  };

  const next = [saved, ...current].slice(0, 30);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return saved;
}
