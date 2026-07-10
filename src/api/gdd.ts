import { supabase } from '@/lib/supabase';
import { type GddSection } from '@/lib/data';

export async function fetchGddSections(projectId: string): Promise<GddSection[]> {
  const { data, error } = await supabase
    .from('gdd_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('key');

  if (error) throw error;

  return (data ?? []).map((s) => ({
    key: (s.key as string) ?? s.id as string,
    label: (s.label as string) ?? (s.title as string),
    title: s.title as string,
    body: (s.body as string) ?? '',
  }));
}
