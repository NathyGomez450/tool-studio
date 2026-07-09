-- Supabase schema for Origem Studio
-- Run this file in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.kanban_columns (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  column_id uuid references public.kanban_columns(id) on delete set null,
  title text not null,
  priority text not null default 'media',
  tags text[] not null default '{}',
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bugs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  severity text not null default 'media',
  status text not null default 'aberto',
  assignee text,
  created_at timestamptz not null default now()
);

create table if not exists public.gdd_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  content text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'planejado',
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.brainstorm_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  content text,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text,
  url text,
  status text not null default 'rascunho',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.tasks enable row level security;
alter table public.bugs enable row level security;
alter table public.gdd_sections enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.brainstorm_notes enable row level security;
alter table public.assets enable row level security;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
  );
$$;

create policy "profiles read own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles update own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "members read own memberships"
on public.project_members
for select
to authenticated
using (user_id = auth.uid());

create policy "members read projects"
on public.projects
for select
to authenticated
using (public.is_project_member(id));

create policy "members read columns"
on public.kanban_columns
for select
to authenticated
using (public.is_project_member(project_id));

create policy "members manage columns"
on public.kanban_columns
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "members manage tasks"
on public.tasks
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "members manage bugs"
on public.bugs
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "members manage gdd"
on public.gdd_sections
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "members manage roadmap"
on public.roadmap_items
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "members manage brainstorm"
on public.brainstorm_notes
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

create policy "members manage assets"
on public.assets
for all
to authenticated
using (public.is_project_member(project_id))
with check (public.is_project_member(project_id));

insert into public.projects (name, slug)
values ('Origem Studio', 'origem-studio')
on conflict (slug) do nothing;

insert into public.kanban_columns (project_id, key, title, position)
select p.id, c.key, c.title, c.position
from public.projects p
cross join (
  values
    ('backlog', 'Backlog', 0),
    ('todo', 'A fazer', 1),
    ('doing', 'Em andamento', 2),
    ('review', 'Revisao', 3),
    ('done', 'Concluido', 4)
) as c(key, title, position)
where p.slug = 'origem-studio'
on conflict do nothing;

-- After creating a user in Authentication > Users, link them to the project:
-- insert into public.project_members (project_id, user_id, role)
-- select id, 'PASTE_USER_UID_HERE', 'owner'
-- from public.projects
-- where slug = 'origem-studio';
