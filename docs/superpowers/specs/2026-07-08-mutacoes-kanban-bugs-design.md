# Design — Mutações (Kanban + Bugs)

**Data:** 2026-07-08
**Projeto:** Origem Studio
**Autor:** Nathalia
**Status:** Aprovado (design)
**Depende de:** [[2026-07-08-migracao-arquitetural-stack-design]] (branch `feat/migracao-arquitetural-stack`)

## Contexto

Após a migração arquitetural (TanStack Query + Zustand + fake API async), o app só
faz leitura. Este 2º passo adiciona **escrita**, exercitando o stack completo:
`useMutation` + invalidação/optimistic update, com persistência na fake API.

## Escopo (4 mutações + DnD)

1. **Criar tarefa** (Kanban) — dialog → nova TASK no Backlog.
2. **Mover card entre colunas** — drag-and-drop real com `@dnd-kit/core`.
3. **Reportar bug** (Bugs) — dialog → novo BUG.
4. **Mudar status de bug** — `Select` inline no Bug Tracker.

## Decisões

- **DnD real** com `@dnd-kit/core@6.3.1` (usuário optou por DnD em vez de controle leve).
- **Persistência:** DB mutável em memória, semeado de `data.ts`. Recarregar a página
  volta ao seed (comportamento esperado de fake API — sem backend real).
- **Optimistic update** só no mover card (DnD precisa de feedback imediato); as outras
  três mutações usam invalidação no `onSuccess`.

## Arquitetura

### 1. DB mutável — `src/api/db.ts`

- Semeado de `data.ts` via `structuredClone` no load do módulo: `columns`, `bugs`.
- Sequências para IDs: `taskSeq` (inicial 200), `bugSeq` (inicial 2240).
- Exporta o objeto `db` mutável + helper `nextTaskId()` / `nextBugId()`.
- Os `fetch*` de `tasks.ts`/`bugs.ts` passam a ler de `db` (não mais de `data.ts`).
- Demais domínios (roadmap, gdd, assets, team, brainstorm, dashboard) continuam lendo
  de `data.ts` direto (não têm escrita neste passo).

### 2. Funções de escrita na fake API

Em `src/api/tasks.ts`:
- `createTask(input: { title: string; priority: Task['priority']; tag?: string }): Promise<Task>`
  → `TASK-<seq>`, `assignees: ['Marina Souza']`, `comments: 0`, `tags: tag ? [tag] : []`; push no Backlog do `db`.
- `moveTask(input: { taskId: string; toColumnKey: string }): Promise<void>`
  → remove a task da coluna atual e adiciona (append) na coluna destino do `db`. No-op se já estiver lá.

Em `src/api/bugs.ts`:
- `createBug(input: { title: string; severity: Bug['severity'] }): Promise<Bug>`
  → `BUG-<seq>`, `status: 'aberto'`, `assignee: 'Marina Souza'`, `when: 'agora'`; unshift no topo de `db.bugs`.
- `updateBugStatus(input: { bugId: string; status: Bug['status'] }): Promise<Bug>`
  → atualiza `status` do bug no `db`, retorna o bug.

Todas passam por um `commit()`/`sleep` de latência simulada análogo ao `fake()` de leitura.

### 3. Hooks de mutação — `src/queries/mutations.ts`

- `useCreateTask()` — `useMutation({ mutationFn: createTask, onSuccess: invalidate(columns) })`
- `useCreateBug()` — invalida `bugs` no onSuccess
- `useUpdateBugStatus()` — invalida `bugs` no onSuccess
- `useMoveTask()` — **optimistic**:
  - `onMutate`: `cancelQueries(columns)`, snapshot, `setQueryData(columns, …)` movendo a task no cache
  - `onError`: rollback pro snapshot
  - `onSettled`: `invalidateQueries(columns)`

Usa `useQueryClient()` para invalidar/atualizar.

### 4. Drag-and-drop — `src/screens/kanban.tsx` + `src/components/kanban-card.tsx`

- `DndContext` (de `@dnd-kit/core`) envolve o board, com `onDragEnd`.
- `KanbanCard` ganha modo arrastável via `useDraggable` (id = `task.id`). Mantém a
  aparência atual; adiciona `ref`/listeners/attributes e um leve estado visual ao arrastar.
- Cada coluna vira `useDroppable` (id = `col.key`).
- `onDragEnd(active, over)`: se `over` é uma coluna diferente da atual da task → `useMoveTask`.
- Só move entre colunas (append no destino); sem reordenar dentro da coluna.

### 5. Dialogs (shadcn `Dialog` existente)

- `src/components/dialogs/create-task-dialog.tsx` — controlado por `open`/`onOpenChange`;
  `Input` (título, obrigatório), `Select` (prioridade: low/medium/high/critical),
  `Input` (tag, opcional); botões Cancelar/Criar; chama `useCreateTask`, fecha no sucesso.
- `src/components/dialogs/report-bug-dialog.tsx` — `Input` (título), `Select` (severidade);
  chama `useCreateBug`.
- Os botões existentes "+ Nova tarefa" (Kanban) e "+ Reportar bug" (Bugs) abrem os dialogs.

### 6. Status de bug inline — `src/screens/bugs.tsx`

- A célula de status deixa de ser `Badge` estático e vira `Select` com as 4 opções
  (`aberto`, `em análise`, `em correção`, `corrigido`); `onChange` → `useUpdateBugStatus`.

### 7. Contadores dinâmicos

- Kanban subtitle: `${totalTasks} tarefas ativas` derivado de `columns`.
- Bugs subtitle: `${bugs.length} bugs · ${criticosAbertos} críticos` derivado de `bugs`.
- Demais subtítulos inalterados.

## Fora de escopo

- Reordenar cards dentro da mesma coluna.
- Editar/excluir tarefas ou bugs; undo.
- Persistência real (recarregar zera para o seed).
- Validação além de "título não vazio".

## Verificação (preview)

1. Kanban: "+ Nova tarefa" → criar → aparece no Backlog; contador sobe.
2. Arrastar card de uma coluna para outra → fica na nova coluna; sair e voltar da tela
   mantém a posição (persistência no db); sem "piscar" (optimistic).
3. Bugs: trocar status pelo Select → persiste ao trocar de tela.
4. Bugs: "+ Reportar bug" → criar → aparece no topo; contador sobe.
5. Console limpo em todos os fluxos.
