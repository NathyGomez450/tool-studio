import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-9 w-full rounded-sm border bg-[var(--bg-canvas)] px-3 text-[13px] font-sans text-primary outline-none transition-colors',
      'placeholder:text-tertiary focus:shadow-focus focus:border-[var(--border-focus)]',
      error ? 'border-danger' : 'border-border',
      'disabled:bg-surface3 disabled:text-disabled',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
