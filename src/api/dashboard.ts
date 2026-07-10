import { supabase } from '@/lib/supabase';
import { type DashboardData } from '@/lib/data';

export async function fetchDashboard(): Promise<DashboardData> {
  const [tasksRes, bugsRes] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('bugs').select('*'),
  ]);

  if (tasksRes.error) throw tasksRes.error;
  if (bugsRes.error) throw bugsRes.error;

  const totalTasks = tasksRes.count ?? 0;
  const bugs = bugsRes.data ?? [];
  const criticalBugs = bugs.filter((b) => b.severity === 'critical').length;

  const stats = [
    { label: 'Tarefas abertas', value: String(totalTasks) },
    { label: 'Bugs críticos', value: String(criticalBugs) },
    { label: 'Sprint atual', value: totalTasks > 0 ? `${Math.round((bugs.filter((b) => b.status === 'corrigido').length / Math.max(bugs.length, 1)) * 100)}%` : '0%' },
    { label: 'Bugs corrigidos', value: `${bugs.filter((b) => b.status === 'corrigido').length}/${bugs.length}` },
  ];

  // Sprint e activity ficam vazios — só dados reais do banco
  const sprint: { label: string; value: number }[] = [];
  const activity: { who: string; what: string; when: string }[] = [];

  return { stats, sprint, activity };
}
