import { supabase } from '@/lib/supabase';
import { type Asset } from '@/lib/data';

export async function fetchAssets(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((a) => ({
    name: a.name as string,
    type: (a.type as string) ?? '—',
    size: (a.size as string) ?? '—',
    by: (a.uploaded_by as string) ?? '—',
  }));
}
