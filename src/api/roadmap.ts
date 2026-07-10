import { supabase } from '@/lib/supabase';
import { type RoadmapQuarter } from '@/lib/data';

type DbRoadmap = {
  id: string;
  quarter: string;
  status: string;
  items: string[];
  position: number;
};

function dbRoadmapToQuarter(r: DbRoadmap): RoadmapQuarter {
  return {
    quarter: r.quarter,
    status: r.status as RoadmapQuarter['status'],
    items: r.items ?? [],
  };
}

export async function fetchRoadmap(): Promise<RoadmapQuarter[]> {
  const { data, error } = await supabase
    .from('roadmap_quarters')
    .select('*')
    .order('position');

  if (error) throw error;
  return (data ?? []).map(dbRoadmapToQuarter);
}
