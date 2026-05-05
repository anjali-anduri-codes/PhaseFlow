import { InputHTMLAttributes, useState } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function InputField({ label, error, className = '', ...props }: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block mb-2 text-[var(--PhaseFlow-text-primary)]">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl bg-[var(--PhaseFlow-off-white)] border-2 transition-colors min-h-[44px] ${
          error
            ? 'border-[var(--phase-menstrual)]'
            : isFocused
            ? 'border-[var(--PhaseFlow-sage)]'
            : 'border-gray-200'
        } ${className}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--phase-menstrual)]">{error}</p>
      )}
    </div>
  );
}
