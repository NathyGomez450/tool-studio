# Design — Multi-projeto + Convite por email

**Data:** 2026-07-09
**Branch de trabalho:** `trabalho-local`
**Status:** Aprovado na conversa; aguardando revisão do spec escrito

## Contexto e problema

O repositório tem duas linhas de desenvolvimento divergentes:

- **`main`** (remoto, já puxado): arquitetura *single-project*, schema flat (`supabase/schema.sql`) funcional e aplicado no banco. Auth por email/senha. As mensagens de commit `"Before: Implementar convite por email..."` são checkpoints automáticos de ferramenta de IA (registram o *pedido*, não a entrega) — **não existe código de convite no `main`**.
- **`trabalho-local`** (trabalho não commitado, agora salvo em branch): arquitetura *multi-projeto*. Todo o acesso a dados é escopado por `project_id`; `auth-context.tsx` carrega o projeto de slug fixo `origem-studio` e expõe `activeProject`; `team.ts` já consulta `project_members` + `profiles`; `tasks.ts` já usa `display_id`/`assignee_names`/`comments_count`.

O código de `trabalho-local` foi escrito para um schema que **não existe** no banco atual. A `docs/supabase-migration-v2.sql` tentava cobrir isso, mas está **incompleta**: referencia `roadmap_items`, `profiles`, `project_members` sem criá-los e não adiciona `project_id` em nenhuma tabela.

**Decisão de direção (usuário):** seguir a arquitetura multi-projeto de `trabalho-local`. O `main` não será mesclado; dele aproveita-se apenas o `.env`.

## Objetivo

1. Fazer a branch multi-projeto **buildar e rodar** contra um banco migrado.
2. Adicionar **convite por email** (admin convida → pessoa define senha → acessa), eliminando a criação manual de usuários no painel do Supabase.
3. Dar **backend funcional (CRUD)** às páginas hoje só de leitura: **GDD, Roadmap, Brainstorm e Assets** (Assets com upload real via Supabase Storage).

Design cobre três fases; a implementação pode ser faseada (Fase 1: multi-projeto rodando; Fase 2: convite; Fase 3: CRUD das páginas).

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Estado do banco hoje | **Híbrido meio-migrado** (verificado via Supabase MCP em 2026-07-09) — ver seção abaixo. Migração deve reconciliar com a realidade, não com o schema do `main`. |
| Direção | Multi-projeto (código de `trabalho-local` é a fonte de verdade) |
| Convite | Desejado; mecanismo = **Edge Function** com service_role |
| Papéis | `owner` + `admin` + `member` (`project_members.role`). `owner` e `admin` podem convidar; `member` não. |
| Quem convida | Só `owner`/`admin` |
| Tela Equipe | Dados fictícios removidos; Equipe = pessoas reais (via `project_members` + `profiles`) |
| Dados de seed (conteúdo) | **Zerar tudo** — na prática já está vazio (0 linhas nas tabelas de conteúdo) |
| Colunas do Kanban | Semear as 5 colunas padrão para o origem-studio (estrutura necessária ao board) |
| Bootstrap de acesso | **Só `nathy@origemstudio.com.br`** vira `owner` do origem-studio. Linha órfã de `project_members` (jvtt) é removida; jvtt pode ser convidado depois. |
| `.env` | Trazer para a branch; adicionar ao `.gitignore` e remover do versionamento |

### Estado real do banco (verificado via Supabase MCP — projeto `tool-studio` / `ylovhjbncdmoibeoandi`)

O banco **não** é o schema flat do `main`. Alguém rodou migrações parciais, deixando um híbrido inconsistente:

- **Existem** `profiles` (mas **sem coluna `email`**; tem `id, name, role, created_at`), `project_members` (com **1 linha órfã**: role `owner`, apontando para um `project_id` inexistente), e `roadmap_items` (com **`due_date`, sem `quarter`** — o código usa `quarter`).
- **Ainda existem** `roadmap_quarters` (0 linhas) e `team_members` (0 linhas).
- `tasks`, `bugs`, `kanban_columns`, `gdd_sections`, `assets`, `brainstorm_notes` **não têm `project_id`**; `tasks` tem `assignees`/`comments` (não `assignee_names`/`comments_count`) e nenhum `display_id`.
- **`projects` e `profiles` estão vazias** → hoje o login não carrega projeto nenhum.
- **2 usuários de auth**: `jvtt@origemstudio.com.br`, `nathy@origemstudio.com.br`. Todas as tabelas de conteúdo com 0 linhas.

