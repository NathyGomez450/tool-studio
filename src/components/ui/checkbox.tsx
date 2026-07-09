import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
}

export const Checkbox = React.forwardRef<React.ElementRef<typeof CheckboxPrimitive.Root>, CheckboxProps>(
  ({ className, label, ...props }, ref) => (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none font-sans text-[13px] text-primary">
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          'w-[17px] h-[17px] rounded-[5px] border border-border-strong bg-[var(--bg-canvas)] flex items-center justify-center',
          'data-[state=checked]:bg-accent data-[state=checked]:border-accent',
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check size={11} strokeWidth={3} className="text-[var(--text-on-accent)]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label}
    </label>
  ),
);
Checkbox.displayName = 'Checkbox';
