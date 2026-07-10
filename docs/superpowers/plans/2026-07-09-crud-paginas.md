# Fase 3 — CRUD das páginas (GDD, Roadmap, Brainstorm, Assets) — Implementation Plan

> **For agentic workers:** Executar task-a-task. Verificação por `npx tsc -b` + teste manual no app. Depende da Fase 1 aplicada (multi-projeto, `docs/superpowers/plans/2026-07-09-multiprojeto-e-convite.md`).

**Goal:** Dar CRUD com persistência no Supabase às 4 páginas hoje só de leitura — GDD, Roadmap, Brainstorm, Assets (esta com upload real via Storage).

**Architecture:** Padrão existente — `src/api/*.ts` (funções Supabase escopadas por `project_id`) → `src/queries/mutations.ts` (mutations que invalidam a query da tela) → dialogs no padrão `bug-dialog.tsx`. Assets usa Supabase Storage (bucket `assets`).

## Global Constraints

- Branch `trabalho-local`. Sem framework de testes → `tsc` + runtime manual.
- Escopo por `project_id`; papéis owner/admin/member; RLS já ativa.
- Proibido deploy público (política FuelTech).
- Commits terminam com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 0: Migração de Storage (prereq de Assets)

**Files:** aplicar via Supabase MCP `apply_migration` (name `assets_storage`); registrar em `docs/supabase-migration-assets-storage.sql`.

- [ ] **Step 1: Aplicar migração**

```sql
alter table public.assets add column if not exists url text;
insert into storage.buckets (id, name, public) values ('assets','assets', true)
  on conflict (id) do nothing;
-- Policies de storage: leitura pública (bucket public); escrita/exclusão por membro do projeto.
-- Caminho do objeto: <projectId>/<arquivo>; foldername[1] = projectId.
drop policy if exists "assets read" on storage.objects;
drop policy if exists "assets insert" on storage.objects;
drop policy if exists "assets delete" on storage.objects;
create policy "assets read" on storage.objects for select
  using (bucket_id = 'assets');
create policy "assets insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'assets' and public.is_project_member(((storage.foldername(name))[1])::uuid));
create policy "assets delete" on storage.objects for delete to authenticated
  using (bucket_id = 'assets' and public.is_project_member(((storage.foldername(name))[1])::uuid));
```
Expected: sucesso. `assets.url` existe; bucket `assets` criado.

- [ ] **Step 2: Commit do arquivo**
```bash
git add docs/supabase-migration-assets-storage.sql
git commit -m "feat(db): storage bucket assets + coluna url + policies

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task A: GDD — CRUD de seções

**Files:** Modify `src/lib/data.ts`, `src/api/gdd.ts`, `src/queries/mutations.ts`, `src/screens/gdd.tsx`.

**Interfaces:**
- `GddSection` ganha `id: string`.
- `createGddSection(projectId, {title, body}): Promise<GddSection>` — key = `crypto.randomUUID()`, label = title.
- `updateGddSection(projectId, {id, title, body}): Promise<GddSection>`
- `deleteGddSection(projectId, {id}): Promise<void>`
- `useCreateGddSection/useUpdateGddSection/useDeleteGddSection(projectId)` invalidam `keys.gdd`.

- [ ] **Step 1: `GddSection.id`** — em `src/lib/data.ts`, adicionar `id: string;` no topo de `GddSection`.

- [ ] **Step 2: gdd.ts** — incluir `id` no `fetch` e adicionar CRUD:
```ts
export async function fetchGddSections(projectId: string): Promise<GddSection[]> {
  const { data, error } = await supabase.from('gdd_sections').select('*').eq('project_id', projectId).order('key');
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id as string,
    key: (s.key as string) ?? (s.id as string),
    label: (s.label as string) ?? (s.title as string),
    title: s.title as string,
    body: (s.body as string) ?? '',
  }));
}

export async function createGddSection(projectId: string, input: { title: string; body: string }): Promise<GddSection> {
  const key = crypto.randomUUID();
  const { data, error } = await supabase.from('gdd_sections')
    .insert({ project_id: projectId, key, label: input.title, title: input.title, body: input.body })
    .select().single();
  if (error) throw error;
  return { id: data.id, key: data.key, label: data.label, title: data.title, body: data.body ?? '' };
}

