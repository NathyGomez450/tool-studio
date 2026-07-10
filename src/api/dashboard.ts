import { supabase } from '@/lib/supabase';
import { type DashboardData } from '@/lib/data';

export async function fetchDashboard(projectId: string): Promise<DashboardData> {
  const [tasksRes, bugsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('bugs')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('severity', 'critical')
      .neq('status', 'corrigido'),
  ]);

  const totalTasks = tasksRes.count ?? 0;
  const critBugs = bugsRes.count ?? 0;

  return {
    stats: [
      { label: 'Tarefas abertas', value: String(totalTasks) },
      { label: 'Bugs críticos', value: String(critBugs) },
      { label: 'Sprint atual', value: '—' },
      { label: 'Marcos no prazo', value: '—' },
    ],
    sprint: [],
    activity: [],
  };
}
