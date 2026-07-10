import * as React from 'react';
import { Users, Plus } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useTeam } from '@/queries/hooks';
import { InviteDialog } from '@/components/dialogs/invite-dialog';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { useAuth } from '@/auth/auth-context';

export function Team() {
  const { activeProject, canInvite } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: team, isLoading, isError } = useTeam(projectId);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  return (
    <>
      <TopBar
        title={`Equipe — ${activeProject?.name ?? 'Projeto'}`}
        subtitle={`${team?.length ?? 0} membros`}
        icon={<Users size={20} />}
        iconTone="success"
        actions={canInvite ? <Button variant="secondary" onClick={() => setInviteOpen(true)}><Plus size={14} className="mr-1" /> Convidar</Button> : undefined}
      />
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !team ? (
          <ScreenError />
        ) : team.length === 0 ? (
          <ScreenEmpty message="Nenhum membro ainda." />
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
      <InviteDialog projectId={projectId} open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}
