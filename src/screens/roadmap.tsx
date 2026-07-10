import * as React from 'react';
import { ArrowRight, Plus, Pencil } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type RoadmapItem, type RoadmapQuarter } from '@/lib/data';
import { useRoadmap } from '@/queries/hooks';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { RoadmapDialog } from '@/components/dialogs/roadmap-dialog';
import { useAuth } from '@/auth/auth-context';

const statusTone: Record<RoadmapItem['status'], any> = { 'em andamento': 'accent', planejado: 'neutral', 'concluído': 'success' };
const bulletColor: Record<RoadmapItem['status'], string> = {
  'em andamento': 'bg-accent',
  planejado: 'bg-[var(--gray-500)]',
  'concluído': 'bg-success',
};

type Editing = { id: string; title: string; status: RoadmapItem['status']; quarter: string };

export function Roadmap() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: roadmap, isLoading, isError } = useRoadmap(projectId);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Editing | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(item: RoadmapItem, quarter: string) {
    setEditing({ id: item.id, title: item.title, status: item.status, quarter });
    setDialogOpen(true);
  }

  return (
    <>
      <TopBar
        title={`Roadmap — ${activeProject?.name ?? 'Projeto'}`}
        subtitle="Próximos trimestres"
        icon={<ArrowRight size={20} />}
        iconTone="success"
        actions={<Button variant="secondary" onClick={openCreate}><Plus size={14} className="mr-1" /> Item</Button>}
      />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !roadmap ? (
          <ScreenError />
        ) : roadmap.length === 0 ? (
          <ScreenEmpty message="Nenhum item no roadmap. Adicione com “+ Item”." />
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {roadmap.map((r) => (
              <div key={r.quarter} className="bg-surface border border-border rounded-md p-[18px] flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-bold text-primary">{r.quarter}</span>
                  <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                  {r.items.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => openEdit(it, r.quarter)}
                      className="group flex gap-2.5 items-start text-[13px] text-secondary leading-relaxed cursor-pointer hover:text-primary"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${bulletColor[it.status]}`} />
                      <span className="flex-1">{it.title}</span>
                      <Pencil size={12} className="opacity-0 group-hover:opacity-100 mt-0.5 shrink-0 text-tertiary" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <RoadmapDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} editing={editing} />
    </>
  );
}
