import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-[var(--text-on-accent)] hover:bg-accent-hover',
        secondary: 'bg-surface3 border border-border text-primary hover:border-border-strong',
        ghost: 'bg-transparent text-primary hover:bg-[var(--bg-hover)]',
        danger: 'bg-[var(--danger-soft)] text-[var(--red-400)] border border-[oklch(0.60_0.21_25_/_0.35)]',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-[34px] px-3.5 text-[13px]',
        lg: 'h-10 px-[18px] text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
