import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  label?: string;
}

export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, label, ...props }, ref) => (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none font-sans text-[13px] text-primary">
      <SwitchPrimitive.Root
        ref={ref}
        className={cn(
          'w-9 h-5 rounded-full bg-[var(--gray-700)] data-[state=checked]:bg-accent relative transition-colors outline-none',
          className,
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="block w-4 h-4 rounded-full bg-white shadow-sm translate-x-0.5 transition-transform data-[state=checked]:translate-x-[18px]" />
      </SwitchPrimitive.Root>
      {label}
    </label>
  ),
);
Switch.displayName = 'Switch';
