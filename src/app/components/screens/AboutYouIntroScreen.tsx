import { useState } from 'react';
import { PrimaryButton } from '../PrimaryButton';

interface AboutYouIntroScreenProps {
  userName: string;
  onNext: () => void;
}

export function AboutYouIntroScreen({ userName, onNext }: AboutYouIntroScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  const handleContinue = () => {
    setIsExiting(true);
    window.setTimeout(() => {
      onNext();
    }, 220);
  };

  return (
    <div
      className={`flex flex-col h-full p-6 pt-16 relative overflow-hidden transition-all duration-200 ${
        isExiting ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-[var(--phase-ovulatory)]/15 pointer-events-none"
        style={{ animation: 'flowfit-fade-in 0.55s ease-out both' }}
      />
      <div
        className="absolute -bottom-10 -left-14 w-52 h-52 rounded-full bg-[var(--flowfit-sage)]/12 pointer-events-none"
        style={{ animation: 'flowfit-fade-in 0.7s ease-out both' }}
      />

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <h1
          className="mb-3 font-['DM_Sans'] text-[var(--flowfit-text-primary)]"
          style={{ animation: 'flowfit-fade-up 0.45s ease-out both' }}
        >
          Hi {userName}, let&apos;s get to know about you!
        </h1>
        <p
          className="font-['DM_Sans'] text-[var(--flowfit-text-secondary)]"
          style={{ animation: 'flowfit-fade-up 0.62s ease-out both' }}
        >
          Next, we&apos;ll ask about your cycle so Gemma can personalize your daily guidance.
        </p>
      </div>

      <div className="relative z-10 pb-1">
        <PrimaryButton onClick={handleContinue}>Continue</PrimaryButton>
      </div>
    </div>
  );
}