Implicações para a migração (§1): adicionar `email` a `profiles`; adicionar `quarter` a `roadmap_items`; dropar `roadmap_quarters` e `team_members`; adicionar `project_id` às tabelas de conteúdo; renomear colunas de `tasks`; criar o projeto `origem-studio`; limpar a linha órfã; bootstrap da nathy como `owner`; backfill de `profiles` para os 2 usuários.

## Arquitetura

```
Browser (React + Vite)
  ├─ auth-context: supabase.auth (email/senha) → carrega projeto por slug → activeProject
  ├─ queries/hooks: todas escopadas por projectId (React Query)
  ├─ api/*.ts: leitura/escrita no Supabase, filtradas por project_id
  └─ Team screen: botão "Convidar" (admin) → functions.invoke('invite-user')
        │
        ▼
Supabase
  ├─ Postgres + RLS (is_project_member / is_project_admin)
  ├─ Auth (auth.users) + trigger → profiles
  └─ Edge Function invite-user (service_role): valida admin, inviteUserByEmail, vincula project_members
```

## 1. Migração do banco

Arquivo novo: `docs/supabase-migration-multiprojeto.sql` (substitui a `migration-v2` incompleta, que será removida). Aplicada manualmente no SQL Editor do Supabase, **após** o schema atual. Idempotente onde possível (`if not exists`).

### 1.1 Novas tabelas

- **`profiles`**: `id uuid primary key references auth.users(id) on delete cascade`, `email text`, `name text`, `created_at timestamptz default now()`.
  - Trigger `handle_new_user()` `SECURITY DEFINER` em `auth.users` (after insert): insere `profiles` com `id`, `email`, `name = coalesce(raw_user_meta_data->>'name', email)`.
- **`project_members`**: `project_id uuid references projects(id) on delete cascade`, `user_id uuid references profiles(id) on delete cascade`, `role text not null default 'member' check (role in ('admin','member'))`, `created_at timestamptz default now()`, `primary key (project_id, user_id)`.

### 1.2 Alterações em tabelas existentes

- Adicionar `project_id uuid references projects(id) on delete cascade` em: `tasks`, `bugs`, `kanban_columns`, `gdd_sections`, `assets`, `brainstorm_notes` (e em `roadmap_items`, criada abaixo).
- **`tasks`**: `rename column assignees to assignee_names`; `rename column comments to comments_count`; `add column display_id text`; `create sequence task_display_seq start 200`; trigger `generate_task_display_id` (before insert) preenche `TASK-<nextval>` quando nulo.
- **`bugs`**: `add column display_id text`; `create sequence bug_display_seq start 2240`; trigger `generate_bug_display_id` análogo.
- **`roadmap_items`** (converter de `roadmap_quarters`): criar `roadmap_items(id uuid pk default gen_random_uuid(), project_id uuid, quarter text, title text, status text, position int)`; **como o conteúdo será zerado, não é necessário migrar dados** de `roadmap_quarters`; dropar `roadmap_quarters`.
- **`team_members`**: `drop table` (fictício; Equipe agora vem de `project_members`+`profiles`).

### 1.3 Zerar conteúdo e backfill

- Garantir projeto: `insert into projects(name, slug) values ('Origem Studio','origem-studio') on conflict (slug) do nothing`.
- `delete` em `tasks`, `bugs`, `gdd_sections`, `assets`, `brainstorm_notes`, `roadmap_items` (começar limpo).
- **Kanban**: manter as 5 colunas padrão (`backlog`, `todo`, `doing`, `review`, `done`) para o origem-studio (o board precisa delas; `createTask` procura a coluna `backlog`). `update kanban_columns set project_id = <origem-studio>` para as existentes.

### 1.4 Bootstrap de acesso

- `insert into profiles (id,email,name) select id, email, coalesce(raw_user_meta_data->>'name', email) from auth.users on conflict do nothing`.
- `insert into project_members (project_id, user_id, role) select <origem-studio>, id, 'admin' from auth.users on conflict do nothing`.

## 2. Controle de acesso (RLS)

