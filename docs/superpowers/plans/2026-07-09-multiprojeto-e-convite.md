# Multi-projeto + Convite por email — Implementation Plan (Fases 1 e 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. A Fase 3 (CRUD das páginas) está em plano separado: `docs/superpowers/plans/2026-07-09-crud-paginas.md`.

**Goal:** Migrar o app Origem Studio para o modelo multi-projeto (dados escopados por `project_id`) que o código de `trabalho-local` já espera, e adicionar convite de usuários por email via Edge Function.

**Architecture:** React + Vite no browser, Supabase (Postgres + Auth + Edge Functions) no backend. Acesso escopado por `project_id` e protegido por RLS baseada em `project_members`. Convite via Edge Function server-side com service_role.

**Tech Stack:** React 18, TypeScript, Vite 8, @tanstack/react-query, @supabase/supabase-js v2, Supabase (Postgres/Auth/Edge Functions Deno).

## Global Constraints

- Branch de trabalho: `trabalho-local`. Não mesclar `main`.
- Sem framework de testes — verificação por `npx tsc -b`, `npm run dev` e checagens no Supabase/app.
- Node 22.11 instalado; Vite pede 22.12+ (roda com aviso). Não bloquear.
- Nunca commitar segredos. `.env` deve estar no `.gitignore`.
- Cliente Supabase usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (ver `src/lib/supabase.ts`).
- Toda tabela de dados é escopada por `project_id`; slug fixo do projeto: `origem-studio`.
- Papéis: `owner` | `admin` | `member`. `owner`/`admin` convidam; `member` não.
- **Estado real do banco (verificado via Supabase MCP, projeto `ylovhjbncdmoibeoandi`):** híbrido meio-migrado — `profiles`/`project_members`/`roadmap_items` já existem (parcial/inconsistente), tabelas de conteúdo sem `project_id`, `projects`/`profiles` vazias, 2 usuários de auth (`jvtt@`, `nathy@origemstudio.com.br`), 0 linhas de conteúdo. A migração reconcilia com ISSO (`docs/supabase-migration-multiprojeto.sql`), não com o schema do `main`.
- Migração/deploy podem usar **Supabase MCP** (`apply_migration`, `deploy_edge_function`) com confirmação, ou Supabase CLI/SQL Editor.
- **Política FuelTech:** proibido deploy público (Vercel/Netlify/etc.). Nenhuma exposição externa sem validação prévia da TI interna.
- Mensagens de commit terminam com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

# FASE 1 — Multi-projeto rodando

Entrega: app builda (`tsc`), sobe (`npm run dev`), login (nathy) carrega `activeProject`, telas funcionam escopadas por projeto (iniciam vazias).

## Estrutura de arquivos (Fase 1)

- Criar: `.env` (não versionado). Já criado: `docs/supabase-migration-multiprojeto.sql`.
- Modificar: `.gitignore`, `src/api/assets.ts`, `src/api/brainstorm.ts`, `src/api/gdd.ts`, `src/api/tasks.ts`
- Remover: `docs/supabase-migration-v2.sql`

---

### Task 1: Configuração local (.env + gitignore)

