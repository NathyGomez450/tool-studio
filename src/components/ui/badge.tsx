import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-semibold uppercase tracking-wide font-sans border',
  {
    variants: {
      tone: {
        neutral: 'bg-surface3 text-secondary border-border',
        accent: 'bg-accent-soft text-[var(--accent-400)] border-[var(--accent-soft-border)]',
        success: 'bg-[var(--success-soft)] text-[var(--green-400)] border-[var(--success-soft-border)]',
        info: 'bg-[var(--info-soft)] text-[var(--blue-400)] border-[var(--info-soft-border)]',
        warning: 'bg-[var(--warning-soft)] text-[var(--amber-400)] border-[var(--warning-soft-border)]',
        danger: 'bg-[var(--danger-soft)] text-[var(--red-400)] border-[var(--danger-soft-border)]',
        creative: 'bg-[var(--creative-soft)] text-[var(--violet-400)] border-[var(--creative-soft-border)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, tone, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
