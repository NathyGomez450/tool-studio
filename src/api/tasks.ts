import { supabase } from '@/lib/supabase';
import { type Column, type Task } from '@/lib/data';

function rowToTask(t: Record<string, unknown>): Task {
  return {
    id: t.id as string,
    displayId: (t.display_id as string) ?? (t.id as string).slice(0, 8),
    title: t.title as string,
    priority: t.priority as Task['priority'],
    tags: (t.tags as string[]) ?? [],
    assignees: (t.assignee_names as string[]) ?? [],
    comments: (t.comments_count as number) ?? 0,
  };
}

export async function fetchColumns(projectId: string): Promise<Column[]> {
  const { data: cols, error: colsErr } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('project_id', projectId)
    .order('position');

  if (colsErr) throw colsErr;

  const { data: rows, error: tasksErr } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('position');

  if (tasksErr) throw tasksErr;

  const byCol = new Map<string, Task[]>();
  for (const r of rows ?? []) {
    const cid = r.column_id as string;
    if (!byCol.has(cid)) byCol.set(cid, []);
    byCol.get(cid)!.push(rowToTask(r));
  }

  return (cols ?? []).map((c) => ({
    key: c.key as string,
    label: c.title as string,
    tasks: byCol.get(c.id as string) ?? [],
  }));
}

export async function createTask(
  projectId: string,
  input: { title: string; priority: Task['priority']; tag?: string },
): Promise<Task> {
  const { data: backlog } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('project_id', projectId)
    .eq('key', 'backlog')
    .single();

  if (!backlog) throw new Error('Coluna Backlog não encontrada');

  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('column_id', backlog.id);

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      column_id: backlog.id,
      title: input.title,
      priority: input.priority,
      tags: input.tag ? [input.tag] : [],
      assignee_names: [],
      position: count ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToTask(data);
}

export async function moveTask(
  projectId: string,
  input: { taskId: string; toColumnKey: string; toIndex: number },
): Promise<void> {
  const { data: toCol } = await supabase
    .from('kanban_columns')
    .select('id')
    .eq('project_id', projectId)
    .eq('key', input.toColumnKey)
    .single();

  if (!toCol) return;

  const { error } = await supabase
    .from('tasks')
    .update({ column_id: toCol.id, position: input.toIndex })
    .eq('id', input.taskId);

  if (error) throw error;
}

export async function updateTask(
  projectId: string,
  input: { taskId: string; title: string; priority: Task['priority']; tags: string[] },
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ title: input.title, priority: input.priority, tags: input.tags })
    .eq('id', input.taskId)
    .select()
    .single();

  if (error) throw error;
  return rowToTask(data);
}

export async function deleteTask(_projectId: string, input: { taskId: string }): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', input.taskId);
  if (error) throw error;
}