**Files:**
- Create: `.env`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` disponíveis ao Vite.

- [ ] **Step 1: Trazer os valores do .env do main**

```bash
git show main:.env
```
Criar `.env` na raiz com as duas linhas exibidas (`VITE_SUPABASE_URL=...`, `VITE_SUPABASE_PUBLISHABLE_KEY=...`).

- [ ] **Step 2: Garantir .env no .gitignore**

Garantir uma linha `.env` no `.gitignore`. Verificar:
```bash
grep -qx ".env" .gitignore && echo "OK ignora .env" || echo "FALTA"
```
Expected: `OK ignora .env`

- [ ] **Step 3: Confirmar que .env não é versionado**

```bash
git status --porcelain .env
```
Expected: sem saída.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: ignora .env e configura credenciais supabase locais

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Aplicar a migração multi-projeto

**Files:**
- Usar (já escrito): `docs/supabase-migration-multiprojeto.sql`
- Remove: `docs/supabase-migration-v2.sql`

**Interfaces:**
- Produces (schema alvo consumido pelo código):
  - `profiles(id, email, name, role, created_at)` + trigger `on_auth_user_created`
  - `project_members(project_id, user_id, role∈{owner,admin,member}, created_at)`
  - `project_id` em `tasks, bugs, kanban_columns, gdd_sections, assets, brainstorm_notes, roadmap_items`
  - `tasks.assignee_names text[]`, `tasks.comments_count int`, `tasks.display_id text` (trigger `TASK-xxx`)
  - `bugs.display_id text` (trigger `BUG-xxx`)
  - `roadmap_items.quarter text`
  - `projects` com linha `origem-studio`; `project_members` com nathy=`owner`
  - Funções `is_project_member(uuid)`, `is_project_admin(uuid)` (true p/ owner+admin)

- [ ] **Step 1: Revisar o SQL da migração**

Abrir `docs/supabase-migration-multiprojeto.sql` e reler. Confirmar que reflete o estado real (não recria o que já existe; usa `add column if not exists`; adiciona `email` a profiles e `quarter` a roadmap_items; dropa `roadmap_quarters`/`team_members`; cria `origem-studio`; bootstrap só nathy).

- [ ] **Step 2: Snapshot do estado atual (para conferência)**

Via Supabase MCP `list_tables` (schema `public`, verbose) ou SQL Editor:
```sql
select table_name from information_schema.tables where table_schema='public' order by 1;
```
Anotar que `roadmap_quarters` e `team_members` ainda existem, e que `tasks` tem `assignees`/`comments`.

- [ ] **Step 3: Aplicar a migração**

Preferir Supabase MCP `apply_migration` (name: `multiprojeto`, query = conteúdo do arquivo) OU colar no SQL Editor e Run.
Expected: sucesso, sem erro. (É transacional: `begin;`/`commit;`.)

- [ ] **Step 4: Verificar pós-migração**

```sql
select column_name from information_schema.columns
  where table_schema='public' and table_name='profiles' order by 1;
```
Expected: inclui `email`.
```sql
select column_name from information_schema.columns
  where table_schema='public' and table_name='tasks' and column_name in ('project_id','assignee_names','comments_count','display_id');
```
Expected: 4 linhas.
```sql
select p.slug, pr.email, pm.role
  from public.project_members pm
  join public.projects p on p.id = pm.project_id
  join public.profiles pr on pr.id = pm.user_id;
```
Expected: `origem-studio | nathy@origemstudio.com.br | owner`.
```sql
select to_regclass('public.roadmap_quarters'), to_regclass('public.team_members');
```
Expected: ambos `null` (dropados).

- [ ] **Step 5: Remover a migração v2 incompleta e commitar**

```bash
git rm docs/supabase-migration-v2.sql
git add docs/supabase-migration-multiprojeto.sql
git commit -m "feat(db): migração multi-projeto reconciliada com schema real

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Corrigir leituras de coluna no frontend

**Files:**
- Modify: `src/api/assets.ts`, `src/api/brainstorm.ts`, `src/api/gdd.ts`, `src/api/tasks.ts`

**Interfaces:**
- Consumes: schema da Task 2.
- Produces: funções `fetch*` alinhadas às colunas reais.

> Contexto: o merge de `main` foi abortado; esses arquivos já estão na versão local de `trabalho-local`. As edições abaixo são pontuais sobre elas.

- [ ] **Step 1: assets.ts — coluna `by`, sem order por created_at**

`fetchAssets(projectId)` em `src/api/assets.ts`:
```ts
export async function fetchAssets(projectId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;

  return (data ?? []).map((a) => ({
    name: a.name as string,
    type: (a.type as string) ?? '—',
    size: (a.size as string) ?? '—',
    by: (a.by as string) ?? '—',
  }));
}
```

- [ ] **Step 2: brainstorm.ts — coluna `text`**

