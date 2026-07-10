import { supabase } from '@/lib/supabase';
import { type BrainstormNote } from '@/lib/data';

function rowToNote(n: Record<string, unknown>): BrainstormNote {
  return {
    id: n.id as string,
    text: n.text as string,
    color: (n.color as string) ?? 'accent',
    x: (n.x as number) ?? 0,
    y: (n.y as number) ?? 0,
  };
}

export async function fetchBrainstormNotes(projectId: string): Promise<BrainstormNote[]> {
  const { data, error } = await supabase
    .from('brainstorm_notes')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;
  return (data ?? []).map(rowToNote);
}

export async function createBrainstormNote(
  projectId: string,
  input: { text: string; color: string; x: number; y: number },
): Promise<void> {
  const { error } = await supabase
    .from('brainstorm_notes')
    .insert({ project_id: projectId, text: input.text, color: input.color, x: input.x, y: input.y });
  if (error) throw error;
}

export async function updateBrainstormNote(
  _projectId: string,
  input: { id: string; text?: string; color?: string; x?: number; y?: number },
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.text !== undefined) patch.text = input.text;
  if (input.color !== undefined) patch.color = input.color;
  if (input.x !== undefined) patch.x = input.x;
  if (input.y !== undefined) patch.y = input.y;
  const { error } = await supabase.from('brainstorm_notes').update(patch).eq('id', input.id);
  if (error) throw error;
}

export async function deleteBrainstormNote(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('brainstorm_notes').delete().eq('id', input.id);
  if (error) throw error;
}
