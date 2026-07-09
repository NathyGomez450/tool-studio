import { create } from 'zustand';

export interface KanbanFilter {
  text: string;
  priority: string;
  tag: string;
  assignee: string;
}

export interface BugsFilter {
  text: string;
  severity: string;
  status: string;
  assignee: string;
}

const EMPTY_KANBAN: KanbanFilter = { text: '', priority: '', tag: '', assignee: '' };
const EMPTY_BUGS: BugsFilter = { text: '', severity: '', status: '', assignee: '' };

interface FilterState {
  kanban: KanbanFilter;
  bugs: BugsFilter;
  setKanbanFilter: (patch: Partial<KanbanFilter>) => void;
  setBugsFilter: (patch: Partial<BugsFilter>) => void;
  clearKanban: () => void;
  clearBugs: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  kanban: EMPTY_KANBAN,
  bugs: EMPTY_BUGS,
  setKanbanFilter: (patch) => set((s) => ({ kanban: { ...s.kanban, ...patch } })),
  setBugsFilter: (patch) => set((s) => ({ bugs: { ...s.bugs, ...patch } })),
  clearKanban: () => set({ kanban: EMPTY_KANBAN }),
  clearBugs: () => set({ bugs: EMPTY_BUGS }),
}));
