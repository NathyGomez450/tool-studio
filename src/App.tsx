import * as React from 'react';
import {
  LayoutDashboard,
  Kanban as KanbanIcon,
  Bug,
  BookOpen,
  ArrowRight,
  Sparkles,
  Boxes,
  Users,
  Search,
} from 'lucide-react';
import { NavItem } from '@/components/nav-item';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dashboard } from '@/screens/dashboard';
import { KanbanBoard } from '@/screens/kanban';
import { Bugs } from '@/screens/bugs';
import { Gdd } from '@/screens/gdd';
import { Roadmap } from '@/screens/roadmap';
import { Brainstorm } from '@/screens/brainstorm';
import { Assets } from '@/screens/assets';
import { Team } from '@/screens/team';
import { useUiStore } from '@/stores/ui-store';

interface NavEntry {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  Screen: React.ComponentType;
}

const NAV_GROUPS: { label: string; items: NavEntry[] }[] = [
  {
    label: 'Visão geral',
    items: [
      { key: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={16} />, Screen: Dashboard },
      { key: 'roadmap', label: 'Roadmap', icon: <ArrowRight size={16} />, Screen: Roadmap },
    ],
  },
  {
    label: 'Execução',
    items: [
      { key: 'kanban', label: 'Kanban', icon: <KanbanIcon size={16} />, badge: 12, Screen: KanbanBoard },
      { key: 'bugs', label: 'Bugs', icon: <Bug size={16} />, badge: 4, Screen: Bugs },
      { key: 'brainstorm', label: 'Brainstorm', icon: <Sparkles size={16} />, Screen: Brainstorm },
    ],
  },
  {
    label: 'Documentação',
    items: [
      { key: 'gdd', label: 'GDD', icon: <BookOpen size={16} />, Screen: Gdd },
      { key: 'assets', label: 'Assets', icon: <Boxes size={16} />, Screen: Assets },
      { key: 'team', label: 'Equipe', icon: <Users size={16} />, Screen: Team },
    ],
  },
];

const NAV: NavEntry[] = NAV_GROUPS.flatMap((g) => g.items);

export default function App() {
  const active = useUiStore((s) => s.activeScreen);
  const setActive = useUiStore((s) => s.setActiveScreen);
  const [query, setQuery] = React.useState('');
  const current = NAV.find((n) => n.key === active) ?? NAV[0];
  const Screen = current.Screen;

  const q = query.trim().toLowerCase();
  const groups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex h-screen bg-canvas font-sans">
      <aside className="w-[240px] border-r border-border-subtle flex flex-col py-4 shrink-0">
        <div className="flex items-center gap-2 px-4 mb-4">
          <div className="w-[26px] h-[26px] rounded-lg bg-[var(--accent-500)] flex items-center justify-center font-bold text-[13px] text-[var(--text-on-accent)]">
            O
          </div>
          <div className="font-bold text-sm tracking-tight text-primary">
            Origem <span className="text-tertiary font-medium">Studio</span>
          </div>
        </div>
        <div className="px-3 mb-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar…" className="h-8 pl-8 text-[13px]" />
          </div>
        </div>
        <nav className="flex-1 overflow-auto flex flex-col gap-4">
          {groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-0.5">
              <div className="px-4 pb-1 text-[10px] font-semibold tracking-wider uppercase text-disabled">{g.label}</div>
              {g.items.map((n) => (
                <NavItem key={n.key} icon={n.icon} label={n.label} active={active === n.key} badge={n.badge} onClick={() => setActive(n.key)} />
              ))}
            </div>
          ))}
          {groups.length === 0 && <div className="px-4 text-[12px] text-tertiary">Nada encontrado</div>}
        </nav>
        <div className="mt-3 pt-3.5 px-3 border-t border-border-subtle">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar name="Marina Souza" size={30} />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-primary truncate">Marina Souza</div>
              <div className="text-[11px] text-tertiary truncate">Game Designer</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <Screen />
      </main>
    </div>
  );
}
