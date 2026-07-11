import * as React from 'react';
import { Kanban as KanbanIcon } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { KanbanCard } from '@/components/kanban-card';
import { useColumns } from '@/queries/hooks';
import { useMoveTask } from '@/queries/mutations';
import { queryKeys } from '@/queries/keys';
import { ScreenLoading, ScreenError, ScreenEmpty } from '@/components/screen-state';
import { TaskDialog } from '@/components/dialogs/task-dialog';
import { Select } from '@/components/ui/select';
import { FilterBar } from '@/components/filter-bar';
import { useFilterStore } from '@/stores/filter-store';
import { moveTaskInColumns, findColumnKey, findTaskById } from '@/lib/reorder';
import { cn } from '@/lib/utils';
import { type Column, type Task } from '@/lib/data';
import { useAuth } from '@/auth/auth-context';

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'Todas prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

function KanbanColumn({ col, onEditTask }: { col: Column; onEditTask: (task: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={cn('w-[250px] flex flex-col gap-2.5 shrink-0 rounded-lg transition-colors', isOver && 'bg-[var(--bg-hover)]')}
    >
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wide">{col.label}</span>
        <span className="text-[11px] font-mono text-disabled">{col.tasks.length}</span>
      </div>
      <SortableContext items={col.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 min-h-[60px]">
          {col.tasks.map((t) => (
            <KanbanCard key={t.id} task={t} onEdit={() => onEditTask(t)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

type DialogState = null | { mode: 'create' } | { mode: 'edit'; task: Task };

export function KanbanBoard() {
  const { activeProject } = useAuth();
  const projectId = activeProject?.id ?? '';
  const { data: columns, isLoading, isError } = useColumns(projectId);
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const moveTask = useMoveTask(projectId);
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const keys = queryKeys(projectId);

  const filter = useFilterStore((s) => s.kanban);
  const setFilter = useFilterStore((s) => s.setKanbanFilter);
  const clearFilter = useFilterStore((s) => s.clearKanban);

  const allTags = Array.from(new Set((columns ?? []).flatMap((c) => c.tasks.flatMap((t) => t.tags)))).sort();
  const allAssignees = Array.from(new Set((columns ?? []).flatMap((c) => c.tasks.flatMap((t) => t.assignees)))).sort();

  function matchTask(t: Task): boolean {
    const q = filter.text.trim().toLowerCase();
    if (q && !`${t.title} ${t.displayId}`.toLowerCase().includes(q)) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.tag && !t.tags.includes(filter.tag)) return false;
    if (filter.assignee && !t.assignees.includes(filter.assignee)) return false;
    return true;
  }

  const displayColumns = columns?.map((c) => ({ ...c, tasks: c.tasks.filter(matchTask) }));
  const hasActiveFilter = !!(filter.text || filter.priority || filter.tag || filter.assignee);
  const totalTasks = displayColumns?.reduce((sum, c) => sum + c.tasks.length, 0) ?? 0;

  function handleDragStart(event: DragStartEvent) {
    if (!columns) return;
    setActiveTask(findTaskById(columns, event.active.id as string));
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (!overId || !columns) return;
    const activeId = event.active.id as string;
    const fromKey = findColumnKey(columns, activeId);
    const toKey = findColumnKey(columns, overId);
    if (!fromKey || !toKey || fromKey === toKey) return;
    const result = moveTaskInColumns(columns, activeId, overId);
    if (result) qc.setQueryData(keys.columns, result.columns);
  }

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id as string | undefined;
    setActiveTask(null);
    if (!overId || !columns) return;
    const activeId = event.active.id as string;
    const result = moveTaskInColumns(columns, activeId, overId);
    if (!result) return;
    qc.setQueryData(keys.columns, result.columns);
    moveTask.mutate({ taskId: activeId, toColumnKey: result.toColumnKey, toIndex: result.toIndex });
  }

  return (
    <>
      <TopBar
        title={`Kanban — ${activeProject?.name ?? 'Projeto'}`}
        subtitle={`${totalTasks} tarefas ativas`}
        icon={<KanbanIcon size={20} />}
        iconTone="info"
        actions={<Button onClick={() => setDialog({ mode: 'create' })}>+ Nova tarefa</Button>}
      />
      <FilterBar
        search={filter.text}
        onSearch={(v) => setFilter({ text: v })}
        onClear={clearFilter}
        hasActiveFilter={hasActiveFilter}
      >
        <Select
          className="w-[170px]"
          options={PRIORITY_FILTER_OPTIONS}
          value={filter.priority}
          onChange={(e) => setFilter({ priority: e.target.value })}
        />
        <Select
          className="w-[150px]"
          options={[{ value: '', label: 'Todas tags' }, ...allTags.map((t) => ({ value: t, label: t }))]}
          value={filter.tag}
          onChange={(e) => setFilter({ tag: e.target.value })}
        />
        <Select
          className="w-[170px]"
          options={[{ value: '', label: 'Todos responsáveis' }, ...allAssignees.map((a) => ({ value: a, label: a }))]}
          value={filter.assignee}
          onChange={(e) => setFilter({ assignee: e.target.value })}
        />
      </FilterBar>
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !columns ? (
          <ScreenError />
        ) : totalTasks === 0 ? (
          <ScreenEmpty message="Nenhuma tarefa encontrada." />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max h-full">
              {displayColumns!.map((col) => (
                <KanbanColumn key={col.key} col={col} onEditTask={(task) => setDialog({ mode: 'edit', task })} />
              ))}
            </div>
            <DragOverlay>{activeTask ? <KanbanCard task={activeTask} /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>
      <TaskDialog
        open={dialog !== null}
        task={dialog?.mode === 'edit' ? dialog.task : undefined}
        projectId={projectId}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
      />
    </>
  );
}