`fetchBrainstormNotes(projectId)` em `src/api/brainstorm.ts`:
```ts
export async function fetchBrainstormNotes(projectId: string): Promise<BrainstormNote[]> {
  const { data, error } = await supabase
    .from('brainstorm_notes')
    .select('*')
    .eq('project_id', projectId);

  if (error) throw error;

  return (data ?? []).map((n) => ({
    text: n.text as string,
    color: (n.color as string) ?? 'accent',
    x: (n.x as number) ?? 0,
    y: (n.y as number) ?? 0,
  }));
}
```
Manter `import { type BrainstormNote } from '@/lib/data';`.

- [ ] **Step 3: gdd.ts — coluna `body`**

`fetchGddSections(projectId)` em `src/api/gdd.ts`:
```ts
export async function fetchGddSections(projectId: string): Promise<GddSection[]> {
  const { data, error } = await supabase
    .from('gdd_sections')
    .select('*')
    .eq('project_id', projectId)
    .order('key');

  if (error) throw error;

  return (data ?? []).map((s) => ({
    key: (s.key as string) ?? (s.id as string),
    label: (s.label as string) ?? (s.title as string),
    title: s.title as string,
    body: (s.body as string) ?? '',
  }));
}
```

- [ ] **Step 4: tasks.ts — label vem de `c.label`**

Em `src/api/tasks.ts`, dentro de `fetchColumns`, no `return (cols ?? []).map(...)`, usar:
```ts
    label: c.label as string,
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc -b
```
Expected: sem erros (assinaturas `fetch*(projectId)` batem com `src/queries/hooks.ts`).

- [ ] **Step 6: Commit**

```bash
git add src/api/assets.ts src/api/brainstorm.ts src/api/gdd.ts src/api/tasks.ts
git commit -m "fix(api): alinhar leituras de coluna ao schema (by/text/body/label)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Verificação de runtime da Fase 1

**Files:** nenhum.

- [ ] **Step 1: Subir**

```bash
npm run dev
```
Expected: serve em `http://localhost:5173/`.

- [ ] **Step 2: Login (manual)**

Logar como `nathy@origemstudio.com.br`. Expected: entra (sem "não vinculado ao projeto"); telas carregam vazias.

- [ ] **Step 3: Fluxo de dados (manual)**

- Kanban: criar task → aparece em Backlog com id `TASK-2xx`; mover persiste após reload.
- Bugs: criar bug → id `BUG-22xx`; alterar status persiste.
- GDD/Roadmap/Brainstorm/Assets: abrem sem erro (vazias).

- [ ] **Step 4: Marco (commit vazio opcional)**

