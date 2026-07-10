-- =============================================================
-- Origem Studio — Supabase Schema (v2 - Permissivo)
-- Cole todo este SQL no SQL Editor do Supabase e clique em "Run"
-- =============================================================

-- Dropar tabelas antigas se existirem (cuidado em produção!)
drop table if exists tasks cascade;
drop table if exists bugs cascade;
drop table if exists kanban_columns cascade;
drop table if exists roadmap_quarters cascade;
drop table if exists gdd_sections cascade;
drop table if exists assets cascade;
drop table if exists team_members cascade;
drop table if exists brainstorm_notes cascade;
drop table if exists projects cascade;

-- ==========================
-- TABELAS
-- ==========================

create table projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table team_members (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  role  text not null,
  tasks integer not null default 0
);

create table kanban_columns (
  id        uuid primary key default gen_random_uuid(),
  key       text not null unique,
  label     text not null,
  position  integer not null default 0
);

create table tasks (
  id         text primary key,
  title      text not null,
  priority   text not null default 'medium',
  tags       text[] not null default '{}',
  assignees  text[] not null default '{}',
  comments   integer not null default 0,
  column_id  uuid not null references kanban_columns(id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create table bugs (
  id         text primary key,
  title      text not null,
  severity   text not null default 'medium',
  status     text not null default 'aberto',
  assignee   text not null default '—',
  "when"     text not null default 'agora',
  created_at timestamptz not null default now()
);

create table roadmap_quarters (
  id       uuid primary key default gen_random_uuid(),
  quarter  text not null unique,
  status   text not null default 'planejado',
  items    text[] not null default '{}',
  position integer not null default 0
);

create table gdd_sections (
  id    uuid primary key default gen_random_uuid(),
  key   text not null unique,
  label text not null,
  title text not null,
  body  text not null default ''
);

create table assets (
  id   uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  size text not null,
  "by" text not null
);

create table brainstorm_notes (
  id    uuid primary key default gen_random_uuid(),
  text  text not null,
  color text not null default 'accent',
  x     integer not null default 40,
  y     integer not null default 40
);

-- ==========================
-- RLS (Row Level Security)
-- ==========================

-- Habilitar RLS em todas as tabelas
alter table projects          enable row level security;
alter table team_members      enable row level security;
alter table kanban_columns    enable row level security;
alter table tasks             enable row level security;
alter table bugs              enable row level security;
alter table roadmap_quarters  enable row level security;
alter table gdd_sections      enable row level security;
alter table assets            enable row level security;
alter table brainstorm_notes  enable row level security;

-- Políticas PERMISSIVAS para leitura (qualquer um pode ler)
create policy "Allow public read" on projects          for select using (true);
create policy "Allow public read" on team_members      for select using (true);
create policy "Allow public read" on kanban_columns    for select using (true);
create policy "Allow public read" on tasks             for select using (true);
create policy "Allow public read" on bugs              for select using (true);
create policy "Allow public read" on roadmap_quarters  for select using (true);
create policy "Allow public read" on gdd_sections      for select using (true);
create policy "Allow public read" on assets            for select using (true);
create policy "Allow public read" on brainstorm_notes  for select using (true);

-- Políticas para escrita (autenticados podem escrever)
create policy "Allow authenticated write" on projects          for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on team_members      for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on kanban_columns    for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on tasks             for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on bugs              for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on roadmap_quarters  for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on gdd_sections      for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on assets            for all using (auth.role() = 'authenticated');
create policy "Allow authenticated write" on brainstorm_notes  for all using (auth.role() = 'authenticated');

-- ==========================
-- DADOS INICIAIS
-- ==========================

-- Projeto
insert into projects (name, slug) values ('Origem Studio', 'origem-studio');

-- Colunas do Kanban
insert into kanban_columns (key, label, position) values
  ('backlog', 'Backlog',      0),
  ('todo',    'A Fazer',      1),
  ('doing',   'Em Progresso', 2),
  ('review',  'Revisão',      3),
  ('done',    'Concluído',    4);

-- Tarefas
insert into tasks (id, title, priority, tags, assignees, comments, column_id, position)
select 'TASK-151', 'Balancear economia de moedas', 'low', ARRAY['economia'], ARRAY['Ana Prado'], 1, id, 0 from kanban_columns where key='backlog'
union all select 'TASK-149', 'Novo circuito: Deserto Neon', 'medium', ARRAY['level design'], ARRAY['Bruno Alves'], 0, id, 1 from kanban_columns where key='backlog'
union all select 'TASK-142', 'Implementar sistema de inventário', 'high', ARRAY['gameplay'], ARRAY['Marina Souza','Léo Ramos'], 3, id, 0 from kanban_columns where key='todo'
union all select 'TASK-144', 'Ajustar câmera em curvas fechadas', 'medium', ARRAY['gameplay'], ARRAY['Léo Ramos'], 2, id, 1 from kanban_columns where key='todo'
union all select 'TASK-146', 'Sonorizar UI do menu principal', 'low', ARRAY['áudio'], ARRAY['Bruno Alves'], 0, id, 2 from kanban_columns where key='todo'
union all select 'TASK-138', 'Sistema de progressão de veículos', 'high', ARRAY['gameplay'], ARRAY['Marina Souza'], 5, id, 0 from kanban_columns where key='doing'
union all select 'TASK-140', 'Loja in-game (UI + backend)', 'critical', ARRAY['monetização','ui'], ARRAY['Carlos Dias','Ana Prado'], 8, id, 1 from kanban_columns where key='doing'
union all select 'TASK-135', 'Refatorar controller de física', 'high', ARRAY['engine'], ARRAY['Carlos Dias'], 4, id, 0 from kanban_columns where key='review'
union all select 'TASK-129', 'Onboarding do jogador novo', 'medium', ARRAY['ux'], ARRAY['Marina Souza'], 2, id, 0 from kanban_columns where key='done'
union all select 'TASK-131', 'Sistema de replays', 'medium', ARRAY['gameplay'], ARRAY['Léo Ramos'], 1, id, 1 from kanban_columns where key='done';

-- Bugs
insert into bugs (id, title, severity, status, assignee, "when") values
  ('BUG-2231', 'Player atravessa parede no mapa Cidade', 'critical', 'aberto', 'Léo Ramos', 'há 2h'),
  ('BUG-2228', 'Áudio do motor não para ao pausar', 'medium', 'em análise', 'Bruno Alves', 'há 5h'),
  ('BUG-2224', 'Textura do asfalto pisca no LOD distante', 'low', 'aberto', '—', 'há 1d'),
  ('BUG-2219', 'Crash ao entrar em servidor com +20 players', 'critical', 'em correção', 'Carlos Dias', 'há 1d'),
  ('BUG-2211', 'Leaderboard não atualiza em tempo real', 'high', 'corrigido', 'Marina Souza', 'há 3d');

-- Roadmap
insert into roadmap_quarters (quarter, status, items, position) values
  ('Q3 2026', 'em andamento', ARRAY['Sistema de progressão de veículos','Loja in-game','Modo multiplayer 8 jogadores'], 0),
  ('Q4 2026', 'planejado', ARRAY['Editor de pistas da comunidade','Temporada 1: Deserto Neon','Sistema de clãs'], 1),
  ('Q1 2027', 'planejado', ARRAY['Cross-play com mobile','Eventos sazonais','Loja de skins de veículos'], 2);

-- GDD
insert into gdd_sections (key, label, title, body) values
  ('visao', 'Visão Geral', 'Visão Geral', 'Skyline Racer é um jogo de corrida arcade para Roblox com foco em customização de veículos e progressão social.'),
  ('mecanicas', 'Mecânicas de Corrida', 'Mecânicas de Corrida', 'Controle simplificado (acelerar, frear, drift). O drift acumula um boost de nitro.'),
  ('progressao', 'Progressão do Jogador', 'Progressão do Jogador', 'Cada corrida concede XP e moedas. XP desbloqueia novos circuitos e cosméticos.'),
  ('economia', 'Economia e Monetização', 'Economia e Monetização', 'Moeda soft (ganha jogando) e moeda premium (Robux). Loja rotativa semanal.'),
  ('arte', 'Direção de Arte', 'Direção de Arte', 'Estética neon-arcade: cores saturadas, contornos limpos, iluminação dinâmica noturna.');

-- Equipe
insert into team_members (name, role, tasks) values
  ('Marina Souza', 'Game Designer / Lead', 6),
  ('Léo Ramos', 'Gameplay Programmer', 5),
  ('Carlos Dias', 'Engine Programmer', 4),
  ('Ana Prado', 'UI/UX Designer', 5),
  ('Bruno Alves', '3D Artist / Sound', 3);

-- Assets
insert into assets (name, type, size, "by") values
  ('veiculo_kart_01.fbx', 'Modelo 3D', '4.2 MB', 'Bruno Alves'),
  ('textura_asfalto_deserto.png', 'Textura', '8.1 MB', 'Ana Prado'),
  ('sfx_motor_loop.wav', 'Áudio', '1.4 MB', 'Léo Ramos'),
  ('icone_moeda.png', 'UI', '112 KB', 'Marina Souza'),
  ('skybox_noturno.hdr', 'Ambiente', '6.7 MB', 'Carlos Dias'),
  ('anim_drift_kart.fbx', 'Animação', '2.3 MB', 'Bruno Alves');

-- Brainstorm
insert into brainstorm_notes (text, color, x, y) values
  ('E se as pistas mudassem de layout a cada temporada?', 'creative', 40, 40),
  ('Sistema de apostas entre amigos antes da corrida', 'accent', 320, 90),
  ('Veículos customizáveis com peças ganhas em corrida', 'info', 60, 220),
  ('Modo noturno com iluminação dinâmica', 'warning', 400, 260),
  ('Replay compartilhável direto pro grupo do Discord', 'creative', 640, 60),
  ('Parceria com criadores pra pistas exclusivas', 'accent', 660, 240);
