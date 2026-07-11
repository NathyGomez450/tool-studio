-- =============================================================
-- Roadmap — campos extras: descrição, responsável e bucket (Now/Next/Later)
-- Aplicada em 2026-07-10 via Supabase MCP.
-- =============================================================
alter table public.roadmap_items add column if not exists description text;
alter table public.roadmap_items add column if not exists assignee text;
-- bucket: 'now' | 'next' | 'later' (null = sem categoria)
alter table public.roadmap_items add column if not exists bucket text;
