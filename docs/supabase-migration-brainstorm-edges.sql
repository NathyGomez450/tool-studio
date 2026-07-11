-- =============================================================
-- Brainstorm — conexões do mapa mental (edges entre notas)
-- Aplicada em 2026-07-10 via Supabase MCP.
-- =============================================================
create table if not exists public.brainstorm_edges (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source     uuid not null references public.brainstorm_notes(id) on delete cascade,
  target     uuid not null references public.brainstorm_notes(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.brainstorm_edges enable row level security;
drop policy if exists "members manage brainstorm_edges" on public.brainstorm_edges;
create policy "members manage brainstorm_edges" on public.brainstorm_edges for all
  using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
