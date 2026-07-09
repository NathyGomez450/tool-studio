import { fake } from './client';
import { gddSections, type GddSection } from '@/lib/data';

export function fetchGddSections(): Promise<GddSection[]> {
  return fake(gddSections);
}
