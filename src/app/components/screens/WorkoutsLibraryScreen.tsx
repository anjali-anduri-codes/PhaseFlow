import { Search } from 'lucide-react';
import { useState } from 'react';
import { BottomNav } from '../BottomNav';
import { SavedGeneratedWorkout } from '../../services/workoutLibrary';

interface WorkoutsLibraryScreenProps {
  onNavigate: (screen: string) => void;
  onSelectWorkout: (workoutId: string) => void;
  savedGeneratedWorkouts?: SavedGeneratedWorkout[];
  onSelectSavedWorkout?: (savedWorkoutId: string) => void;
}

const workoutCategories = [
  { id: 'strength', name: 'Strength', color: 'var(--phase-follicular)' },
  { id: 'cardio', name: 'Cardio', color: 'var(--phase-ovulatory)' },
  { id: 'flexibility', name: 'Flexibility', color: 'var(--phase-luteal)' },
  { id: 'recovery', name: 'Recovery', color: 'var(--phase-menstrual)' },
];

const workouts = [
  {
    id: '1',
    name: 'Power Strength',
    category: 'strength',
    duration: '45 min',
    intensity: 'High',
    phase: 'Follicular/Ovulatory',
    image: 'strength'
  },
  {
    id: '2',
    name: 'HIIT Cardio Blast',
    category: 'cardio',
    duration: '30 min',
    intensity: 'High',
    phase: 'Ovulatory',
    image: 'cardio'
  },
  {
    id: '3',
    name: 'Flow Yoga',
    category: 'flexibility',
    duration: '40 min',
    intensity: 'Low',
    phase: 'All phases',
    image: 'yoga'
  },
  {
    id: '4',
    name: 'Gentle Pilates',
    category: 'recovery',
    duration: '35 min',
    intensity: 'Low',
    phase: 'Luteal/Menstrual',
    image: 'pilates'
  },
  {
    id: '5',
    name: 'Core Focus',
    category: 'strength',
    duration: '25 min',
    intensity: 'Medium',
    phase: 'Follicular',
    image: 'core'
  },
  {
    id: '6',
    name: 'Restorative Stretch',
    category: 'recovery',
    duration: '20 min',
    intensity: 'Low',
    phase: 'Menstrual',
    image: 'stretch'
  },
];

function formatGeneratedDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  });
}

