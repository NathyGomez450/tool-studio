import { supabase } from '@/lib/supabase';
import { type DashboardData } from '@/lib/data';
import { formatTimeAgo } from '@/lib/utils';

function trunc(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

export async function fetchDashboard(projectId: string): Promise<DashboardData> {
  const [colsRes, tasksRes, bugsRes, roadmapRes, membersRes, bugCommentsRes, noteCommentsRes] = await Promise.all([
    supabase.from('kanban_columns').select('id, key, label, position').eq('project_id', projectId).order('position'),
    supabase.from('tasks').select('id, title, column_id, created_at').eq('project_id', projectId),
    supabase.from('bugs').select('id, title, status, created_at').eq('project_id', projectId),
    supabase.from('roadmap_items').select('status').eq('project_id', projectId),
    supabase.from('project_members').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('bug_comments').select('author_name, text, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(6),
    supabase.from('brainstorm_comments').select('author_name, text, created_at').eq('project_id', projectId).order('created_at', { ascending: false }).limit(6),
  ]);

  if (colsRes.error) throw colsRes.error;
  if (tasksRes.error) throw tasksRes.error;
  if (bugsRes.error) throw bugsRes.error;

  const cols = colsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const bugs = bugsRes.data ?? [];
  const roadmap = roadmapRes.data ?? [];
  const memberCount = membersRes.count ?? 0;

  const doneCol = cols.find((c) => c.key === 'done');
  const openTasks = tasks.filter((t) => t.column_id !== doneCol?.id).length;
  const openBugs = bugs.filter((b) => b.status !== 'corrigido').length;

  const rmDone = roadmap.filter((r) => r.status === 'concluído').length;
  const rmDoing = roadmap.filter((r) => r.status === 'em andamento').length;
  const rmPlanned = roadmap.filter((r) => r.status === 'planejado').length;
  const rmTotal = roadmap.length;

  const stats = [
    { label: 'Tarefas abertas', value: String(openTasks) },
    { label: 'Bugs abertos', value: String(openBugs) },
    { label: 'Roadmap concluído', value: rmTotal ? `${rmDone}/${rmTotal}` : '0' },
    { label: 'Membros', value: String(memberCount) },
  ];

  const kanban = cols.map((c) => ({ label: c.label as string, count: tasks.filter((t) => t.column_id === c.id).length }));

  type Raw = { who: string; what: string; at: string };
  const raw: Raw[] = [
    ...tasks.map((t) => ({ who: '', what: `Tarefa "${t.title}" criada`, at: t.created_at as string })),
    ...bugs.map((b) => ({ who: '', what: `Bug "${b.title}" reportado`, at: b.created_at as string })),
    ...(bugCommentsRes.data ?? []).map((c) => ({ who: (c.author_name as string) ?? 'Alguém', what: `comentou num bug: "${trunc(c.text as string)}"`, at: c.created_at as string })),
    ...(noteCommentsRes.data ?? []).map((c) => ({ who: (c.author_name as string) ?? 'Alguém', what: `comentou numa nota: "${trunc(c.text as string)}"`, at: c.created_at as string })),
  ];
  const activity = raw
    .filter((a) => a.at)
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8)
    .map((a) => ({ who: a.who, what: a.what, when: formatTimeAgo(a.at) }));

  return {
    stats,
    kanban,
    roadmap: { done: rmDone, doing: rmDoing, planned: rmPlanned, total: rmTotal },
    activity,
  };
}
