import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  tone?: 'accent' | 'warning' | 'danger' | 'success' | 'info';
  showLabel?: boolean;
  className?: string;
}

const toneColor: Record<string, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  danger: 'bg-danger',
  success: 'bg-success',
  info: 'bg-info',
};

export function ProgressBar({ value, tone = 'accent', showLabel, className }: ProgressBarProps) {
  return (
    <div className={cn('flex items-center gap-2.5 w-full', className)}>
      <div className="flex-1 h-1.5 rounded-full bg-surface3 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-[width]', toneColor[tone])}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && <span className="font-mono text-[11px] text-tertiary min-w-[30px] text-right">{value}%</span>}
    </div>
  );
}
