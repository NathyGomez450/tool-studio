import { fake } from './client';
import { team, type TeamMember } from '@/lib/data';

export function fetchTeam(): Promise<TeamMember[]> {
  return fake(team);
}
