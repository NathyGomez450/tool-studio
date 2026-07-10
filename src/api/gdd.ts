import { supabase } from '@/lib/supabase';
import { type GddSection } from '@/lib/data';

type DbGdd = {
  id: string;
  key: string;
  label: string;
  title: string;
  body: string;
};

function dbGddToSection(s: DbGdd): GddSection {
  return {
    key: s.key,
    label: s.label,
    title: s.title,
    body: s.body,
  };
}

export async function fetchGddSections(): Promise<GddSection[]> {
  const { data, error } = await supabase
    .from('gdd_sections')
    .select('*');

  if (error) throw error;
  return (data ?? []).map(dbGddToSection);
}
