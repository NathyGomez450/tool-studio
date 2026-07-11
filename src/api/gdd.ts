import { supabase } from '@/lib/supabase';
import { type GddSection } from '@/lib/data';

function rowToSection(s: Record<string, unknown>): GddSection {
  return {
    id: s.id as string,
    key: (s.key as string) ?? (s.id as string),
    label: (s.label as string) ?? (s.title as string),
    title: s.title as string,
    body: (s.body as string) ?? '',
  };
}

export async function fetchGddSections(projectId: string): Promise<GddSection[]> {
  const { data, error } = await supabase
    .from('gdd_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('key');

  if (error) throw error;
  return (data ?? []).map(rowToSection);
}

export async function createGddSection(
  projectId: string,
  input: { title: string; body: string },
): Promise<GddSection> {
  const key = crypto.randomUUID();
  const { data, error } = await supabase
    .from('gdd_sections')
    .insert({ project_id: projectId, key, label: input.title, title: input.title, body: input.body })
    .select()
    .single();

  if (error) throw error;
  return rowToSection(data);
}

export async function updateGddSection(
  _projectId: string,
  input: { id: string; title: string; body: string },
): Promise<GddSection> {
  const { data, error } = await supabase
    .from('gdd_sections')
    .update({ title: input.title, label: input.title, body: input.body })
    .eq('id', input.id)
    .select()
    .single();

  if (error) throw error;
  return rowToSection(data);
}

export async function deleteGddSection(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('gdd_sections').delete().eq('id', input.id);
  if (error) throw error;
}

/** Sobe uma imagem usada no corpo do GDD e devolve a URL pública (bucket assets, pasta gdd/). */
export async function uploadGddImage(projectId: string, file: File): Promise<string> {
  const path = `${projectId}/gdd/${crypto.randomUUID()}-${file.name}`;
  const up = await supabase.storage.from('assets').upload(path, file);
  if (up.error) throw up.error;
  const { data } = supabase.storage.from('assets').getPublicUrl(path);
  return data.publicUrl;
}
