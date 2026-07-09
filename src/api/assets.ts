import { fake } from './client';
import { assets, type Asset } from '@/lib/data';

export function fetchAssets(): Promise<Asset[]> {
  return fake(assets);
}
