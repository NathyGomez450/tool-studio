import { LayoutDashboard, ListChecks, Bug, Flag, Users } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress';
import { useDashboard } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
import { useAuth } from '@/auth/auth-context';

const STAT_ICONS = [<ListChecks size={16} />, <Bug size={16} />, <Flag size={16} />, <Users size={16} />];
const STAT_STYLES = [
  'bg-accent-soft border-[var(--accent-soft-border)] text-[var(--accent-400)]',
  'bg-[var(--danger-soft)] border-[var(--danger-soft-border)] text-[var(--red-400)]',
  'bg-[var(--success-soft)] border-[var(--success-soft-border)] text-[var(--green-400)]',
  'bg-[var(--info-soft)] border-[var(--info-soft-border)] text-[var(--blue-400)]',
];

export function Dashboard() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data, isLoading, isError } = useDashboard(projectId);

  return (
    <>
      <TopBar title={`Painel — ${activeProject?.name ?? 'Projeto'}`} subtitle="Visão geral do projeto" icon={<LayoutDashboard size={20} />} />
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

            <div className="grid grid-cols-[1.4fr_1fr] gap-4">
              {/* Distribuição do Kanban */}
              <Card>
                <div className="text-[13px] font-semibold text-primary mb-3.5">Distribuição do Kanban</div>
                {data.kanban.every((k) => k.count === 0) ? (
                  <p className="text-[12px] text-tertiary">Nenhuma tarefa ainda.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {data.kanban.map((k) => {
                      const max = Math.max(1, ...data.kanban.map((c) => c.count));
                      const pct = Math.round((k.count / max) * 100);
                      return (
                        <div key={k.label}>
                          <div className="flex justify-between text-xs text-secondary mb-1.5">
                            <span>{k.label}</span>
                            <span className="font-mono text-tertiary">{k.count}</span>
                          </div>
                          <ProgressBar value={pct} tone="accent" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Progresso do Roadmap */}
              <Card>
                <div className="text-[13px] font-semibold text-primary mb-3.5">Progresso do Roadmap</div>
                {data.roadmap.total === 0 ? (
                  <p className="text-[12px] text-tertiary">Nenhum item no roadmap.</p>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-[26px] font-bold text-primary leading-none">
                        {Math.round((data.roadmap.done / data.roadmap.total) * 100)}%
                      </span>
                      <span className="text-xs text-tertiary">concluído</span>
                    </div>
                    <ProgressBar value={Math.round((data.roadmap.done / data.roadmap.total) * 100)} tone="success" />
                    <div className="flex gap-4 mt-3.5 text-xs">
                      <span className="text-secondary"><span className="text-[var(--green-400)] font-semibold">{data.roadmap.done}</span> concluído</span>
                      <span className="text-secondary"><span className="text-[var(--accent-400)] font-semibold">{data.roadmap.doing}</span> em andamento</span>
                      <span className="text-secondary"><span className="text-tertiary font-semibold">{data.roadmap.planned}</span> planejado</span>
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Atividade recente */}
            <Card>
              <div className="text-[13px] font-semibold text-primary mb-3.5">Atividade recente</div>
              {data.activity.length === 0 ? (
                <p className="text-[12px] text-tertiary">Nenhuma atividade ainda.</p>
              ) : (
                <div className="flex flex-col">
                  {data.activity.map((a, i) => (
                    <div key={i} className="flex gap-2.5 items-start py-2.5 border-t border-border-subtle first:border-t-0 first:pt-0">
                      <div className="text-xs text-secondary leading-relaxed min-w-0">
                        {a.who && <span className="text-primary font-semibold">{a.who} </span>}
                        {a.what}
                        <div className="text-disabled text-[11px] mt-1">{a.when}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </>
  );
}
