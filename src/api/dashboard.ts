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
  const resolvedBugs = bugs.filter((b) => b.status === 'corrigido').length;

  const stats = [
    { label: 'Tarefas abertas', value: String(totalTasks) },
    { label: 'Bugs críticos', value: String(criticalBugs) },
    { label: 'Sprint atual', value: '64%' },
    { label: 'Marcos no prazo', value: '5/6' },
  ];

  const sprint = [
    { label: 'Mecânicas de corrida', value: 80 },
    { label: 'UI de progressão', value: 45 },
    { label: 'Sistema de loja', value: 20 },
  ];

  const activity = [
    { who: 'Carlos Dias', what: 'moveu BUG-2231 para Em Revisão', when: 'há 12 min' },
    { who: 'Léo Ramos', what: 'comentou em TASK-142', when: 'há 40 min' },
    { who: 'Marina Souza', what: 'concluiu TASK-138', when: 'há 1h' },
    { who: 'Ana Prado', what: 'adicionou nova página ao GDD: Progressão', when: 'há 3h' },
  ];

  return { stats, sprint, activity };
}
