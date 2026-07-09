import { sleep, FAKE_LATENCY } from './client';
import { columns, bugs, type Column, type Bug } from '@/lib/data';

export const db: { columns: Column[]; bugs: Bug[] } = {
  columns: structuredClone(columns),
  bugs: structuredClone(bugs),
};

let taskSeq = 200;
let bugSeq = 2240;

export function nextTaskId(): string {
  taskSeq += 1;
  return `TASK-${taskSeq}`;
}

export function nextBugId(): string {
  bugSeq += 1;
  return `BUG-${bugSeq}`;
}

/**
 * Confirma uma escrita: espera a latência simulada e devolve uma cópia
 * profunda do resultado (como um endpoint faria ao responder).
 */
export async function persist<T>(data: T, ms: number = FAKE_LATENCY): Promise<T> {
  await sleep(ms);
  return structuredClone(data);
}
