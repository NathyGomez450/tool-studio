import { supabase } from '@/lib/supabase';
import { type RoadmapItem, type RoadmapStatus, type RoadmapBucket } from '@/lib/data';

function rowToItem(r: Record<string, unknown>): RoadmapItem {
  return {
    id: r.id as string,
    title: r.title as string,
    status: (r.status as RoadmapStatus) ?? 'planejado',
    quarter: (r.quarter as string) ?? '',
    bucket: (r.bucket as RoadmapBucket) ?? null,
    description: (r.description as string) ?? '',
    assignee: (r.assignee as string) ?? '—',
  };
}

export async function fetchRoadmap(projectId: string): Promise<RoadmapItem[]> {
  const { data, error } = await supabase
    .from('roadmap_items')
    .select('*')
    .eq('project_id', projectId)
    .order('position');

  if (error) throw error;
  return (data ?? []).map(rowToItem);
}

type RoadmapInput = {
  quarter: string;
  title: string;
  status: RoadmapStatus;
  bucket?: RoadmapBucket;
  description?: string;
  assignee?: string;
};

export async function createRoadmapItem(projectId: string, input: RoadmapInput): Promise<void> {
  const { error } = await supabase.from('roadmap_items').insert({
    project_id: projectId,
    quarter: input.quarter,
    title: input.title,
    status: input.status,
    bucket: input.bucket ?? null,
    description: input.description ?? null,
    assignee: input.assignee ?? '—',
  });
  if (error) throw error;
}

export async function updateRoadmapItem(
  _projectId: string,
  input: { id: string } & RoadmapInput,
): Promise<void> {
  const { error } = await supabase
    .from('roadmap_items')
    .update({
      title: input.title,
      status: input.status,
      quarter: input.quarter,
      bucket: input.bucket ?? null,
      description: input.description ?? null,
      assignee: input.assignee ?? '—',
    })
    .eq('id', input.id);
  if (error) throw error;
}

export async function deleteRoadmapItem(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', input.id);
  if (error) throw error;
}
