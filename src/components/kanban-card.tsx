import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '@/components/ui/avatar';
import { cn, hueFor } from '@/lib/utils';
import type { Task } from '@/lib/data';

const priorityColor: Record<Task['priority'], string> = {
  low: 'var(--gray-400)',
  medium: 'var(--blue-400)',
  high: 'var(--amber-400)',
  critical: 'var(--red-400)',
};

export function KanbanCard({ task, className, onEdit }: { task: Task; className?: string; onEdit?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderLeft: `3px solid ${priorityColor[task.priority]}`,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-surface border border-border rounded-md p-3 flex flex-col gap-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-border-strong transition-colors',
        className,
      )}
    >
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] text-tertiary">{task.displayId}</span>
      </div>
      <div className="text-[13px] font-medium text-primary leading-snug">{task.title}</div>
      {task.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {task.tags.map((t) => {
            const hue = hueFor(t);
            return (
              <span
                key={t}
                className="text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5"
                style={{ color: `oklch(0.78 0.10 ${hue})`, backgroundColor: `oklch(0.65 0.14 ${hue} / 0.15)` }}
              >
                {t}
              </span>
            );
          })}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex">
          {task.assignees.map((n, i) => (
            <div key={n} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar name={n} size={22} />
            </div>
          ))}
        </div>
        {task.comments > 0 && <span className="text-[11px] text-tertiary font-mono">💬 {task.comments}</span>}
      </div>
    </div>
  );
}
