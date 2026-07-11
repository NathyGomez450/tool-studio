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

export interface BugComment {
  id: string;
  author: string;
  text: string;
  when: string;
}

export type RoadmapStatus = 'em andamento' | 'planejado' | 'concluído';
export type RoadmapBucket = 'now' | 'next' | 'later' | null;

export interface RoadmapItem {
  id: string;
  title: string;
  status: RoadmapStatus;
  quarter: string;
  bucket: RoadmapBucket;
  description: string;
  assignee: string;
}

export interface RoadmapQuarter {
  quarter: string;
  status: RoadmapStatus;
  items: RoadmapItem[];
}

export interface GddAttachment {
  path: string; // caminho no bucket privado 'docs'
  name: string;
  kind: 'pdf' | 'docx' | 'other';
  size: string;
}

export interface GddSection {
  id: string;
  key: string;
  label: string;
  title: string;
  body: string;
  attachments: GddAttachment[];
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  size: string;
  by: string;
  url: string;
}

export interface TeamMember {
  name: string;
  role: string;
  tasks: number;
  pending: boolean;
}

export interface BrainstormNote {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface BrainstormEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface NoteComment {
  id: string;
  author: string;
  text: string;
  when: string;
}

export interface DashboardStat {
  label: string;
  value: string;
}

export interface KanbanBucketCount {
  label: string;
  count: number;
}

export interface RoadmapProgress {
  done: number;
  doing: number;
  planned: number;
  total: number;
}

export interface DashboardActivity {
  who: string;
  what: string;
  when: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  kanban: KanbanBucketCount[];
  roadmap: RoadmapProgress;
  activity: DashboardActivity[];
}
