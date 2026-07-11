import { supabase } from '@/lib/supabase';
import { type Bug, type BugComment } from '@/lib/data';
import { formatTimeAgo } from '@/lib/utils';

function rowToBug(b: Record<string, unknown>): Bug {
  return {
    id: b.id as string,
    displayId: (b.display_id as string) ?? (b.id as string).slice(0, 8),
    title: b.title as string,
    severity: b.severity as Bug['severity'],
    status: b.status as Bug['status'],
    assignee: (b.assignee as string) ?? '—',
    when: formatTimeAgo(b.created_at as string),
  };
}

export async function fetchBugs(projectId: string): Promise<Bug[]> {
  const { data, error } = await supabase
    .from('bugs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToBug);
}

export async function createBug(
  projectId: string,
  input: { title: string; severity: Bug['severity'] },
): Promise<Bug> {
  const { data, error } = await supabase
    .from('bugs')
    .insert({
      project_id: projectId,
      title: input.title,
      severity: input.severity,
      status: 'aberto',
    })
    .select()
    .single();

  if (error) throw error;
  return rowToBug(data);
}

export async function updateBugStatus(
  _projectId: string,
  input: { bugId: string; status: Bug['status'] },
): Promise<Bug> {
  const { data, error } = await supabase
    .from('bugs')
    .update({ status: input.status })
    .eq('id', input.bugId)
    .select()
    .single();

  if (error) throw error;
  return rowToBug(data);
}

export async function updateBug(
  _projectId: string,
  input: { bugId: string; title: string; severity: Bug['severity'] },
): Promise<Bug> {
  const { data, error } = await supabase
    .from('bugs')
    .update({ title: input.title, severity: input.severity })
    .eq('id', input.bugId)
    .select()
    .single();

  if (error) throw error;
  return rowToBug(data);
}

export async function deleteBug(_projectId: string, input: { bugId: string }): Promise<void> {
  const { error } = await supabase.from('bugs').delete().eq('id', input.bugId);
  if (error) throw error;
}

export async function updateBugAssignee(
  _projectId: string,
  input: { bugId: string; assignee: string },
): Promise<Bug> {
  const { data, error } = await supabase
    .from('bugs')
    .update({ assignee: input.assignee })
    .eq('id', input.bugId)
    .select()
    .single();
  if (error) throw error;
  return rowToBug(data);
}

// ---- Comentários ----

export async function fetchBugComments(bugId: string): Promise<BugComment[]> {
  const { data, error } = await supabase
    .from('bug_comments')
    .select('*')
    .eq('bug_id', bugId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id as string,
    author: (c.author_name as string) ?? '—',
    text: c.text as string,
    when: formatTimeAgo(c.created_at as string),
  }));
}

export async function addBugComment(projectId: string, input: { bugId: string; text: string }): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const author = (u.user?.user_metadata?.name as string) || u.user?.email || '—';
  const { error } = await supabase.from('bug_comments').insert({
    project_id: projectId,
    bug_id: input.bugId,
    author_id: u.user?.id,
    author_name: author,
    text: input.text,
  });
  if (error) throw error;
}