```bash
git commit --allow-empty -m "chore: Fase 1 (multi-projeto) verificada em runtime

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

# FASE 2 — Convite por email

Entrega: owner/admin convida por email na tela Equipe; convidado define senha, loga e aparece na Equipe. Quem não é owner/admin não vê o botão e é bloqueado no backend.

## Estrutura de arquivos (Fase 2)

- Create: `supabase/functions/invite-user/index.ts`, `src/api/invites.ts`, `src/components/dialogs/invite-dialog.tsx`
- Modify: `src/queries/mutations.ts`, `src/screens/team.tsx`, `src/auth/auth-context.tsx`

---

### Task 5: Edge Function `invite-user`

**Files:**
- Create: `supabase/functions/invite-user/index.ts`

**Interfaces:**
- Consumes: `project_members` (autorização), Auth Admin API.
- Produces: endpoint `invite-user` aceitando `{ email, name?, role, projectId }` → `{ ok: true }` ou erro.

- [ ] **Step 1: Escrever a função**

Criar `supabase/functions/invite-user/index.ts`:
```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (!token) return json({ error: 'Não autenticado' }, 401);

  const admin = createClient(url, serviceKey);

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: 'Sessão inválida' }, 401);
  const callerId = userData.user.id;

  let body: { email?: string; name?: string; role?: string; projectId?: string };
  try { body = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const { email, name, projectId } = body;
  const role = body.role === 'admin' ? 'admin' : body.role === 'owner' ? 'owner' : 'member';
  if (!email || !projectId) return json({ error: 'email e projectId obrigatórios' }, 400);

  // Chamador é owner/admin do projeto?
  const { data: adminRow } = await admin
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', callerId)
    .in('role', ['owner', 'admin'])
    .maybeSingle();
  if (!adminRow) return json({ error: 'Apenas owner/admin podem convidar' }, 403);

  let invitedId: string | null = null;
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name: name ?? email },
  });
  if (inviteErr) {
    const { data: list } = await admin.auth.admin.listUsers();
    const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!existing) return json({ error: inviteErr.message }, 409);
    invitedId = existing.id;
  } else {
    invitedId = invited.user?.id ?? null;
  }
  if (!invitedId) return json({ error: 'Falha ao obter usuário convidado' }, 500);

  const { error: linkErr } = await admin
    .from('project_members')
    .upsert({ project_id: projectId, user_id: invitedId, role }, { onConflict: 'project_id,user_id' });
  if (linkErr) return json({ error: linkErr.message }, 500);

  return json({ ok: true }, 200);
});

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
```

- [ ] **Step 2: Deploy**

Supabase MCP `deploy_edge_function` (name `invite-user`) OU CLI:
```bash
supabase functions deploy invite-user
```
Expected: deploy ok. `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` são injetados automaticamente no ambiente de Edge Functions.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/invite-user/index.ts
git commit -m "feat(functions): edge function invite-user (valida owner/admin)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: Cliente de convite + expor papel no auth-context

**Files:**
- Create: `src/api/invites.ts`
- Modify: `src/auth/auth-context.tsx`, `src/queries/mutations.ts`

**Interfaces:**
- Consumes: Edge Function `invite-user`; `activeProject.id`.
- Produces:
  - `inviteUser(projectId, { email, name?, role }): Promise<void>`
  - `useAuth()` expõe `canInvite: boolean` (true se role owner/admin)
  - `useInviteUser(projectId)` (mutation) que invalida `keys.team`

- [ ] **Step 1: Criar `src/api/invites.ts`**

```ts
import { supabase } from '@/lib/supabase';

export async function inviteUser(
  projectId: string,
  input: { email: string; name?: string; role: 'owner' | 'admin' | 'member' },
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-user', {
    body: { projectId, email: input.email, name: input.name, role: input.role },
  });
  if (error) throw error;
  if (data && (data as { error?: string }).error) {
    throw new Error((data as { error: string }).error);
  }
}
```

- [ ] **Step 2: Expor `canInvite` no auth-context**

Em `src/auth/auth-context.tsx`:
- Adicionar `canInvite: boolean` ao tipo `AuthContextValue`.
- Estado: `const [canInvite, setCanInvite] = React.useState(false);`.
- Em `loadProjectAccess`, no início (junto do reset): `setCanInvite(false);`.
- Após `setActiveProject(data);`:
```ts
      const { data: membership } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', data.id)
        .eq('user_id', nextSession.user.id)
        .maybeSingle();
      setCanInvite(membership?.role === 'owner' || membership?.role === 'admin');
```
- Em `signOut`: `setCanInvite(false);`.
- Incluir `canInvite` no objeto `value` do `useMemo` e nas dependências.

- [ ] **Step 3: Mutation de convite**

Em `src/queries/mutations.ts` adicionar `import { inviteUser } from '@/api/invites';` e:
```ts
export function useInviteUser(projectId: string) {
  const qc = useQueryClient();
  const keys = queryKeys(projectId);
  return useMutation({
    mutationFn: (input: { email: string; name?: string; role: 'owner' | 'admin' | 'member' }) =>
      inviteUser(projectId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.team }),
  });
}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc -b
```
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/api/invites.ts src/auth/auth-context.tsx src/queries/mutations.ts
git commit -m "feat(invites): cliente de convite, mutation e canInvite no auth-context

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: UI de convite na tela Equipe

**Files:**
- Create: `src/components/dialogs/invite-dialog.tsx`
- Modify: `src/screens/team.tsx`

**Interfaces:**
- Consumes: `useInviteUser(projectId)`, `useAuth().canInvite`, `activeProject.id`.
- Produces: botão "Convidar" (só owner/admin) que abre o dialog e dispara o convite.

> O dialog segue o padrão de `src/components/dialogs/bug-dialog.tsx`: `<Dialog><DialogContent title=... footer=...>`, componentes `Input`, `Select`, `Button`. Confirmar esses exports antes de escrever.

- [ ] **Step 1: Criar o dialog**

Criar `src/components/dialogs/invite-dialog.tsx`:
```tsx
import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useInviteUser } from '@/queries/mutations';

