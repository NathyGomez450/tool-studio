-- =============================================================
-- Bugs — comentários por bug
-- Aplicada em 2026-07-10 via Supabase MCP.
-- =============================================================
create table if not exists public.bug_comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  bug_id      text not null references public.bugs(id) on delete cascade,
  author_id   uuid references auth.users(id) on delete set null,
  author_name text,
  text        text not null,
  created_at  timestamptz not null default now()
);
alter table public.bug_comments enable row level security;
drop policy if exists "members manage bug_comments" on public.bug_comments;
create policy "members manage bug_comments" on public.bug_comments for all
  using (public.is_project_member(project_id)) with check (public.is_project_member(project_id));
create index if not exists bug_comments_bug_idx on public.bug_comments(bug_id);
