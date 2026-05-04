import { useState } from 'react';
import { PhaseCard } from '../PhaseCard';
import { WorkoutCard } from '../WorkoutCard';
import { EnergyCheckIn } from '../EnergyCheckIn';
import { PhaseBadge } from '../PhaseBadge';
import { GemmaBadge } from '../GemmaBadge';
import { FloBadge } from '../FloBadge';
import { CycleProgressBar } from '../CycleProgressBar';
import { PrimaryButton } from '../PrimaryButton';
import { GhostButton } from '../GhostButton';
import { InputField } from '../InputField';
import { PhaseCalendarDay } from '../PhaseCalendarDay';
import { ArrowLeft } from 'lucide-react';

interface ComponentLibraryScreenProps {
  onBack: () => void;
}

export function ComponentLibraryScreen({ onBack }: ComponentLibraryScreenProps) {
  const [energyLevel, setEnergyLevel] = useState(3);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="p-6 space-y-8 pb-20">
        <div className="pt-8">
          <button onClick={onBack} className="flex items-center gap-2 mb-4 text-[var(--flowfit-sage)]">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1>Component Library</h1>
        </div>

        <div>
          <h3 className="mb-4">Phase Cards</h3>
          <div className="space-y-3">
            <PhaseCard
              phase="menstrual"
              day={3}
              totalDays={28}
              description="Estrogen and progesterone are low. Rest is essential."
              energyLevel={2}
            />
            <PhaseCard
              phase="follicular"
              day={10}
              totalDays={28}
              description="Estrogen is rising. Energy builds — great time for challenges."
              energyLevel={4}
            />
            <PhaseCard
              phase="ovulatory"
              day={15}
              totalDays={28}
              description="Estrogen peaks. You're at your strongest."
              energyLevel={5}
            />
            <PhaseCard
              phase="luteal"
              day={22}
              totalDays={28}
              description="Progesterone is peaking. Energy may taper."
              energyLevel={3}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Workout Card States</h3>
          <div className="space-y-3">
            <WorkoutCard
              name="Flow Pilates + Core"
              duration="35 min"
              intensity="Low intensity"
              phase="Luteal phase"
              reason="Your progesterone is at its peak. Low-impact movements help manage energy."
              exercises={['Cat-cow flows', 'Modified plank holds', 'Pelvic tilts and bridges']}
              warmup="Start with 5 minutes of gentle stretching"
              state="default"
            />
            <WorkoutCard
              name="Loading..."
              duration=""
              intensity=""
              phase=""
              reason=""
              exercises={[]}
              state="loading"
            />
            <WorkoutCard
              name="Error"
              duration=""
              intensity=""
              phase=""
              reason=""
              exercises={[]}
              state="error"
            />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Energy Check-In</h3>
          <EnergyCheckIn selectedLevel={energyLevel} onSelect={setEnergyLevel} />
        </div>

        <div>
          <h3 className="mb-4">Phase Badges</h3>
          <div className="flex flex-wrap gap-2">
            <PhaseBadge phase="menstrual" />
            <PhaseBadge phase="follicular" />
            <PhaseBadge phase="ovulatory" />
            <PhaseBadge phase="luteal" />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Gemma Badges</h3>
          <div className="flex flex-wrap gap-2">
            <GemmaBadge />
            <GemmaBadge variant="privacy" />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Flo Badge</h3>
          <div className="flex flex-wrap gap-2">
            <FloBadge connected={true} />
            <FloBadge connected={false} />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Cycle Progress Bars</h3>
          <div className="space-y-3">
            <CycleProgressBar currentDay={3} totalDays={28} phaseColor="var(--phase-menstrual)" />
            <CycleProgressBar currentDay={10} totalDays={28} phaseColor="var(--phase-follicular)" />
            <CycleProgressBar currentDay={15} totalDays={28} phaseColor="var(--phase-ovulatory)" />
            <CycleProgressBar currentDay={22} totalDays={28} phaseColor="var(--phase-luteal)" />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Primary Buttons</h3>
          <div className="space-y-3">
            <PrimaryButton>Default</PrimaryButton>
            <PrimaryButton variant="loading">Loading</PrimaryButton>
            <PrimaryButton variant="disabled">Disabled</PrimaryButton>
            <PrimaryButton phaseColor="var(--phase-ovulatory)">With Phase Color</PrimaryButton>
          </div>
        </div>

        <div>
          <h3 className="mb-4">Ghost Buttons</h3>
          <div className="space-y-2">
            <GhostButton>Default Ghost Button</GhostButton>
            <GhostButton>Hover over me</GhostButton>
          </div>
        </div>

        <div>
          <h3 className="mb-4">Input Fields</h3>
          <div className="space-y-3">
            <InputField placeholder="Default input" />
            <InputField label="With Label" placeholder="Enter text" />
            <InputField placeholder="Filled input" value="Some value" readOnly />
            <InputField placeholder="Error input" error="This field is required" />
          </div>
        </div>

        <div>
          <h3 className="mb-4">Phase Calendar Days</h3>
          <div className="grid grid-cols-7 gap-2">
            <PhaseCalendarDay day={1} phase="menstrual" />
            <PhaseCalendarDay day={2} phase="menstrual" isToday />
            <PhaseCalendarDay day={3} phase="menstrual" hasWorkout />
            <PhaseCalendarDay day={10} phase="follicular" />
            <PhaseCalendarDay day={11} phase="follicular" hasWorkout />
            <PhaseCalendarDay day={15} phase="ovulatory" />
            <PhaseCalendarDay day={22} phase="luteal" />
          </div>
        </div>
      </div>
    </div>
  );
}
