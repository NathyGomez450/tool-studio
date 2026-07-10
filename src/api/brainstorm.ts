import { supabase } from '@/lib/supabase';
import { type BrainstormNote } from '@/lib/data';

export async function fetchBrainstormNotes(projectId: string): Promise<BrainstormNote[]> {
  const { data, error } = await supabase
    .from('brainstorm_notes')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;

  return (data ?? []).map((n) => ({
    text: n.title as string,
    color: (n.color as string) ?? 'accent',
    x: (n.x as number) ?? 0,
    y: (n.y as number) ?? 0,
  }));
}
