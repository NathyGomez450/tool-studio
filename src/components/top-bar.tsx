import * as React from 'react';

const ICON_TONE: Record<string, string> = {
  accent: 'bg-accent-soft border-[var(--accent-soft-border)] text-[var(--accent-400)]',
  danger: 'bg-[var(--danger-soft)] border-[var(--danger-soft-border)] text-[var(--red-400)]',
  success: 'bg-[var(--success-soft)] border-[var(--success-soft-border)] text-[var(--green-400)]',
  info: 'bg-[var(--info-soft)] border-[var(--info-soft-border)] text-[var(--blue-400)]',
  warning: 'bg-[var(--warning-soft)] border-[var(--warning-soft-border)] text-[var(--amber-400)]',
  creative: 'bg-[var(--creative-soft)] border-[var(--creative-soft-border)] text-[var(--violet-400)]',
};

export function TopBar({
  title,
  subtitle,
  actions,
  icon,
  iconTone = 'accent',
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  iconTone?: 'accent' | 'danger' | 'success' | 'info' | 'warning' | 'creative';
}) {
  return (
    <div className="border-b border-border-subtle px-6 py-5 flex items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3.5 min-w-0">
        {icon && (
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${ICON_TONE[iconTone]}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[20px] font-bold text-primary tracking-tight leading-tight truncate">{title}</div>
          {subtitle && <div className="text-[13px] text-tertiary mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
