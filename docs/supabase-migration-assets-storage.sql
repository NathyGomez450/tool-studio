-- =============================================================
-- Origem Studio — Storage de Assets
-- Aplicada em 2026-07-09 via Supabase MCP (apply_migration).
-- Adiciona coluna url em assets, cria o bucket 'assets' e policies
-- de escrita/exclusão por membro do projeto (leitura pública).
-- Caminho do objeto: <projectId>/<uuid>-<arquivo>; foldername[1] = projectId.
-- =============================================================
alter table public.assets add column if not exists url text;

insert into storage.buckets (id, name, public) values ('assets','assets', true)
  on conflict (id) do nothing;

drop policy if exists "assets read" on storage.objects;
drop policy if exists "assets insert" on storage.objects;
drop policy if exists "assets delete" on storage.objects;

-- Bucket é público: objetos são servidos via URL pública sem SELECT em storage.objects.
-- Não criar SELECT amplo aqui (evita listagem de todos os arquivos do bucket).
create policy "assets insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'assets' and public.is_project_member(((storage.foldername(name))[1])::uuid));
create policy "assets delete" on storage.objects for delete to authenticated
  using (bucket_id = 'assets' and public.is_project_member(((storage.foldername(name))[1])::uuid));
