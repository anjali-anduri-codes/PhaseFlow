import { PrimaryButton } from '../PrimaryButton';

interface AboutYouIntroScreenProps {
  userName: string;
  onNext: () => void;
}

export function AboutYouIntroScreen({ userName, onNext }: AboutYouIntroScreenProps) {
  return (
    <div className="flex flex-col h-full p-6 pt-16 relative overflow-hidden">
      <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-[var(--phase-ovulatory)]/15 animate-pulse" />
      <div className="absolute -bottom-10 -left-14 w-52 h-52 rounded-full bg-[var(--flowfit-sage)]/12 animate-pulse" style={{ animationDelay: '300ms' }} />

      <div className="flex-1 flex flex-col justify-center relative">
        <h1 className="mb-3" style={{ animation: 'flowfit-scale-circle 0.45s ease-out' }}>
          Hi {userName}, let&apos;s get to know about you!
        </h1>
        <p className="text-[var(--flowfit-text-secondary)]" style={{ animation: 'flowfit-scale-circle 0.6s ease-out' }}>
          Next, we&apos;ll ask about your cycle so Gemma can personalize your daily guidance.
        </p>
      </div>

      <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
    </div>
  );
}