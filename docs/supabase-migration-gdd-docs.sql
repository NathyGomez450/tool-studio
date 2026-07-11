-- =============================================================
-- GDD — Anexos de documentos por seção + bucket PRIVADO 'docs'
-- Aplicada em 2026-07-10 via Supabase MCP.
-- =============================================================
alter table public.gdd_sections add column if not exists attachments jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public) values ('docs', 'docs', false)
  on conflict (id) do nothing;

-- Bucket privado: acesso só para membros do projeto (leitura p/ assinar URL, escrita, exclusão).
-- Caminho: <projectId>/gdd/<sectionId>/<arquivo>; foldername(name)[1] = projectId.
drop policy if exists "docs select" on storage.objects;
drop policy if exists "docs insert" on storage.objects;
drop policy if exists "docs delete" on storage.objects;
create policy "docs select" on storage.objects for select to authenticated
  using (bucket_id = 'docs' and public.is_project_member(((storage.foldername(name))[1])::uuid));
create policy "docs insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'docs' and public.is_project_member(((storage.foldername(name))[1])::uuid));
create policy "docs delete" on storage.objects for delete to authenticated
  using (bucket_id = 'docs' and public.is_project_member(((storage.foldername(name))[1])::uuid));
