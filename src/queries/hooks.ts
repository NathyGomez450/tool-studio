import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchColumns } from '@/api/tasks';
import { fetchBugs } from '@/api/bugs';
import { fetchRoadmap } from '@/api/roadmap';
import { fetchGddSections } from '@/api/gdd';
import { fetchAssets } from '@/api/assets';
import { fetchTeam } from '@/api/team';
import { fetchBrainstormNotes, fetchBrainstormEdges } from '@/api/brainstorm';
import { fetchDashboard } from '@/api/dashboard';

export function useColumns(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.columns, queryFn: () => fetchColumns(projectId), enabled: !!projectId });
}

export function useBugs(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.bugs, queryFn: () => fetchBugs(projectId), enabled: !!projectId });
}

export function useRoadmap(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.roadmap, queryFn: () => fetchRoadmap(projectId), enabled: !!projectId });
}

export function useGddSections(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.gdd, queryFn: () => fetchGddSections(projectId), enabled: !!projectId });
}

export function useAssets(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.assets, queryFn: () => fetchAssets(projectId), enabled: !!projectId });
}

export function useTeam(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.team, queryFn: () => fetchTeam(projectId), enabled: !!projectId });
}

export function useBrainstormNotes(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.brainstorm, queryFn: () => fetchBrainstormNotes(projectId), enabled: !!projectId });
}

export function useBrainstormEdges(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.brainstormEdges, queryFn: () => fetchBrainstormEdges(projectId), enabled: !!projectId });
}

export function useDashboard(projectId: string) {
  const keys = queryKeys(projectId);
  return useQuery({ queryKey: keys.dashboard, queryFn: () => fetchDashboard(projectId), enabled: !!projectId });
}
