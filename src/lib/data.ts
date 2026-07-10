// ============================================================
// Tipos de domínio — sem dados estáticos (banco real via Supabase)
// ============================================================

export interface Task {
  id: string;          // UUID do Supabase
  displayId: string;   // TASK-xxx (gerado por trigger)
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  assignees: string[];
  comments: number;
}

export interface Column {
  key: string;         // backlog, todo, doing, review, done
  label: string;
  tasks: Task[];
}

export interface Bug {
  id: string;          // UUID do Supabase
  displayId: string;   // BUG-xxx (gerado por trigger)
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'aberto' | 'em análise' | 'em correção' | 'corrigido';
  assignee: string;
  when: string;        // derivado de created_at
}

export interface RoadmapQuarter {
  quarter: string;
  status: 'em andamento' | 'planejado' | 'concluído';
  items: string[];
}

export interface GddSection {
  key: string;
  label: string;
  title: string;
  body: string;
}

export interface Asset {
  name: string;
  type: string;
  size: string;
  by: string;
}

export interface TeamMember {
  name: string;
  role: string;
  tasks: number;
}

export interface BrainstormNote {
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface DashboardStat {
  label: string;
  value: string;
}

export interface SprintProgress {
  label: string;
  value: number;
}

export interface DashboardActivity {
  who: string;
  what: string;
  when: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  sprint: SprintProgress[];
  activity: DashboardActivity[];
}
