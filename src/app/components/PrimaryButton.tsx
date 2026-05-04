import { ButtonHTMLAttributes } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'loading' | 'disabled';
  phaseColor?: string;
  children: React.ReactNode;
}

export function PrimaryButton({
  variant = 'default',
  phaseColor,
  children,
  className = '',
  disabled,
  ...props
}: PrimaryButtonProps) {
  const bgColor = phaseColor || 'var(--primary)';

  return (
    <button
      className={`w-full px-6 py-4 rounded-xl text-white transition-all min-h-[44px] ${className}`}
      style={{
        backgroundColor: variant === 'disabled' || disabled ? '#CBCBD4' : bgColor,
        opacity: variant === 'loading' ? 0.7 : 1
      }}
      disabled={variant === 'disabled' || variant === 'loading' || disabled}
      {...props}
    >
      {variant === 'loading' ? 'Loading...' : children}
    </button>
  );
}
