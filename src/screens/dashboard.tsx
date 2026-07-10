import { LayoutDashboard, ListChecks, Bug, Activity, Flag } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { useDashboard } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
import { useAuth } from '@/auth/auth-context';

const STAT_ICONS = [
  <ListChecks size={16} />,
  <Bug size={16} />,
  <Activity size={16} />,
  <Flag size={16} />,
];

const STAT_STYLES = [
  'bg-accent-soft border-[var(--accent-soft-border)] text-[var(--accent-400)]',
  'bg-[var(--danger-soft)] border-[var(--danger-soft-border)] text-[var(--red-400)]',
  'bg-[var(--success-soft)] border-[var(--success-soft-border)] text-[var(--green-400)]',
  'bg-[var(--info-soft)] border-[var(--info-soft-border)] text-[var(--blue-400)]',
];

function barTone(v: number): 'success' | 'accent' | 'warning' {
  if (v >= 70) return 'success';
  if (v >= 40) return 'accent';
  return 'warning';
}

export function Dashboard() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data, isLoading, isError } = useDashboard(projectId);
  return (
    <>
      <TopBar title="Painel — Skyline Racer" subtitle="Visão geral do projeto" icon={<LayoutDashboard size={20} />} />
      <div className="p-6 overflow-auto flex flex-col gap-5">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !data ? (
          <ScreenError />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3.5">
              {data.stats.map((s, i) => (
                <Card key={s.label}>
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center mb-3 ${STAT_STYLES[i] ?? STAT_STYLES[0]}`}>
                    {STAT_ICONS[i] ?? STAT_ICONS[0]}
                  </div>
                  <div className="text-[26px] font-bold text-primary tracking-tight leading-none">{s.value}</div>
                  <div className="text-xs text-tertiary mt-1.5">{s.label}</div>
                </Card>
              ))}
            </div>
            {data.sprint.length > 0 && (
              <div className="grid grid-cols-[1.4fr_1fr] gap-4">
                <Card>
                  <div className="text-[13px] font-semibold text-primary mb-3.5">Progresso do sprint 14</div>
                  <div className="flex flex-col gap-3">
                    {data.sprint.map((p) => (
                      <div key={p.label}>
                        <div className="flex justify-between text-xs text-secondary mb-1.5">
                          <span>{p.label}</span>
                          <span className="font-mono text-tertiary">{p.value}%</span>
                        </div>
                        <ProgressBar value={p.value} tone={barTone(p.value)} />
                      </div>
                    ))}
                  </div>
                </Card>
                {data.activity.length > 0 && (
                  <Card>
                    <div className="text-[13px] font-semibold text-primary mb-3.5">Atividade recente</div>
                    <div className="flex flex-col">
                      {data.activity.map((a) => (
                        <div
                          key={a.when + a.who}
                          className="flex gap-2.5 items-start py-2.5 border-t border-border-subtle first:border-t-0 first:pt-0"
                        >
                          <div className="text-xs text-secondary leading-relaxed min-w-0">
                            <span className="text-primary font-semibold">{a.who}</span> {a.what}
                            <div className="text-disabled text-[11px] mt-1">{a.when}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