export function WorkoutsLibraryScreen({
  onNavigate,
  onSelectWorkout,
  savedGeneratedWorkouts = [],
  onSelectSavedWorkout
}: WorkoutsLibraryScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredWorkouts = selectedCategory
    ? workouts.filter((w) => w.category === selectedCategory)
    : workouts;

  const getWorkoutImage = (type: string) => {
    const illustrations = {
      strength: (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="20" r="8" fill="currentColor" opacity="0.3" />
          <rect x="30" y="32" width="20" height="25" rx="3" fill="currentColor" opacity="0.3" />
          <rect x="15" y="36" width="12" height="6" rx="3" fill="currentColor" opacity="0.3" />
          <rect x="53" y="36" width="12" height="6" rx="3" fill="currentColor" opacity="0.3" />
          <line x1="25" y1="42" x2="15" y2="50" stroke="currentColor" strokeWidth="4" opacity="0.3" />
          <line x1="55" y1="42" x2="65" y2="50" stroke="currentColor" strokeWidth="4" opacity="0.3" />
        </svg>
      ),
      cardio: (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="20" r="8" fill="currentColor" opacity="0.3" />
          <path d="M 40 28 L 40 45 L 35 60 L 30 75" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
          <path d="M 40 45 L 45 60 L 50 75" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
          <line x1="40" y1="35" x2="50" y2="45" stroke="currentColor" strokeWidth="4" opacity="0.3" />
        </svg>
      ),
      yoga: (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="25" r="8" fill="currentColor" opacity="0.3" />
          <path d="M 40 33 Q 30 40 25 55 L 20 70" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
          <path d="M 40 33 Q 50 40 55 55 L 60 70" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
          <line x1="40" y1="40" x2="40" y2="55" stroke="currentColor" strokeWidth="4" opacity="0.3" />
        </svg>
      ),
      pilates: (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="35" cy="25" r="8" fill="currentColor" opacity="0.3" />
          <path d="M 25 35 Q 35 40 45 40 Q 55 40 60 35" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
          <ellipse cx="40" cy="50" rx="25" ry="15" fill="currentColor" opacity="0.15" />
        </svg>
      ),
      core: (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="25" r="8" fill="currentColor" opacity="0.3" />
          <rect x="28" y="35" width="24" height="20" rx="3" fill="currentColor" opacity="0.3" />
          <line x1="40" y1="55" x2="35" y2="70" stroke="currentColor" strokeWidth="4" opacity="0.3" />
          <line x1="40" y1="55" x2="45" y2="70" stroke="currentColor" strokeWidth="4" opacity="0.3" />
        </svg>
      ),
      stretch: (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="30" cy="30" r="8" fill="currentColor" opacity="0.3" />
          <path d="M 30 38 Q 40 45 50 40 L 60 35" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3" />
          <path d="M 35 45 L 30 60" stroke="currentColor" strokeWidth="4" opacity="0.3" />
        </svg>
      ),
    };
    return illustrations[type as keyof typeof illustrations] || illustrations.strength;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pb-20">
        <div className="p-6 space-y-6">
          <div className="pt-8">
            <h1 className="mb-4">Workouts</h1>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--PhaseFlow-text-secondary)]" size={20} />
              <input
                type="text"
                placeholder="Search workouts..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-transparent focus:border-[var(--PhaseFlow-sage)] transition-colors"
              />
            </div>
          </div>

          <div>
            <h4 className="mb-3">Categories</h4>
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === null
                    ? 'bg-[var(--PhaseFlow-sage)] text-white'
                    : 'bg-white text-[var(--PhaseFlow-text-primary)] border border-gray-200'
                }`}
              >
                All
              </button>
              {workoutCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'text-white'
                      : 'bg-white text-[var(--PhaseFlow-text-primary)] border border-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === cat.id ? cat.color : undefined
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {savedGeneratedWorkouts.length > 0 && (
            <div>
              <h4 className="mb-3">Your workouts</h4>
              <div className="space-y-2">
                {savedGeneratedWorkouts.map((saved) => (
                  <button
                    key={saved.id}
                    onClick={() => onSelectSavedWorkout?.(saved.id)}
                    className="w-full p-4 bg-white rounded-xl border border-gray-200 text-left hover:border-[var(--PhaseFlow-sage)] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm mb-1">{saved.recommendation.name}</h4>
                        <p className="text-xs text-[var(--PhaseFlow-text-secondary)]">
                          {saved.recommendation.duration} · {saved.recommendation.intensity} · {saved.recommendation.phase}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--PhaseFlow-text-secondary)] whitespace-nowrap">
                        Generated {formatGeneratedDate(saved.generatedAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {filteredWorkouts.map((workout) => (
              <button
                key={workout.id}
                onClick={() => onSelectWorkout(workout.id)}
                className="bg-white rounded-2xl overflow-hidden text-left hover:shadow-lg transition-shadow"
              >
                <div
                  className="h-32 flex items-center justify-center"
                  style={{
                    backgroundColor:
                      workoutCategories.find((c) => c.id === workout.category)?.color + '20'
                  }}
                >
                  <div
                    className="w-20 h-20"
                    style={{
                      color: workoutCategories.find((c) => c.id === workout.category)?.color
                    }}
                  >
                    {getWorkoutImage(workout.image)}
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="mb-1 text-sm">{workout.name}</h4>
                  <div className="flex items-center gap-1 text-xs text-[var(--PhaseFlow-text-secondary)] mb-1">
                    <span>{workout.duration}</span>
                    <span>·</span>
                    <span>{workout.intensity}</span>
                  </div>
                  <p className="text-xs text-[var(--PhaseFlow-text-secondary)]">{workout.phase}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav activeScreen="workouts-library" onNavigate={onNavigate} />
    </div>
  );
}
