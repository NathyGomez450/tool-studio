import { supabase } from '@/lib/supabase';
import { type Column, type Task } from '@/lib/data';

type DbTask = {
  id: string;
  title: string;
  priority: string;
  tags: string[];
  assignees: string[];
  comments: number;
  column_id: string;
  position: number;
};

type DbColumn = {
  id: string;
  key: string;
  label: string;
  position: number;
};

function dbTaskToTask(t: DbTask): Task {
  return {
    id: t.id,
    title: t.title,
    priority: t.priority as Task['priority'],
    tags: t.tags ?? [],
    assignees: t.assignees ?? [],
    comments: t.comments ?? 0,
  };
}

export async function fetchColumns(): Promise<Column[]> {
  const { data: dbColumns, error: colErr } = await supabase
    .from('kanban_columns')
    .select('*')
    .order('position');

  if (colErr) throw colErr;

  const { data: dbTasks, error: taskErr } = await supabase
    .from('tasks')
    .select('*')
    .order('position');

  if (taskErr) throw taskErr;

  const taskMap = new Map<string, DbTask[]>();
  for (const t of dbTasks ?? []) {
    const arr = taskMap.get(t.column_id) ?? [];
    arr.push(t);
    taskMap.set(t.column_id, arr);
  }

  return (dbColumns ?? []).map((col) => ({
    key: col.key,
    label: col.label,
    tasks: (taskMap.get(col.id) ?? []).map(dbTaskToTask),
  }));
}

export async function createTask(input: {
  title: string;
  priority: Task['priority'];
  tag?: string;
}): Promise<Task> {
  const { data: backlogCol, error: colErr } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('key', 'backlog')
    .single();

  if (colErr || !backlogCol) throw new Error('Coluna backlog não encontrada');

  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('column_id', backlogCol.id);

  const taskData = {
    id: `TASK-${Date.now()}`,
    title: input.title,
    priority: input.priority,
    tags: input.tag ? [input.tag] : [],
    assignees: ['Marina Souza'],
    comments: 0,
    column_id: backlogCol.id,
    position: count ?? 0,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(taskData)
    .select()
    .single();

  if (error) throw error;
  return dbTaskToTask(data);
}

export async function moveTask(input: {
  taskId: string;
  toColumnKey: string;
  toIndex: number;
}): Promise<void> {
  const { data: toCol, error: colErr } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('key', input.toColumnKey)
    .single();

  if (colErr || !toCol) throw new Error(`Coluna ${input.toColumnKey} não encontrada`);

  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('column_id', toCol.id);

  const position = Math.max(0, Math.min(input.toIndex, count ?? 0));

  const { error } = await supabase
    .from('tasks')
    .update({ column_id: toCol.id, position })
    .eq('id', input.taskId);

  if (error) throw error;
}

export async function updateTask(input: {
  taskId: string;
  title: string;
  priority: Task['priority'];
  tags: string[];
}): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      title: input.title,
      priority: input.priority,
      tags: input.tags,
    })
    .eq('id', input.taskId)
    .select()
    .single();

  if (error) throw error;
  return dbTaskToTask(data);
}

export async function deleteTask(input: { taskId: string }): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', input.taskId);

  if (error) throw error;
}
