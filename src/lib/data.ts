export interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  assignees: string[];
  comments: number;
}

export interface Column {
  key: string;
  label: string;
  tasks: Task[];
}

export interface Bug {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'aberto' | 'em análise' | 'em correção' | 'corrigido';
  assignee: string;
  when: string;
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

export const columns: Column[] = [
  {
    key: 'backlog',
    label: 'Backlog',
    tasks: [
      { id: 'TASK-151', title: 'Balancear economia de moedas', priority: 'low', tags: ['economia'], assignees: ['Ana Prado'], comments: 1 },
      { id: 'TASK-149', title: 'Novo circuito: Deserto Neon', priority: 'medium', tags: ['level design'], assignees: ['Bruno Alves'], comments: 0 },
    ],
  },
  {
    key: 'todo',
    label: 'A Fazer',
    tasks: [
      { id: 'TASK-142', title: 'Implementar sistema de inventário', priority: 'high', tags: ['gameplay'], assignees: ['Marina Souza', 'Léo Ramos'], comments: 3 },
      { id: 'TASK-144', title: 'Ajustar câmera em curvas fechadas', priority: 'medium', tags: ['gameplay'], assignees: ['Léo Ramos'], comments: 2 },
      { id: 'TASK-146', title: 'Sonorizar UI do menu principal', priority: 'low', tags: ['áudio'], assignees: ['Bruno Alves'], comments: 0 },
    ],
  },
  {
    key: 'doing',
    label: 'Em Progresso',
    tasks: [
      { id: 'TASK-138', title: 'Sistema de progressão de veículos', priority: 'high', tags: ['gameplay'], assignees: ['Marina Souza'], comments: 5 },
      { id: 'TASK-140', title: 'Loja in-game (UI + backend)', priority: 'critical', tags: ['monetização', 'ui'], assignees: ['Carlos Dias', 'Ana Prado'], comments: 8 },
    ],
  },
  {
    key: 'review',
    label: 'Revisão',
    tasks: [
      { id: 'TASK-135', title: 'Refatorar controller de física', priority: 'high', tags: ['engine'], assignees: ['Carlos Dias'], comments: 4 },
    ],
  },
  {
    key: 'done',
    label: 'Concluído',
    tasks: [
      { id: 'TASK-129', title: 'Onboarding do jogador novo', priority: 'medium', tags: ['ux'], assignees: ['Marina Souza'], comments: 2 },
      { id: 'TASK-131', title: 'Sistema de replays', priority: 'medium', tags: ['gameplay'], assignees: ['Léo Ramos'], comments: 1 },
    ],
  },
];

export const bugs: Bug[] = [
  { id: 'BUG-2231', title: 'Player atravessa parede no mapa Cidade', severity: 'critical', status: 'aberto', assignee: 'Léo Ramos', when: 'há 2h' },
  { id: 'BUG-2228', title: 'Áudio do motor não para ao pausar', severity: 'medium', status: 'em análise', assignee: 'Bruno Alves', when: 'há 5h' },
  { id: 'BUG-2224', title: 'Textura do asfalto pisca no LOD distante', severity: 'low', status: 'aberto', assignee: '—', when: 'há 1d' },
  { id: 'BUG-2219', title: 'Crash ao entrar em servidor com +20 players', severity: 'critical', status: 'em correção', assignee: 'Carlos Dias', when: 'há 1d' },
  { id: 'BUG-2211', title: 'Leaderboard não atualiza em tempo real', severity: 'high', status: 'corrigido', assignee: 'Marina Souza', when: 'há 3d' },
];

export const roadmap: RoadmapQuarter[] = [
  { quarter: 'Q3 2026', status: 'em andamento', items: ['Sistema de progressão de veículos', 'Loja in-game', 'Modo multiplayer 8 jogadores'] },
  { quarter: 'Q4 2026', status: 'planejado', items: ['Editor de pistas da comunidade', 'Temporada 1: Deserto Neon', 'Sistema de clãs'] },
  { quarter: 'Q1 2027', status: 'planejado', items: ['Cross-play com mobile', 'Eventos sazonais', 'Loja de skins de veículos'] },
];

export const gddSections: GddSection[] = [
  { key: 'visao', label: 'Visão Geral', title: 'Visão Geral', body: 'Skyline Racer é um jogo de corrida arcade para Roblox com foco em customização de veículos e progressão social. Sessões curtas (3–5 min), alto senso de velocidade e recompensas visuais frequentes.' },
  { key: 'mecanicas', label: 'Mecânicas de Corrida', title: 'Mecânicas de Corrida', body: 'Controle simplificado (acelerar, frear, drift). O drift acumula um boost de nitro que pode ser usado em retas. Colisões com cenário reduzem velocidade mas não param o veículo.' },
  { key: 'progressao', label: 'Progressão do Jogador', title: 'Progressão do Jogador', body: 'Cada corrida concede XP e moedas. XP desbloqueia novos circuitos e cosméticos; moedas compram peças de customização. Sem paywalls — cosméticos premium são puramente visuais.' },
  { key: 'economia', label: 'Economia e Monetização', title: 'Economia e Monetização', body: 'Moeda soft (ganha jogando) e moeda premium (Robux). Loja rotativa semanal. Sem vantagem competitiva vendida — apenas skins, efeitos de nitro e emotes.' },
  { key: 'arte', label: 'Direção de Arte', title: 'Direção de Arte', body: 'Estética neon-arcade: cores saturadas, contornos limpos, iluminação dinâmica noturna nos circuitos temáticos. Referências: synthwave e kart racers clássicos.' },
];

export const assets: Asset[] = [
  { name: 'veiculo_kart_01.fbx', type: 'Modelo 3D', size: '4.2 MB', by: 'Bruno Alves' },
  { name: 'textura_asfalto_deserto.png', type: 'Textura', size: '8.1 MB', by: 'Ana Prado' },
  { name: 'sfx_motor_loop.wav', type: 'Áudio', size: '1.4 MB', by: 'Léo Ramos' },
  { name: 'icone_moeda.png', type: 'UI', size: '112 KB', by: 'Marina Souza' },
  { name: 'skybox_noturno.hdr', type: 'Ambiente', size: '6.7 MB', by: 'Carlos Dias' },
  { name: 'anim_drift_kart.fbx', type: 'Animação', size: '2.3 MB', by: 'Bruno Alves' },
];

export const team: TeamMember[] = [
  { name: 'Marina Souza', role: 'Game Designer / Lead', tasks: 6 },
  { name: 'Léo Ramos', role: 'Gameplay Programmer', tasks: 5 },
  { name: 'Carlos Dias', role: 'Engine Programmer', tasks: 4 },
  { name: 'Ana Prado', role: 'UI/UX Designer', tasks: 5 },
  { name: 'Bruno Alves', role: '3D Artist / Sound', tasks: 3 },
];

export const brainstormNotes = [
  { text: 'E se as pistas mudassem de layout a cada temporada?', color: 'creative', x: 40, y: 40 },
  { text: 'Sistema de apostas entre amigos antes da corrida', color: 'accent', x: 320, y: 90 },
  { text: 'Veículos customizáveis com peças ganhas em corrida', color: 'info', x: 60, y: 220 },
  { text: 'Modo noturno com iluminação dinâmica', color: 'warning', x: 400, y: 260 },
  { text: 'Replay compartilhável direto pro grupo do Discord', color: 'creative', x: 640, y: 60 },
  { text: 'Parceria com criadores pra pistas exclusivas', color: 'accent', x: 660, y: 240 },
] as const;

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

export const dashboard: DashboardData = {
  stats: [
    { label: 'Tarefas abertas', value: '38' },
    { label: 'Bugs críticos', value: '3' },
    { label: 'Sprint atual', value: '64%' },
    { label: 'Marcos no prazo', value: '5/6' },
  ],
  sprint: [
    { label: 'Mecânicas de corrida', value: 80 },
    { label: 'UI de progressão', value: 45 },
    { label: 'Sistema de loja', value: 20 },
  ],
  activity: [
    { who: 'Carlos Dias', what: 'moveu BUG-2231 para Em Revisão', when: 'há 12 min' },
    { who: 'Léo Ramos', what: 'comentou em TASK-142', when: 'há 40 min' },
    { who: 'Marina Souza', what: 'concluiu TASK-138', when: 'há 1h' },
    { who: 'Ana Prado', what: 'adicionou nova página ao GDD: Progressão', when: 'há 3h' },
  ],
};
