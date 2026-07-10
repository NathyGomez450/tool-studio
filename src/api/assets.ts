import { supabase } from '@/lib/supabase';
import { type Asset } from '@/lib/data';

type DbAsset = {
  id: string;
  name: string;
  type: string;
  size: string;
  by: string;
};

function dbAssetToAsset(a: DbAsset): Asset {
  return {
    name: a.name,
    type: a.type,
    size: a.size,
    by: a.by,
  };
}

export async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*');

  if (error) throw error;
  return (data ?? []).map(dbAssetToAsset);
}
