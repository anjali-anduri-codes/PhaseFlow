import { useState } from 'react';
import { InputField } from '../InputField';
import { PrimaryButton } from '../PrimaryButton';

interface NameEntryScreenProps {
  onNext: (name: string) => void;
  initialName?: string;
}

export function NameEntryScreen({ onNext, initialName = '' }: NameEntryScreenProps) {
  const [name, setName] = useState(initialName);

  return (
    <div className="flex flex-col h-full p-6 pt-16">
      <div className="mb-8">
        <h1 className="mb-2">What should we call you?</h1>
        <p className="text-[var(--flowfit-text-secondary)]">
          We use your name for a more personal coaching experience.
        </p>
      </div>

      <div className="flex-1">
        <InputField
          type="text"
          label="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
        />
      </div>

      <PrimaryButton disabled={!name.trim()} onClick={() => onNext(name.trim())}>
        Continue
      </PrimaryButton>
    </div>
  );
}