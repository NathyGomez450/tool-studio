-- =============================================================
-- Origem Studio — Migração Multi-projeto (reconciliação com banco real)
-- Projeto Supabase: tool-studio (ylovhjbncdmoibeoandi)
-- Aplicada com sucesso em 2026-07-09 via Supabase MCP (apply_migration).
-- Estado de origem: híbrido meio-migrado (profiles sem email, roadmap_items
-- com due_date sem quarter, tabelas de conteúdo sem project_id,
-- projects/profiles vazias, 1 linha órfã em project_members,
-- funções is_project_* pré-existentes com parâmetro 'target_project_id').
-- Idempotente. begin/commit para uso no SQL Editor (o MCP é atômico por si).
-- =============================================================
begin;

-- ---------- 1. PROFILES: tabela + coluna email + trigger ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  role       text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
-- handle_new_user é só trigger; não deve ser chamável via RPC
revoke execute on function public.handle_new_user() from anon, authenticated;

-- ---------- 2. PROJECT_MEMBERS: tabela + check de papel ----------
create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
alter table public.project_members drop constraint if exists project_members_role_check;
alter table public.project_members
  add constraint project_members_role_check check (role in ('owner','admin','member'));

-- ---------- 3. project_id nas tabelas de conteúdo ----------
alter table public.tasks            add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.bugs             add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.kanban_columns   add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.gdd_sections     add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.assets           add column if not exists project_id uuid references public.projects(id) on delete cascade;
alter table public.brainstorm_notes add column if not exists project_id uuid references public.projects(id) on delete cascade;

-- ---------- 4. TASKS: id default + renomes + display_id ----------
-- id é text PK sem default; o código insere sem id → dar default UUID
alter table public.tasks alter column id set default gen_random_uuid()::text;
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='tasks' and column_name='assignees') then
    alter table public.tasks rename column assignees to assignee_names;
  end if;
  if exists (select 1 from information_schema.columns
             where table_schema='public' and table_name='tasks' and column_name='comments') then
    alter table public.tasks rename column comments to comments_count;
  end if;
end $$;

alter table public.tasks add column if not exists display_id text;
create sequence if not exists public.task_display_seq start with 200;
create or replace function public.generate_task_display_id()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.display_id is null then new.display_id := 'TASK-' || nextval('public.task_display_seq'); end if;
  return new;
end; $$;
drop trigger if exists tasks_display_id_trigger on public.tasks;
create trigger tasks_display_id_trigger before insert on public.tasks
  for each row execute function public.generate_task_display_id();

-- ---------- 5. BUGS: id default + display_id ----------
alter table public.bugs alter column id set default gen_random_uuid()::text;
alter table public.bugs add column if not exists display_id text;
create sequence if not exists public.bug_display_seq start with 2240;
create or replace function public.generate_bug_display_id()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.display_id is null then new.display_id := 'BUG-' || nextval('public.bug_display_seq'); end if;
  return new;
end; $$;
drop trigger if exists bugs_display_id_trigger on public.bugs;
create trigger bugs_display_id_trigger before insert on public.bugs
  for each row execute function public.generate_bug_display_id();

-- ---------- 6. ROADMAP_ITEMS: quarter; dropar modelos antigos ----------
alter table public.roadmap_items add column if not exists quarter text;
drop table if exists public.roadmap_quarters cascade;
drop table if exists public.team_members cascade;

-- ---------- 7. Unicidade por projeto ----------
alter table public.kanban_columns drop constraint if exists kanban_columns_key_key;
alter table public.gdd_sections   drop constraint if exists gdd_sections_key_key;
create unique index if not exists kanban_columns_project_key on public.kanban_columns(project_id, key);
create unique index if not exists gdd_sections_project_key   on public.gdd_sections(project_id, key);

-- ---------- 8. Projeto origem-studio + limpeza da linha órfã ----------
insert into public.projects (name, slug) values ('Origem Studio','origem-studio')
  on conflict (slug) do nothing;
delete from public.project_members pm
  where not exists (select 1 from public.projects p where p.id = pm.project_id);

-- ---------- 9. Semear colunas do Kanban ----------
insert into public.kanban_columns (key, label, position, project_id)
select v.key, v.label, v.position, (select id from public.projects where slug='origem-studio')
from (values
  ('backlog','Backlog',0),('todo','A Fazer',1),('doing','Em Progresso',2),
  ('review','Revisão',3),('done','Concluído',4)
) as v(key,label,position)
where not exists (
  select 1 from public.kanban_columns kc
  where kc.project_id = (select id from public.projects where slug='origem-studio') and kc.key = v.key
);

-- ---------- 10. Bootstrap: profiles + nathy como owner ----------
insert into public.profiles (id, email, name)
  select id, email, coalesce(raw_user_meta_data->>'name', email) from auth.users
  on conflict (id) do update set email = excluded.email;
insert into public.project_members (project_id, user_id, role)
  select (select id from public.projects where slug='origem-studio'), u.id, 'owner'
  from auth.users u where u.email = 'nathy@origemstudio.com.br'
  on conflict (project_id, user_id) do update set role = 'owner';

-- ---------- 11. RLS: habilitar ----------
alter table public.profiles         enable row level security;
alter table public.project_members  enable row level security;
alter table public.projects         enable row level security;
alter table public.roadmap_items    enable row level security;
alter table public.tasks            enable row level security;
alter table public.bugs             enable row level security;
alter table public.kanban_columns   enable row level security;
alter table public.gdd_sections     enable row level security;
alter table public.assets           enable row level security;
alter table public.brainstorm_notes enable row level security;

-- ---------- 12. Dropar TODAS as policies public (remove deps das funções) ----------
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ---------- 13. Substituir funções de acesso ----------
-- (as versões antigas usavam o parâmetro 'target_project_id'; drop antes de recriar)
drop function if exists public.is_project_member(uuid);
drop function if exists public.is_project_admin(uuid);
create function public.is_project_member(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = pid and user_id = auth.uid());
$$;
create function public.is_project_admin(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.project_members where project_id = pid and user_id = auth.uid()
                   and role in ('owner','admin'));
$$;

-- ---------- 14. Recriar policies ----------
create policy "members manage tasks"           on public.tasks            for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage bugs"            on public.bugs             for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage kanban_columns"  on public.kanban_columns   for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage gdd_sections"    on public.gdd_sections     for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage assets"          on public.assets           for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage brainstorm"      on public.brainstorm_notes for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members manage roadmap"         on public.roadmap_items    for all using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create policy "members read projects" on public.projects for select using (public.is_project_member(id));
create policy "members read members"  on public.project_members for select using (public.is_project_member(project_id));
create policy "admins insert members" on public.project_members for insert with check (public.is_project_admin(project_id));
create policy "admins update members" on public.project_members for update using (public.is_project_admin(project_id));
create policy "admins delete members" on public.project_members for delete using (public.is_project_admin(project_id));
create policy "read own and shared profiles" on public.profiles for select using (
  id = auth.uid()
  or exists (
    select 1 from public.project_members pm_self
    join public.project_members pm_other on pm_self.project_id = pm_other.project_id
    where pm_self.user_id = auth.uid() and pm_other.user_id = profiles.id
  )
);

commit;
