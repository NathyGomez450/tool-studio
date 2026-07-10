import { supabase } from '@/lib/supabase';
import { type TeamMember } from '@/lib/data';

type DbTeam = {
  id: string;
  name: string;
  role: string;
  tasks: number;
};

function dbTeamToMember(m: DbTeam): TeamMember {
  return {
    name: m.name,
    role: m.role,
    tasks: m.tasks,
  };
}

export async function fetchTeam(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('*');

  if (error) throw error;
  return (data ?? []).map(dbTeamToMember);
}
