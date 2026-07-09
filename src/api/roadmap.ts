import { fake } from './client';
import { roadmap, type RoadmapQuarter } from '@/lib/data';

export function fetchRoadmap(): Promise<RoadmapQuarter[]> {
  return fake(roadmap);
}
