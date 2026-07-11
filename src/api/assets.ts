import { supabase } from '@/lib/supabase';
import { type Asset } from '@/lib/data';
import { formatBytes } from '@/lib/utils';

function rowToAsset(a: Record<string, unknown>): Asset {
  return {
    id: a.id as string,
    name: a.name as string,
    type: (a.type as string) ?? '—',
    size: (a.size as string) ?? '—',
    by: (a.by as string) ?? '—',
    url: (a.url as string) ?? '',
  };
}

export async function fetchAssets(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;
  return (data ?? []).map(rowToAsset);
}

export async function uploadAsset(
  projectId: string,
  file: File,
  opts: { type: string },
): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const by = (u.user?.user_metadata?.name as string) || u.user?.email || '—';
  const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;

  const up = await supabase.storage.from('assets').upload(path, file);
  if (up.error) throw up.error;

  const { data: pub } = supabase.storage.from('assets').getPublicUrl(path);

  const { error } = await supabase.from('assets').insert({
    project_id: projectId,
    name: file.name,
    type: opts.type,
    size: formatBytes(file.size),
    by,
    url: pub.publicUrl,
  });
  if (error) throw error;
}

export async function deleteAsset(_projectId: string, input: { id: string; url: string }): Promise<void> {
  const marker = '/assets/';
  const idx = input.url.indexOf(marker);
  if (idx >= 0) {
    const path = decodeURIComponent(input.url.slice(idx + marker.length));
    await supabase.storage.from('assets').remove([path]);
  }
  const { error } = await supabase.from('assets').delete().eq('id', input.id);
  if (error) throw error;
}
