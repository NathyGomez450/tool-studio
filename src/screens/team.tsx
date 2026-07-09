import { Users } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useTeam } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';

export function Team() {
  const { data: team, isLoading, isError } = useTeam();
  return (
    <>
      <TopBar title="Equipe — Origem Studio" subtitle="5 membros" icon={<Users size={20} />} iconTone="success" actions={<Button variant="secondary">+ Convidar</Button>} />
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !team ? (
          <ScreenError />
        ) : (
          <div className="flex flex-col border border-border rounded-md overflow-hidden">
            {team.map((m, i) => (
              <div key={m.name} className={`flex items-center gap-3 px-4 py-3.5 bg-surface transition-colors hover:bg-[var(--bg-hover)] ${i > 0 ? 'border-t border-border-subtle' : ''}`}>
                <Avatar name={m.name} size={34} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-primary">{m.name}</div>
                  <div className="text-xs text-tertiary">{m.role}</div>
                </div>
                <div className="text-xs font-mono text-secondary">{m.tasks} tarefas ativas</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
