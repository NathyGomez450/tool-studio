import * as React from 'react';
import { ArrowRight, Plus, Pencil } from 'lucide-react';
import { TopBar } from '@/components/top-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type RoadmapItem, type RoadmapStatus, type RoadmapBucket } from '@/lib/data';
import { useRoadmap } from '@/queries/hooks';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { RoadmapDialog, type RoadmapEditing } from '@/components/dialogs/roadmap-dialog';
import { useAuth } from '@/auth/auth-context';

const statusTone: Record<RoadmapStatus, any> = { 'em andamento': 'accent', planejado: 'neutral', 'concluído': 'success' };
const bulletColor: Record<RoadmapStatus, string> = {
  'em andamento': 'bg-accent',
  planejado: 'bg-[var(--gray-500)]',
  'concluído': 'bg-success',
};

type ViewMode = 'quarter' | 'bucket';

function deriveStatus(items: RoadmapItem[]): RoadmapStatus {
  if (items.some((i) => i.status === 'em andamento')) return 'em andamento';
  if (items.length > 0 && items.every((i) => i.status === 'concluído')) return 'concluído';
  return 'planejado';
}

const BUCKET_LABEL: Record<string, string> = { now: 'Agora', next: 'Próximo', later: 'Futuro', none: 'Sem categoria' };

export function Roadmap() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: items, isLoading, isError } = useRoadmap(projectId);
  const [view, setView] = React.useState<ViewMode>('quarter');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RoadmapEditing | undefined>(undefined);

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(item: RoadmapItem) {
    setEditing({
      id: item.id,
      title: item.title,
      status: item.status,
      quarter: item.quarter,
      bucket: item.bucket,
      description: item.description,
      assignee: item.assignee,
    });
    setDialogOpen(true);
  }

  // Agrupamento conforme a visão
  const columns = React.useMemo(() => {
    const list = items ?? [];
    if (view === 'quarter') {
      const byQ = new Map<string, RoadmapItem[]>();
      for (const it of list) {
        const q = it.quarter || 'Sem trimestre';
        if (!byQ.has(q)) byQ.set(q, []);
        byQ.get(q)!.push(it);
      }
      return Array.from(byQ.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, its]) => ({ label, badge: deriveStatus(its) as RoadmapStatus | null, items: its }));
    }
    // bucket view
    const buckets: (RoadmapBucket | 'none')[] = ['now', 'next', 'later'];
    const hasNone = list.some((i) => !i.bucket);
    const order: (RoadmapBucket | 'none')[] = hasNone ? [...buckets, 'none'] : buckets;
    return order.map((key) => ({
      label: BUCKET_LABEL[key ?? 'none'],
      badge: null,
      items: list.filter((i) => (key === 'none' ? !i.bucket : i.bucket === key)),
    }));
  }, [items, view]);

  const toggle = (
    <div className="flex items-center rounded-md border border-border-subtle overflow-hidden text-[12px]">
      <button
        type="button"
        onClick={() => setView('quarter')}
        className={`px-2.5 py-1.5 ${view === 'quarter' ? 'bg-[var(--bg-active)] text-primary' : 'text-tertiary hover:text-primary'}`}
      >
        Trimestre
      </button>
      <button
        type="button"
        onClick={() => setView('bucket')}
        className={`px-2.5 py-1.5 border-l border-border-subtle ${view === 'bucket' ? 'bg-[var(--bg-active)] text-primary' : 'text-tertiary hover:text-primary'}`}
      >
        Now / Next / Later
      </button>
    </div>
  );

  return (
    <>
      <TopBar
        title={`Roadmap — ${activeProject?.name ?? 'Projeto'}`}
        subtitle="Próximos passos"
        icon={<ArrowRight size={20} />}
        iconTone="success"
        actions={
          <div className="flex items-center gap-2">
            {toggle}
            <Button variant="secondary" onClick={openCreate}><Plus size={14} className="mr-1" /> Item</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !items ? (
          <ScreenError />
        ) : items.length === 0 ? (
          <ScreenEmpty message="Nenhum item no roadmap. Adicione com “+ Item”." />
        ) : (
          <div className="grid grid-cols-3 gap-4 items-start">
            {columns.map((col) => (
              <div key={col.label} className="bg-surface border border-border rounded-md p-[18px] flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[15px] font-bold text-primary">{col.label}</span>
                  {col.badge && <Badge tone={statusTone[col.badge]}>{col.badge}</Badge>}
                </div>
                <div className="flex flex-col gap-2.5">
                  {col.items.length === 0 && <span className="text-[12px] text-disabled">—</span>}
                  {col.items.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => openEdit(it)}
                      className="group flex gap-2.5 items-start rounded-md p-1.5 -mx-1.5 cursor-pointer hover:bg-[var(--bg-hover)]"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${bulletColor[it.status]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] text-secondary leading-relaxed flex-1">{it.title}</span>
                          <Pencil size={12} className="opacity-0 group-hover:opacity-100 shrink-0 text-tertiary" />
                        </div>
                        {it.description && (
                          <p className="text-[11px] text-tertiary leading-snug line-clamp-2 mt-0.5">{it.description}</p>
                        )}
                        {it.assignee && it.assignee !== '—' && (
                          <span className="text-[10px] text-disabled">{it.assignee}</span>
                        )}
                      </div>
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