- Funções `SECURITY DEFINER`, `search_path` fixo:
  - `is_project_member(pid uuid) returns boolean`: `exists(select 1 from project_members where project_id = pid and user_id = auth.uid())`.
  - `is_project_admin(pid uuid) returns boolean`: idem com `role = 'admin'`.
- Habilitar RLS e definir policies:
  - Tabelas de dados (`tasks`, `bugs`, `kanban_columns`, `roadmap_items`, `gdd_sections`, `assets`, `brainstorm_notes`): `for all using (is_project_member(project_id)) with check (is_project_member(project_id))`.
  - `projects`: `for select using (is_project_member(id))`.
  - `project_members`: `select using (is_project_member(project_id))`; `insert/update/delete using (is_project_admin(project_id))`.
  - `profiles`: `select` para perfis de membros de projetos que o usuário compartilha; `insert` só via trigger (definer).
- A Edge Function usa service_role e **contorna RLS** — a autorização de admin é feita explicitamente no código da função.

> Substitui as policies permissivas (`using (true)`) do schema atual.

## 3. Correções no frontend

Resolver os 8 conflitos de merge adotando a versão local **corrigida** (não a do `main`):

- `src/api/assets.ts`: `a.uploaded_by → a.by`; remover `.order('created_at', …)` (coluna inexistente); manter filtro `project_id`.
- `src/api/brainstorm.ts`: `n.title → n.text`.
- `src/api/gdd.ts`: `s.content → s.body`.
- `src/api/tasks.ts` (`fetchColumns`): `c.title → c.label`.
- `src/api/{bugs,dashboard,roadmap,team}.ts`: manter versão local (já corretas para o schema-alvo).

Como o merge de `main` foi abortado, na prática esses arquivos já estão na versão local em `trabalho-local`; as correções acima são edições pontuais sobre eles. O `main` não será mesclado.

## 4. Convite por email

### 4.1 Edge Function `invite-user` (`supabase/functions/invite-user/index.ts`)

