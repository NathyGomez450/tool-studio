import { supabase } from '@/lib/supabase';
import { type BrainstormNote, type BrainstormEdge, type NoteComment } from '@/lib/data';
import { formatTimeAgo } from '@/lib/utils';

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
): Promise<BrainstormNote> {
  const { data, error } = await supabase
    .from('brainstorm_notes')
    .insert({ project_id: projectId, text: input.text, color: input.color, x: input.x, y: input.y })
    .select()
    .single();
  if (error) throw error;
  return rowToNote(data);
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

// ---- Conexões (mapa mental) ----

export async function fetchBrainstormEdges(projectId: string): Promise<BrainstormEdge[]> {
  const { data, error } = await supabase
    .from('brainstorm_edges')
    .select('id, source, target, label')
    .eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []).map((e) => ({
    id: e.id as string,
    source: e.source as string,
    target: e.target as string,
    label: (e.label as string) ?? undefined,
  }));
}

export async function updateBrainstormEdge(_projectId: string, input: { id: string; label: string }): Promise<void> {
  const { error } = await supabase.from('brainstorm_edges').update({ label: input.label }).eq('id', input.id);
  if (error) throw error;
}

// ---- Comentários por nota ----

export async function fetchNoteComments(noteId: string): Promise<NoteComment[]> {
  const { data, error } = await supabase
    .from('brainstorm_comments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    author: (c.author_name as string) ?? '—',
    text: c.text as string,
    when: formatTimeAgo(c.created_at as string),
  }));
}

export async function addNoteComment(projectId: string, input: { noteId: string; text: string }): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const author = (u.user?.user_metadata?.name as string) || u.user?.email || '—';
  const { error } = await supabase.from('brainstorm_comments').insert({
    project_id: projectId,
    note_id: input.noteId,
    author_id: u.user?.id,
    author_name: author,
    text: input.text,
  });
  if (error) throw error;
}

export async function createBrainstormEdge(
  projectId: string,
  input: { source: string; target: string },
): Promise<void> {
  const { error } = await supabase
    .from('brainstorm_edges')
    .insert({ project_id: projectId, source: input.source, target: input.target });
  if (error) throw error;
}

export async function deleteBrainstormEdge(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('brainstorm_edges').delete().eq('id', input.id);
  if (error) throw error;
}
