-- =============================================================
-- Brainstorm — comentários por nota
-- Aplicada em 2026-07-10 via Supabase MCP.
-- =============================================================
create table if not exists public.brainstorm_comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  note_id     uuid not null references public.brainstorm_notes(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  text        text not null,
  created_at  timestamptz not null default now()
);
alter table public.brainstorm_comments enable row level security;
drop policy if exists "members manage brainstorm_comments" on public.brainstorm_comments;
create policy "members manage brainstorm_comments" on public.brainstorm_comments for all
  using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create index if not exists brainstorm_comments_note_idx on public.brainstorm_comments(note_id);
