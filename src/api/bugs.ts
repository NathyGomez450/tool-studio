import { supabase } from '@/lib/supabase';
import { type Bug } from '@/lib/data';

type DbBug = {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignee: string;
  when: string;
};

function dbBugToBug(b: DbBug): Bug {
  return {
    id: b.id,
    title: b.title,
    severity: b.severity as Bug['severity'],
    status: b.status as Bug['status'],
    assignee: b.assignee,
    when: b.when,
  };
}

export async function fetchBugs(): Promise<Bug[]> {
  const { data, error } = await supabase
    .from('bugs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(dbBugToBug);
}

export async function createBug(input: {
  title: string;
  severity: Bug['severity'];
}): Promise<Bug> {
  const bugData = {
    id: `BUG-${Date.now()}`,
    title: input.title,
    severity: input.severity,
    status: 'aberto',
    assignee: 'Marina Souza',
    when: 'agora',
  };

  const { data, error } = await supabase
    .from('bugs')
    .insert(bugData)
    .select()
    .single();

  if (error) throw error;
  return dbBugToBug(data);
}

export async function updateBugStatus(input: {
  bugId: string;
  status: Bug['status'];
}): Promise<Bug> {
  const { data, error } = await supabase
    .from('bugs')
    .update({ status: input.status })
    .eq('id', input.bugId)
    .select()
    .single();

  if (error) throw error;
  return dbBugToBug(data);
}

export async function updateBug(input: {
  bugId: string;
  title: string;
  severity: Bug['severity'];
}): Promise<Bug> {
  const { data, error } = await supabase
    .from('bugs')
    .update({
      title: input.title,
      severity: input.severity,
    })
    .eq('id', input.bugId)
    .select()
    .single();

  if (error) throw error;
  return dbBugToBug(data);
}

export async function deleteBug(input: { bugId: string }): Promise<void> {
  const { error } = await supabase
    .from('bugs')
    .delete()
    .eq('id', input.bugId);

  if (error) throw error;
}
