import { supabase } from '@/lib/supabase';
import { type GddSection, type GddAttachment } from '@/lib/data';
import { formatBytes } from '@/lib/utils';

function rowToSection(s: Record<string, unknown>): GddSection {
  return {
    id: s.id as string,
    key: (s.key as string) ?? (s.id as string),
    label: (s.label as string) ?? (s.title as string),
    title: s.title as string,
    body: (s.body as string) ?? '',
    attachments: (s.attachments as GddAttachment[]) ?? [],
  };
}

function docKind(name: string): GddAttachment['kind'] {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  return 'other';
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

/** Anexa um documento (PDF/DOCX) a uma seção — bucket PRIVADO 'docs'. */
export async function uploadGddDoc(projectId: string, sectionId: string, file: File): Promise<void> {
  const path = `${projectId}/gdd/${sectionId}/${crypto.randomUUID()}-${file.name}`;
  const up = await supabase.storage.from('docs').upload(path, file);
  if (up.error) throw up.error;

  const att: GddAttachment = { path, name: file.name, kind: docKind(file.name), size: formatBytes(file.size) };
  const { data: cur } = await supabase.from('gdd_sections').select('attachments').eq('id', sectionId).single();
  const list = ((cur?.attachments as GddAttachment[]) ?? []);
  const { error } = await supabase.from('gdd_sections').update({ attachments: [...list, att] }).eq('id', sectionId);
  if (error) throw error;
}

/** Remove um documento anexado de uma seção (Storage + registro). */
export async function removeGddDoc(_projectId: string, sectionId: string, path: string): Promise<void> {
  await supabase.storage.from('docs').remove([path]);
  const { data: cur } = await supabase.from('gdd_sections').select('attachments').eq('id', sectionId).single();
  const list = ((cur?.attachments as GddAttachment[]) ?? []).filter((a) => a.path !== path);
  const { error } = await supabase.from('gdd_sections').update({ attachments: list }).eq('id', sectionId);
  if (error) throw error;
}

/** Gera uma URL assinada temporária para visualizar um documento privado. */
export async function signedDocUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('docs').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
