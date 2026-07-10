import { supabase } from '@/lib/supabase';
import { type RoadmapItem, type RoadmapQuarter } from '@/lib/data';

function deriveStatus(items: RoadmapItem[]): RoadmapQuarter['status'] {
  if (items.some((i) => i.status === 'em andamento')) return 'em andamento';
  if (items.length > 0 && items.every((i) => i.status === 'concluído')) return 'concluído';
  return 'planejado';
}

export async function fetchRoadmap(projectId: string): Promise<RoadmapQuarter[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('project_id', projectId)
    .order('position');

  if (error) throw error;

  const byQuarter = new Map<string, RoadmapItem[]>();
  for (const r of data ?? []) {
    const q = (r.quarter as string) ?? 'Sem trimestre';
    if (!byQuarter.has(q)) byQuarter.set(q, []);
    byQuarter.get(q)!.push({
      id: r.id as string,
      title: r.title as string,
      status: (r.status as RoadmapItem['status']) ?? 'planejado',
    });
  }

  return Array.from(byQuarter.entries()).map(([quarter, items]) => ({
    quarter,
    items,
    status: deriveStatus(items),
  }));
}

export async function createRoadmapItem(
  projectId: string,
  input: { quarter: string; title: string; status: RoadmapItem['status'] },
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_items')
    .insert({ project_id: projectId, quarter: input.quarter, title: input.title, status: input.status });
  if (error) throw error;
}

export async function updateRoadmapItem(
  _projectId: string,
  input: { id: string; title: string; status: RoadmapItem['status']; quarter: string },
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_items')
    .update({ title: input.title, status: input.status, quarter: input.quarter })
    .eq('id', input.id);
  if (error) throw error;
}

export async function deleteRoadmapItem(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', input.id);
  if (error) throw error;
}
