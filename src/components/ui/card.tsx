import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg p-5 shadow-sm transition-all hover:border-border-strong hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
      {...props}
    />
  );
}
