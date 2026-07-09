import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchColumns } from '@/api/tasks';
import { fetchBugs } from '@/api/bugs';
import { fetchRoadmap } from '@/api/roadmap';
import { fetchGddSections } from '@/api/gdd';
import { fetchAssets } from '@/api/assets';
import { fetchTeam } from '@/api/team';
import { fetchBrainstormNotes } from '@/api/brainstorm';
import { fetchDashboard } from '@/api/dashboard';

export function useColumns() {
  return useQuery({ queryKey: queryKeys.columns, queryFn: fetchColumns });
}

export function useBugs() {
  return useQuery({ queryKey: queryKeys.bugs, queryFn: fetchBugs });
}

export function useRoadmap() {
  return useQuery({ queryKey: queryKeys.roadmap, queryFn: fetchRoadmap });
}

export function useGddSections() {
  return useQuery({ queryKey: queryKeys.gdd, queryFn: fetchGddSections });
}

export function useAssets() {
  return useQuery({ queryKey: queryKeys.assets, queryFn: fetchAssets });
}

export function useTeam() {
  return useQuery({ queryKey: queryKeys.team, queryFn: fetchTeam });
}

export function useBrainstormNotes() {
  return useQuery({ queryKey: queryKeys.brainstorm, queryFn: fetchBrainstormNotes });
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });
}
