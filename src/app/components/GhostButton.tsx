import { ButtonHTMLAttributes } from 'react';

interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function GhostButton({ children, className = '', ...props }: GhostButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg text-[var(--flowfit-text-primary)] hover:bg-[var(--flowfit-off-white)] transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
