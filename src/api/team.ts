import { supabase } from '@/lib/supabase';
import { type TeamMember } from '@/lib/data';

export async function fetchTeam(projectId: string): Promise<TeamMember[]> {
  const { data: members, error } = await supabase
    .from('project_members')
    .select('user_id, role')
    .eq('project_id', projectId);

  if (error) throw error;

  const team: TeamMember[] = [];
  for (const m of members ?? []) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', m.user_id)
      .single();

    // Conta tarefas atribuídas a este membro
    const name = (profile?.name as string) ?? '—';
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .contains('assignee_names', [name]);

    team.push({ name, role: m.role as string, tasks: count ?? 0 });
  }

  return team;
}
