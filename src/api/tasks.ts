import { fake } from './client';
import { db, nextTaskId, persist } from './db';
import { type Column, type Task } from '@/lib/data';

export function fetchColumns(): Promise<Column[]> {
  return fake(db.columns);
}

export async function createTask(input: {
  title: string;
  priority: Task['priority'];
  tag?: string;
}): Promise<Task> {
  const task: Task = {
    id: nextTaskId(),
    title: input.title,
    priority: input.priority,
    tags: input.tag ? [input.tag] : [],
    assignees: ['Marina Souza'],
    comments: 0,
  };
  const backlog = db.columns.find((c) => c.key === 'backlog');
  if (backlog) backlog.tasks.push(task);
  return persist(task);
}

export async function moveTask(input: { taskId: string; toColumnKey: string; toIndex: number }): Promise<void> {
  const from = db.columns.find((c) => c.tasks.some((t) => t.id === input.taskId));
  const to = db.columns.find((c) => c.key === input.toColumnKey);
  if (!from || !to) {
    await persist(null);
    return;
  }
  const fromIdx = from.tasks.findIndex((t) => t.id === input.taskId);
  const [task] = from.tasks.splice(fromIdx, 1);
  const idx = Math.max(0, Math.min(input.toIndex, to.tasks.length));
  to.tasks.splice(idx, 0, task);
  await persist(null);
}

export async function updateTask(input: {
  taskId: string;
  title: string;
  priority: Task['priority'];
  tags: string[];
}): Promise<Task> {
  let found: Task | undefined;
  for (const col of db.columns) {
    const t = col.tasks.find((x) => x.id === input.taskId);
    if (t) {
      t.title = input.title;
      t.priority = input.priority;
      t.tags = input.tags;
      found = t;
      break;
    }
  }
  if (!found) throw new Error(`Task ${input.taskId} não encontrada`);
  return persist(found);
}

export async function deleteTask(input: { taskId: string }): Promise<void> {
  const col = db.columns.find((c) => c.tasks.some((t) => t.id === input.taskId));
  if (col) {
    const idx = col.tasks.findIndex((t) => t.id === input.taskId);
    col.tasks.splice(idx, 1);
  }
  await persist(null);
}