export async function updateGddSection(_projectId: string, input: { id: string; title: string; body: string }): Promise<GddSection> {
  const { data, error } = await supabase.from('gdd_sections')
    .update({ title: input.title, label: input.title, body: input.body })
    .eq('id', input.id).select().single();
  if (error) throw error;
  return { id: data.id, key: data.key, label: data.label, title: data.title, body: data.body ?? '' };
}

export async function deleteGddSection(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('gdd_sections').delete().eq('id', input.id);
  if (error) throw error;
}
```

- [ ] **Step 3: mutations** — em `src/queries/mutations.ts`, importar as 3 funções e adicionar:
```ts
export function useCreateGddSection(projectId: string) {
  const qc = useQueryClient(); const keys = queryKeys(projectId);
  return useMutation({ mutationFn: (i: { title: string; body: string }) => createGddSection(projectId, i),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }) });
}
export function useUpdateGddSection(projectId: string) {
  const qc = useQueryClient(); const keys = queryKeys(projectId);
  return useMutation({ mutationFn: (i: { id: string; title: string; body: string }) => updateGddSection(projectId, i),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }) });
}
export function useDeleteGddSection(projectId: string) {
  const qc = useQueryClient(); const keys = queryKeys(projectId);
  return useMutation({ mutationFn: (i: { id: string }) => deleteGddSection(projectId, i),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.gdd }) });
}
```

- [ ] **Step 4: UI (`gdd.tsx`)** — na `Gdd()` passar `projectId` para `GddContent`. Em `GddContent`:
  - Botão "+ Seção" no topo da lateral → cria seção (title "Nova seção", body "") e seleciona.
  - Na área de conteúdo, modo edição: botão "Editar" troca `<h1>/<p>` por `<Input>` (title) + `<textarea>` (body) + "Salvar"/"Cancelar" (usa `useUpdateGddSection`).
  - Botão "Excluir seção" (confirm em 2 cliques, padrão bug-dialog) → `useDeleteGddSection`; após excluir, selecionar a primeira seção restante.
  - `projectId` vem por prop: `GddContent({ sections, projectId }: { sections: GddSection[]; projectId: string })`.

- [ ] **Step 5: `npx tsc -b`** → sem erros. **Commit.**

---

### Task B: Roadmap — CRUD de itens

**Files:** Modify `src/lib/data.ts`, `src/api/roadmap.ts`, `src/queries/mutations.ts`, `src/screens/roadmap.tsx`.

**Interfaces:**
- Novo `RoadmapItem = { id: string; title: string; status: RoadmapQuarter['status'] }`.
- `RoadmapQuarter.items: RoadmapItem[]` (antes `string[]`).
- `createRoadmapItem(projectId, {quarter, title, status})`, `updateRoadmapItem(projectId, {id, title, status, quarter})`, `deleteRoadmapItem(projectId, {id})`.
- Status do trimestre (badge) derivado: 'em andamento' se algum item; senão 'concluído' se todos concluídos; senão 'planejado'.

- [ ] **Step 1: tipos (`data.ts`)**:
```ts
export interface RoadmapItem { id: string; title: string; status: 'em andamento' | 'planejado' | 'concluído'; }
export interface RoadmapQuarter {
  quarter: string;
  status: 'em andamento' | 'planejado' | 'concluído';
  items: RoadmapItem[];
}
```

- [ ] **Step 2: `roadmap.ts`** — fetch agrupando com itens que carregam id/status; + CRUD:
```ts
export async function fetchRoadmap(projectId: string): Promise<RoadmapQuarter[]> {
  const { data, error } = await supabase.from('roadmap_items').select('*').eq('project_id', projectId).order('position');
  if (error) throw error;
  const byQ = new Map<string, RoadmapItem[]>();
  for (const r of data ?? []) {
    const q = (r.quarter as string) ?? 'Sem trimestre';
    if (!byQ.has(q)) byQ.set(q, []);
    byQ.get(q)!.push({ id: r.id as string, title: r.title as string, status: (r.status as RoadmapItem['status']) ?? 'planejado' });
  }
  return Array.from(byQ.entries()).map(([quarter, items]) => ({ quarter, items, status: deriveStatus(items) }));
}
function deriveStatus(items: RoadmapItem[]): RoadmapQuarter['status'] {
  if (items.some((i) => i.status === 'em andamento')) return 'em andamento';
  if (items.length > 0 && items.every((i) => i.status === 'concluído')) return 'concluído';
  return 'planejado';
}
export async function createRoadmapItem(projectId: string, input: { quarter: string; title: string; status: RoadmapItem['status'] }): Promise<void> {
  const { error } = await supabase.from('roadmap_items').insert({ project_id: projectId, quarter: input.quarter, title: input.title, status: input.status });
  if (error) throw error;
}
export async function updateRoadmapItem(_projectId: string, input: { id: string; title: string; status: RoadmapItem['status']; quarter: string }): Promise<void> {
  const { error } = await supabase.from('roadmap_items').update({ title: input.title, status: input.status, quarter: input.quarter }).eq('id', input.id);
  if (error) throw error;
}
export async function deleteRoadmapItem(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('roadmap_items').delete().eq('id', input.id);
  if (error) throw error;
}
```

- [ ] **Step 3: mutations** — `useCreateRoadmapItem/useUpdateRoadmapItem/useDeleteRoadmapItem`, invalidam `keys.roadmap` (mesmo padrão da Task A).

- [ ] **Step 4: UI (`roadmap.tsx`)**:
  - Botão "+ Item" no TopBar (`actions`) → dialog (trimestre texto ex. "Q3 2026", título, status select) → `useCreateRoadmapItem`.
  - Renderizar `r.items` como objetos: `key={it.id}`, texto `{it.title}`; hover mostra editar/excluir (dialog de edição com título+status+trimestre; excluir via `useDeleteRoadmapItem`).
  - Ajustar `bulletColor`/`statusTone` para usar `it.status` por item.

- [ ] **Step 5: `npx tsc -b`** → sem erros. **Commit.**

---

### Task C: Brainstorm — CRUD + arrastar

**Files:** Modify `src/lib/data.ts`, `src/api/brainstorm.ts`, `src/queries/mutations.ts`, `src/screens/brainstorm.tsx`.

**Interfaces:**
- `BrainstormNote` ganha `id: string`.
- `createBrainstormNote(projectId, {text, color, x, y})`, `updateBrainstormNote(projectId, {id, text?, color?, x?, y?})`, `deleteBrainstormNote(projectId, {id})`.

- [ ] **Step 1: `BrainstormNote.id`** em `data.ts`.

- [ ] **Step 2: `brainstorm.ts`** — incluir `id` no fetch; CRUD:
```ts
export async function createBrainstormNote(projectId: string, input: { text: string; color: string; x: number; y: number }): Promise<void> {
  const { error } = await supabase.from('brainstorm_notes').insert({ project_id: projectId, text: input.text, color: input.color, x: input.x, y: input.y });
  if (error) throw error;
}
export async function updateBrainstormNote(_projectId: string, input: { id: string; text?: string; color?: string; x?: number; y?: number }): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (input.text !== undefined) patch.text = input.text;
  if (input.color !== undefined) patch.color = input.color;
  if (input.x !== undefined) patch.x = input.x;
  if (input.y !== undefined) patch.y = input.y;
  const { error } = await supabase.from('brainstorm_notes').update(patch).eq('id', input.id);
  if (error) throw error;
}
export async function deleteBrainstormNote(_projectId: string, input: { id: string }): Promise<void> {
  const { error } = await supabase.from('brainstorm_notes').delete().eq('id', input.id);
  if (error) throw error;
}
```

- [ ] **Step 3: mutations** — `useCreateBrainstormNote/useUpdateBrainstormNote/useDeleteBrainstormNote`, invalidam `keys.brainstorm`. A de update NÃO invalida durante o arraste (só ao soltar) para não brigar com o movimento; usar `onSettled`.

- [ ] **Step 4: UI (`brainstorm.tsx`)**:
  - "+ Nota" (já existe no TopBar) → cria nota com texto padrão em posição inicial (ex. x=40+scroll, y=40); passa a ser botão funcional.
  - Clique na nota → dialog de edição (textarea texto + select cor) + excluir.
  - Arrastar: `onPointerDown` na nota inicia drag; `onPointerMove` atualiza posição local (state); `onPointerUp` persiste via `updateBrainstormNote({id, x, y})`. Usar `key={n.id}`.

- [ ] **Step 5: `npx tsc -b`** → sem erros. **Commit.**

---

### Task D: Assets — upload/excluir via Storage

**Files:** Modify `src/lib/data.ts`, `src/api/assets.ts`, `src/lib/utils.ts`, `src/queries/mutations.ts`, `src/screens/assets.tsx`. Create `src/components/dialogs/asset-upload-dialog.tsx`.

**Interfaces:**
- `Asset` ganha `id: string` e `url: string`.
- `formatBytes(n: number): string` em `utils.ts`.
- `uploadAsset(projectId, file: File, opts: { type: string }): Promise<void>` — sobe ao bucket `assets` em `<projectId>/<uuid>-<nome>`, pega URL pública, insere linha.
- `deleteAsset(projectId, input: { id: string; url: string }): Promise<void>` — remove objeto do Storage + linha.

- [ ] **Step 1: tipos + util** — `Asset.id`, `Asset.url` em `data.ts`; `formatBytes` em `utils.ts`:
```ts
export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const u = ['B','KB','MB','GB']; const i = Math.min(Math.floor(Math.log(bytes)/Math.log(1024)), u.length-1);
  return `${(bytes/Math.pow(1024,i)).toFixed(i ? 1 : 0)} ${u[i]}`;
}
```

- [ ] **Step 2: `assets.ts`** — fetch com id/url; upload/delete:
```ts
export async function fetchAssets(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase.from('assets').select('*').eq('project_id', projectId);
  if (error) throw error;
  return (data ?? []).map((a) => ({
    id: a.id as string, name: a.name as string, type: (a.type as string) ?? '—',
    size: (a.size as string) ?? '—', by: (a.by as string) ?? '—', url: (a.url as string) ?? '',
  }));
}
export async function uploadAsset(projectId: string, file: File, opts: { type: string }): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  const by = u.user?.user_metadata?.name || u.user?.email || '—';
  const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
  const up = await supabase.storage.from('assets').upload(path, file);
  if (up.error) throw up.error;
  const { data: pub } = supabase.storage.from('assets').getPublicUrl(path);
  const { error } = await supabase.from('assets').insert({
    project_id: projectId, name: file.name, type: opts.type, size: formatBytes(file.size), by, url: pub.publicUrl,
  });
  if (error) throw error;
}
export async function deleteAsset(_projectId: string, input: { id: string; url: string }): Promise<void> {
  const marker = '/assets/';
  const idx = input.url.indexOf(marker);
  if (idx >= 0) {
    const path = decodeURIComponent(input.url.slice(idx + marker.length));
    await supabase.storage.from('assets').remove([path]);
  }
  const { error } = await supabase.from('assets').delete().eq('id', input.id);
  if (error) throw error;
}
```
(importar `formatBytes` de `@/lib/utils`.)

- [ ] **Step 3: mutations** — `useUploadAsset(projectId)` (`mutationFn: ({file,type}) => uploadAsset(projectId, file, {type})`) e `useDeleteAsset(projectId)`, invalidam `keys.assets`.

- [ ] **Step 4: UI** — `asset-upload-dialog.tsx`: `<input type="file">` + `<Select>` de tipo (Modelo 3D/Textura/Áudio/UI/Ambiente/Animação/Outro) + botão "Enviar" (`useUploadAsset`). Em `assets.tsx`: botão "+ Upload" abre o dialog; card ganha botão excluir (`useDeleteAsset` com `{id, url}`), confirm 2 cliques.

- [ ] **Step 5: `npx tsc -b`** → sem erros. **Commit.**

---

## Verificação (por task, no app)

Para cada tela: criar → aparece e persiste após reload; editar → reflete; excluir → some. Assets: upload sobe arquivo ao bucket e o card mostra; excluir remove do bucket. Brainstorm: arrastar reposiciona e persiste. Tudo escopado por `project_id`.

## Self-review

- Cobertura §7 do spec: 7.1 tipos → Steps 1 de cada task; 7.2 GDD → Task A; 7.3 Roadmap → Task B; 7.4 Brainstorm → Task C; 7.5 Assets+Storage → Task 0 + Task D; 7.6 verificação → seção acima.
- Consistência: cada `use*` chama a função de api homônima com a mesma assinatura; ids adicionados em `data.ts` antes de usados nas fetch/mutations.