- Runtime Deno. Lê `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do ambiente da função.
- Entrada (POST JSON): `{ email, projectId, role: 'admin'|'member', name? }`.
- **Autorização**: extrai o JWT do header `Authorization`; obtém `uid` do chamador; verifica `is_project_admin(projectId)` (via client autenticado ou consulta a `project_members`). Se não for admin → 403.
- **Ação**: `adminClient.auth.admin.inviteUserByEmail(email, { data: { name }, redirectTo: <app-url>/set-password })`.
  - Se o usuário já existe: recuperar `user_id` e apenas vincular.
- Insere `project_members(projectId, novoUserId, role)` (`on conflict do nothing`).
- Respostas: 200 (ok), 400 (input), 401/403 (auth), 409/500 conforme o caso.

### 4.2 Frontend

- `src/api/invites.ts`: `inviteUser({ email, name, role })` → `supabase.functions.invoke('invite-user', { body: { email, name, role, projectId } })`.
- Hook/mutation em `queries/` que invalida a query de Equipe ao concluir.
- **Tela Equipe** (`src/screens/team.tsx`): botão "Convidar" visível só se o usuário for admin do projeto (derivar de `project_members`/contexto). Dialog com campos email, nome, papel. Feedback de sucesso/erro.
- **Fluxo do convidado**: clica no link do email → define senha → loga → `auth-context.onAuthStateChange` dispara `loadProjectAccess` → acha o vínculo em `project_members` (via RLS) → `activeProject` carrega. Tela de definição de senha (`redirectTo`) a validar na Fase 2.

## 5. Config / infra

- Restaurar `.env` na branch de trabalho com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (do `main`).
- Adicionar `.env` ao `.gitignore` e `git rm --cached .env` (remover segredos do versionamento).
- Deploy da Edge Function via Supabase CLI; configurar secret `SUPABASE_SERVICE_ROLE_KEY` no projeto de funções.
- `@supabase/supabase-js` já consta no `package.json`.

## 6. Verificação

**Fase 1 (multi-projeto):**
- `npx tsc -b` sem erros (assinaturas com `projectId` batem com hooks/screens).
- `npm run dev` sobe; login com usuário existente carrega `activeProject`.
- Telas iniciam vazias (conteúdo zerado); criar task move entre colunas; criar/editar bug; notas de brainstorm; seções de GDD; itens de roadmap — todos persistem escopados por `project_id`.
- Usuário não vinculado a projeto vê a mensagem de acesso negado.

**Fase 2 (convite):**
- Admin convida email de teste → convidado recebe email → define senha → loga → aparece na tela Equipe.
- Não-admin não vê o botão "Convidar"; chamada direta à função por não-admin retorna 403.

## 7. Fase 3 — CRUD das páginas hoje só de leitura

Hoje só Kanban (tasks) e Bugs têm CRUD. GDD, Roadmap, Brainstorm e Assets são somente leitura. Esta fase adiciona criar/editar/excluir persistindo no Supabase, escopado por `project_id`, seguindo o padrão já existente (funções em `src/api/*.ts` + mutations em `src/queries/mutations.ts` que invalidam a query da tela + dialogs no padrão de `bug-dialog.tsx`).

### 7.1 Refactor de tipos (`src/lib/data.ts`)

CRUD por item exige identidade estável. Adicionar `id` onde falta:
- `BrainstormNote`: adicionar `id: string`.
- `Asset`: adicionar `id: string` e `url: string` (link do arquivo no Storage).
- Roadmap: introduzir `RoadmapItem = { id: string; title: string }`; `RoadmapQuarter.items` passa de `string[]` para `RoadmapItem[]`.

### 7.2 GDD (`gdd_sections`)

- API: `createGddSection`, `updateGddSection` (title/label/body), `deleteGddSection`.
- `key` gerado no cliente (`crypto.randomUUID()`); `label` default = `title`.
- UI: botão "+ Seção"; edição do corpo da seção ativa via textarea + salvar; excluir seção. Edição **inline** (textarea na própria tela), não dialog.

### 7.3 Roadmap (`roadmap_items`)

- API: `createRoadmapItem` (quarter, title, status), `updateRoadmapItem` (title/status/quarter), `deleteRoadmapItem`.
- `fetchRoadmap` passa a retornar itens com `id` (agrupados por trimestre como hoje, mas cada item é `{id, title}`).
- UI: adicionar item (informando trimestre + status); editar/excluir por item (dialog simples).

### 7.4 Brainstorm (`brainstorm_notes`)

- API: `createBrainstormNote` (text, color, x, y), `updateBrainstormNote` (text/color/x/y), `deleteBrainstormNote`.
- `fetchBrainstormNotes` passa a incluir `id`.
- UI: botão "+ Nota" cria nota; clicar abre edição (texto + cor) e excluir; **arrastar** a nota atualiza `x/y` (persistido ao soltar). Ver pergunta aberta sobre drag.

### 7.5 Assets (`assets` + Supabase Storage)

- Bucket `assets` no Storage (criado na migração via `storage.buckets` + policies de acesso por membro do projeto). Caminho do objeto: `<projectId>/<uuid>-<filename>`.
- API: `uploadAsset(projectId, file, { type })` → `storage.upload` → insere linha (`name`, `type`, `size` formatado de `file.size`, `by` = nome/email do usuário atual, `project_id`, `url`); `deleteAsset` → remove objeto do Storage + linha.
- `type` do asset: escolhido pelo usuário num dropdown (Modelo 3D, Textura, Áudio, UI, Ambiente, Animação, Outro) — evita inferência frágil por extensão.
- UI: botão "+ Upload" abre seletor de arquivo + dropdown de tipo; card ganha ação de excluir.
- Migração ganha: `alter table assets add column url text` e criação do bucket + policies.

### 7.6 Verificação (Fase 3)

Para cada tela: criar → aparece e persiste após reload; editar → reflete; excluir → some. Assets: upload real sobe arquivo ao bucket e o card mostra; excluir remove do bucket. Tudo escopado por `project_id` e sujeito às policies de membro.

## Fora de escopo (YAGNI)

- Seletor de múltiplos projetos na UI (o slug é fixo `origem-studio` por ora; o schema já suporta vários).
- Papéis além de `admin`/`member`.
- Migrar dados de seed antigos (serão zerados).
- Portar qualquer código do `main` além do `.env`.
- Preview real de arquivos de asset (thumbnails) — o card mantém o placeholder "preview" por ora.
- Reordenação drag-and-drop de itens do roadmap/colunas além do que já existe no Kanban.