const ROLES = [
  { value: 'member', label: 'Membro' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
];

export function InviteDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const invite = useInviteUser(projectId);
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [role, setRole] = React.useState<'owner' | 'admin' | 'member'>('member');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) { setEmail(''); setName(''); setRole('member'); setError(''); }
  }, [open]);

  function submit() {
    if (!email.trim()) return;
    setError('');
    invite.mutate(
      { email: email.trim(), name: name.trim() || undefined, role },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e) => setError(e instanceof Error ? e.message : 'Falha ao convidar'),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Convidar para o projeto"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!email.trim() || invite.isPending}>
              {invite.isPending ? 'Enviando…' : 'Enviar convite'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@exemplo.com" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Nome (opcional)</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Papel</label>
            <Select options={ROLES} value={role} onChange={(e) => setRole(e.target.value as 'owner' | 'admin' | 'member')} />
          </div>
          {error && <p className="text-sm text-[var(--red-400)]">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Botão na tela Equipe**

Em `src/screens/team.tsx`:
- Importar `* as React`, `useAuth` de `@/auth/auth-context`, `Button` de `@/components/ui/button`, `InviteDialog`.
- Obter `const { activeProject, canInvite } = useAuth();` e `const projectId = activeProject?.id ?? '';`.
- Estado: `const [inviteOpen, setInviteOpen] = React.useState(false);`.
- No `TopBar` da tela, passar `actions={canInvite ? <Button onClick={() => setInviteOpen(true)}>Convidar</Button> : undefined}` (seguir a assinatura de `actions` já usada em outras telas, ex. brainstorm/assets).
- Renderizar `<InviteDialog projectId={projectId} open={inviteOpen} onOpenChange={setInviteOpen} />` dentro do fragmento retornado.

- [ ] **Step 3: Typecheck**

```bash
npx tsc -b
```
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/dialogs/invite-dialog.tsx src/screens/team.tsx
git commit -m "feat(team): dialog de convite visível só para owner/admin

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: Verificação de runtime da Fase 2

**Files:** nenhum.

- [ ] **Step 1: Logar como nathy (owner)**

`npm run dev` → login nathy. Expected: botão "Convidar" visível na tela Equipe.

- [ ] **Step 2: Convidar (manual)**

Convidar um email de teste como "Membro". Expected: sucesso; email de convite chega; convidado define senha, loga e aparece na Equipe.

- [ ] **Step 3: Verificação negativa (manual)**

Logar como um `member` (ex.: o convidado). Expected: sem botão "Convidar". Chamada direta à função como member → 403.

- [ ] **Step 4: Marco (opcional)**

```bash
git commit --allow-empty -m "chore: Fase 2 (convite) verificada em runtime

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-review

- **Cobertura do spec:** §1 migração → Task 2 + arquivo `docs/supabase-migration-multiprojeto.sql`; §2 RLS/roles → migração (§11-12); §3 correções frontend → Task 3; §4 convite → Tasks 5-7; §5 .env → Task 1; §6 verificação → Tasks 4 e 8. Zerar/bootstrap → migração (§8-10). Fase 3 → plano separado.
- **Consistência de tipos:** `inviteUser(projectId, {email,name?,role})` ⇄ `useInviteUser` ⇄ `InviteDialog.invite.mutate({email,name?,role})`. `canInvite` definido no auth-context e consumido em team.tsx. Papéis `'owner'|'admin'|'member'` iguais em invites.ts, mutations.ts, dialog e função.
- **Reconciliação com banco real:** migração usa `add column if not exists`/`create ... if not exists`; adiciona `email`(profiles) e `quarter`(roadmap_items); dropa `roadmap_quarters`/`team_members`; check de role inclui `owner`; bootstrap só nathy; limpa linha órfã.
