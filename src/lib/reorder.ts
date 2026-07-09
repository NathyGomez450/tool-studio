import { type Column, type Task } from '@/lib/data';

/** Retorna a key da coluna que contém a task `id`, ou a própria key se `id` já é uma coluna. */
export function findColumnKey(columns: Column[], id: string): string | null {
  if (columns.some((c) => c.key === id)) return id;
  const col = columns.find((c) => c.tasks.some((t) => t.id === id));
  return col ? col.key : null;
}

export function findTaskById(columns: Column[], id: string): Task | null {
  for (const c of columns) {
    const t = c.tasks.find((x) => x.id === id);
    if (t) return t;
  }
  return null;
}

/**
 * Calcula o novo arranjo movendo `activeId` para a posição de `overId`.
 * `overId` pode ser um id de task (posição relativa) ou uma key de coluna (append/coluna vazia).
 * Retorna o arranjo imutável + coluna/índice destino, ou null se nada muda / ids inválidos.
 */
export function moveTaskInColumns(
  columns: Column[],
  activeId: string,
  overId: string,
): { columns: Column[]; toColumnKey: string; toIndex: number } | null {
  const fromKey = findColumnKey(columns, activeId);
  const toKey = findColumnKey(columns, overId);
  if (!fromKey || !toKey) return null;

  const from = columns.find((c) => c.key === fromKey)!;
  const to = columns.find((c) => c.key === toKey)!;
  const fromIdx = from.tasks.findIndex((t) => t.id === activeId);
  if (fromIdx < 0) return null;

  const overIsColumn = columns.some((c) => c.key === overId);
  let toIndex = overIsColumn ? to.tasks.length : to.tasks.findIndex((t) => t.id === overId);
  if (toIndex < 0) toIndex = to.tasks.length;

  if (fromKey === toKey) {
    const insertIdx = fromIdx < toIndex ? toIndex - 1 : toIndex;
    if (insertIdx === fromIdx) return null;
    const newTasks = [...from.tasks];
    const [task] = newTasks.splice(fromIdx, 1);
    newTasks.splice(insertIdx, 0, task);
    const newColumns = columns.map((c) => (c.key === fromKey ? { ...c, tasks: newTasks } : c));
    return { columns: newColumns, toColumnKey: toKey, toIndex: insertIdx };
  }

  const task = from.tasks[fromIdx];
  const newFromTasks = from.tasks.filter((t) => t.id !== activeId);
  const newToTasks = [...to.tasks];
  const insertIdx = Math.max(0, Math.min(toIndex, newToTasks.length));
  newToTasks.splice(insertIdx, 0, task);
  const newColumns = columns.map((c) => {
    if (c.key === fromKey) return { ...c, tasks: newFromTasks };
    if (c.key === toKey) return { ...c, tasks: newToTasks };
    return c;
  });
  return { columns: newColumns, toColumnKey: toKey, toIndex: insertIdx };
}
