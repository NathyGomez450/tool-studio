import { fake } from './client';
import { brainstormNotes } from '@/lib/data';

export function fetchBrainstormNotes(): Promise<typeof brainstormNotes> {
  return fake(brainstormNotes);
}
