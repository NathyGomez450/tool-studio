import { supabase } from '@/lib/supabase';
import { type RoadmapQuarter } from '@/lib/data';

export async function fetchRoadmap(projectId: string): Promise<RoadmapQuarter[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('project_id', projectId)
    .order('position');

  if (error) throw error;

  const byQuarter = new Map<string, { status: string; items: string[] }>();
  for (const row of data ?? []) {
    const q = (row.quarter as string) ?? 'Sem trimestre';
    if (!byQuarter.has(q)) byQuarter.set(q, { status: row.status as string, items: [] });
    byQuarter.get(q)!.items.push(row.title as string);
  }

  return Array.from(byQuarter.entries()).map(([quarter, { status, items }]) => ({
    quarter,
    status: status as RoadmapQuarter['status'],
    items,
  }));
}
