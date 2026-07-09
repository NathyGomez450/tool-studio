import { fake } from './client';
import { db, nextBugId, persist } from './db';
import { type Bug } from '@/lib/data';

export function fetchBugs(): Promise<Bug[]> {
  return fake(db.bugs);
}

export async function createBug(input: { title: string; severity: Bug['severity'] }): Promise<Bug> {
  const bug: Bug = {
    id: nextBugId(),
    title: input.title,
    severity: input.severity,
    status: 'aberto',
    assignee: 'Marina Souza',
    when: 'agora',
  };
  db.bugs.unshift(bug);
  return persist(bug);
}

export async function updateBugStatus(input: { bugId: string; status: Bug['status'] }): Promise<Bug> {
  const bug = db.bugs.find((b) => b.id === input.bugId);
  if (!bug) throw new Error(`Bug ${input.bugId} não encontrado`);
  bug.status = input.status;
  return persist(bug);
}

export async function updateBug(input: {
  bugId: string;
  title: string;
  severity: Bug['severity'];
}): Promise<Bug> {
  const bug = db.bugs.find((b) => b.id === input.bugId);
  if (!bug) throw new Error(`Bug ${input.bugId} não encontrado`);
  bug.title = input.title;
  bug.severity = input.severity;
  return persist(bug);
}

export async function deleteBug(input: { bugId: string }): Promise<void> {
  const idx = db.bugs.findIndex((b) => b.id === input.bugId);
  if (idx >= 0) db.bugs.splice(idx, 1);
  await persist(null);
}
