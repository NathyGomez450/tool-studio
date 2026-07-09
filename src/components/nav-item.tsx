import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
}

export function NavItem({ icon, label, active, badge, onClick }: NavItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-2.5 h-9 mx-2 px-2.5 rounded-md cursor-pointer text-[13px] font-sans transition-colors',
        active ? 'bg-accent-soft text-primary font-semibold' : 'text-secondary font-medium hover:bg-[var(--bg-hover)]',
      )}
    >
      {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent" />}
      <span className={cn('w-4 text-center', active ? 'text-[var(--accent-400)]' : 'text-tertiary')}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span
          className={cn(
            'text-[10px] font-mono rounded-full px-1.5',
            active ? 'text-[var(--accent-400)] bg-accent-soft' : 'text-tertiary bg-surface3',
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
