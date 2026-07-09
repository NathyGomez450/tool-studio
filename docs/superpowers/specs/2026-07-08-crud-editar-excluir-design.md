# Design — CRUD editar/excluir (tarefa + bug)

**Data:** 2026-07-08
**Projeto:** Origem Studio
**Autor:** Nathalia
**Status:** Aprovado (design)
**Sub-projeto:** 1/3 do 3º passo (features). Próximos: busca/filtro global, reordenar dentro da coluna.

## Contexto

Após criar/mover/reportar (2º passo), falta completar o CRUD: **editar** e **excluir**
tarefas e bugs. Reusa a infra de mutação e o `db` mutável já existentes.

## Decisões de UX

- **Clique abre edição, arrasto move** (Kanban): `PointerSensor` com
  `activationConstraint: { distance: 5 }` — clique sem mover 5px abre o dialog; arrasto move.
- **Excluir = botão no rodapé do dialog de edição**, com **confirmação inline** (1º clique
  vira "Confirmar exclusão?", 2º confirma). Sem dialog de confirmação separado.

## Arquitetura

### 1. Escritas na fake API

Em `src/api/tasks.ts`:
- `updateTask(input: { taskId: string; title: string; priority: Task['priority']; tags: string[] }): Promise<Task>`
  → acha a task em qualquer coluna do `db`, atualiza `title`/`priority`/`tags`, retorna a task.
- `deleteTask(input: { taskId: string }): Promise<void>` → remove a task da coluna atual.

Em `src/api/bugs.ts`:
- `updateBug(input: { bugId: string; title: string; severity: Bug['severity'] }): Promise<Bug>`
  → atualiza `title`/`severity` no `db`, retorna o bug.
- `deleteBug(input: { bugId: string }): Promise<void>` → remove de `db.bugs`.

Todas usam `persist` (latência simulada) como as demais.

### 2. Hooks de mutação — `src/queries/mutations.ts`

- `useUpdateTask()`, `useDeleteTask()` → invalidam `queryKeys.columns` no `onSuccess`.
- `useUpdateBug()`, `useDeleteBug()` → invalidam `queryKeys.bugs` no `onSuccess`.
(Sem optimistic — invalidação basta; edição/exclusão não têm o problema de "piscar" do drag.)

### 3. Dialogs generalizados (DRY)

- `create-task-dialog.tsx` → **`task-dialog.tsx`** exportando `TaskDialog`:
  - Props: `{ open: boolean; onOpenChange: (v: boolean) => void; task?: Task }`.
  - Sem `task` = **criar** (usa `useCreateTask`). Com `task` = **editar** (pré-preenchido,
    usa `useUpdateTask`) + botão **Excluir** no rodapé (usa `useDeleteTask`).
  - Campo de tags separado por vírgula (`tags.join(', ')` ao abrir; `split(',')` + trim + filtro de vazios ao salvar).
  - Título do dialog: "Nova tarefa" (criar) / "Editar tarefa" (editar).
- `report-bug-dialog.tsx` → **`bug-dialog.tsx`** exportando `BugDialog`, mesmo padrão
  (`bug?: Bug`; criar via `useCreateBug`, editar via `useUpdateBug`, excluir via `useDeleteBug`).
- **Confirmação de exclusão inline:** estado local `confirmingDelete` no dialog; 1º clique no
  "Excluir" ativa, 2º clique executa. Cancelar/fechar reseta.

### 4. Kanban — clique-pra-editar

- `src/screens/kanban.tsx`:
  - `sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))`,
    passado ao `DndContext`.
  - Estado `dialog: DialogState` onde `type DialogState = null | { mode: 'create' } | { mode: 'edit'; task: Task }`.
  - "+ Nova tarefa" → `setDialog({ mode: 'create' })`. Card `onEdit(task)` → `setDialog({ mode: 'edit', task })`.
  - Renderiza `<TaskDialog open={dialog !== null} task={dialog?.mode==='edit' ? dialog.task : undefined} onOpenChange={v => !v && setDialog(null)} />`.
- `src/components/kanban-card.tsx`: adiciona prop `onEdit?: () => void`, chamada no `onClick` do card.
- `KanbanColumn` repassa `onEdit` aos cards.

### 5. Bugs — clique-pra-editar

- `src/screens/bugs.tsx`:
  - Estado `dialog: null | { mode: 'create' } | { mode: 'edit'; bug: Bug }`.
  - "+ Reportar bug" → create. Célula **Título** vira `cursor-pointer` com `onClick` → edit.
  - O `Select` de status inline permanece independente (seu `onChange` não abre o dialog).
  - Renderiza `<BugDialog ... bug={...} />`.

### 6. Estado

`dialog` é `useState` local por tela (UI state). Nenhum dado de API em `useState`/`useEffect`.

## Fora de escopo

- Editar assignees/comentários da tarefa; editar responsável/quando do bug.
- Reordenar dentro da coluna (sub-projeto 3).
- Exclusão em massa; undo/desfazer.

## Verificação (preview)

1. Kanban: clicar num card → dialog de edição pré-preenchido; mudar título/prioridade → persiste (troca de tela e volta).
2. Kanban: arrastar um card ainda move (clique curto edita, arrasto move — sem conflito).
3. Kanban: editar → Excluir (2 cliques) → card some; contador cai.
4. Bugs: clicar no título → editar severidade/título → persiste.
5. Bugs: excluir bug pelo dialog → some; contador cai.
6. Criar (tarefa e bug) continua funcionando pelo mesmo dialog.
7. Console limpo.
