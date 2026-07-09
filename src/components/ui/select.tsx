import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-sm border border-border bg-[var(--bg-canvas)] px-3 text-[13px] font-sans text-primary outline-none appearance-none cursor-pointer',
        'disabled:bg-surface3 disabled:text-disabled disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
