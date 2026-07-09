# Reordenar dentro da coluna (multi-container sortable) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir reordenar cards dentro da coluna e mover entre colunas na posição exata, com preview ao vivo, via `@dnd-kit/sortable` (multi-container).

**Architecture:** Função pura `moveTaskInColumns` calcula o novo arranjo dado (active, over); os handlers do `DndContext` usam-na para preview otimista no cache do Query (`onDragOver`/`onDragEnd`) e persistem via `moveTask({...,toIndex})`; `KanbanCard` vira `useSortable`; cada coluna é um `SortableContext` droppable.

**Tech Stack:** React 18.3, TypeScript, TanStack Query 5, Zustand 5, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, @dnd-kit/utilities 3.2.2, Vite 8.

## Global Constraints

- **Persistência em memória** (recarregar zera). Optimistic via cache do Query.
- **Proibido `useState`/`useEffect` para dados de servidor.** Estado de drag (`activeTask`) e dialog são UI → `useState` local ok.
- **Clique-pra-editar preservado**: `PointerSensor` com `activationConstraint: { distance: 5 }`.
- **Verificação:** função pura testada no console; `tsc` + `build`; screenshots; best-effort de drag sintético; console limpo. Validação fina do arrasto é manual.
- **Após instalar dep, se o preview der "Invalid hook call": reiniciar dev server (`rm -rf node_modules/.vite`).**
- **Commits atômicos** em PT-BR com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Criar:**
- `src/lib/reorder.ts` — `findColumnKey`, `findTaskById`, `moveTaskInColumns` (puras)

**Modificar:**
- `package.json` — `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `src/api/tasks.ts` — `moveTask` com `toIndex`
- `src/queries/mutations.ts` — `useMoveTask` (assinatura com `toIndex`; cache gerido pelos handlers)
- `src/components/kanban-card.tsx` — `useSortable`
- `src/screens/kanban.tsx` — `SortableContext` por coluna + handlers + `DragOverlay`

---

## Task 1: Instalar dependências

**Files:** Modify `package.json`

- [ ] **Step 1: Instalar**

Run:
```bash
npm install @dnd-kit/sortable@10.0.0 @dnd-kit/utilities@3.2.2
```
Expected: ambas em `dependencies`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: adiciona @dnd-kit/sortable e @dnd-kit/utilities

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Função pura de reorder

**Files:** Create `src/lib/reorder.ts`

**Interfaces:**
- Consumes: tipo `Column` de `@/lib/data`.
- Produces:
  - `findColumnKey(columns: Column[], id: string): string | null`
  - `findTaskById(columns: Column[], id: string): Task | null`
  - `moveTaskInColumns(columns: Column[], activeId: string, overId: string): { columns: Column[]; toColumnKey: string; toIndex: number } | null`

- [ ] **Step 1: Criar `src/lib/reorder.ts`**

```typescript
import { type Column, type Task } from '@/lib/data';

/** Retorna a key da coluna que contém a task `id`, ou a própria key se `id` já é uma coluna. */
export function findColumnKey(columns: Column[], id: string): string | null {
  if (columns.some((c) => c.key === id)) return id;
  const col = columns.find((c) => c.tasks.some((t) => t.id === id));
  return col ? col.key : null;
}

export function findTaskById(columns: Column[], id: string): Task | null {
  for (const c of columns) {
    const t = c.tasks.find((x) => x.id === id);
    if (t) return t;
  }
  return null;
}

/**
 * Calcula o novo arranjo movendo `activeId` para a posição de `overId`.
 * `overId` pode ser um id de task (posição relativa) ou uma key de coluna (append/coluna vazia).
 * Retorna o arranjo imutável + coluna/índice destino, ou null se nada muda / ids inválidos.
 */
export function moveTaskInColumns(
  columns: Column[],
  activeId: string,
  overId: string,
): { columns: Column[]; toColumnKey: string; toIndex: number } | null {
  const fromKey = findColumnKey(columns, activeId);
  const toKey = findColumnKey(columns, overId);
  if (!fromKey || !toKey) return null;

  const from = columns.find((c) => c.key === fromKey)!;
  const to = columns.find((c) => c.key === toKey)!;
  const fromIdx = from.tasks.findIndex((t) => t.id === activeId);
  if (fromIdx < 0) return null;

  const overIsColumn = columns.some((c) => c.key === overId);
  let toIndex = overIsColumn ? to.tasks.length : to.tasks.findIndex((t) => t.id === overId);
  if (toIndex < 0) toIndex = to.tasks.length;

  if (fromKey === toKey) {
    const insertIdx = fromIdx < toIndex ? toIndex - 1 : toIndex;
    if (insertIdx === fromIdx) return null;
    const newTasks = [...from.tasks];
    const [task] = newTasks.splice(fromIdx, 1);
    newTasks.splice(insertIdx, 0, task);
    const newColumns = columns.map((c) => (c.key === fromKey ? { ...c, tasks: newTasks } : c));
    return { columns: newColumns, toColumnKey: toKey, toIndex: insertIdx };
  }

  const task = from.tasks[fromIdx];
  const newFromTasks = from.tasks.filter((t) => t.id !== activeId);
  const newToTasks = [...to.tasks];
  const insertIdx = Math.max(0, Math.min(toIndex, newToTasks.length));
  newToTasks.splice(insertIdx, 0, task);
  const newColumns = columns.map((c) => {
    if (c.key === fromKey) return { ...c, tasks: newFromTasks };
    if (c.key === toKey) return { ...c, tasks: newToTasks };
    return c;
  });
  return { columns: newColumns, toColumnKey: toKey, toIndex: insertIdx };
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/reorder.ts
git commit -m "feat: função pura moveTaskInColumns (reorder/cross-column)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: `moveTask` com índice

**Files:** Modify `src/api/tasks.ts`

**Interfaces:**
- Produces: `moveTask(input: { taskId: string; toColumnKey: string; toIndex: number }): Promise<void>` (assinatura estendida).

- [ ] **Step 1: Substituir a função `moveTask` em `src/api/tasks.ts`**

```typescript
export async function moveTask(input: { taskId: string; toColumnKey: string; toIndex: number }): Promise<void> {
  const from = db.columns.find((c) => c.tasks.some((t) => t.id === input.taskId));
  const to = db.columns.find((c) => c.key === input.toColumnKey);
  if (!from || !to) {
    await persist(null);
    return;
  }
  const fromIdx = from.tasks.findIndex((t) => t.id === input.taskId);
  const [task] = from.tasks.splice(fromIdx, 1);
  const idx = Math.max(0, Math.min(input.toIndex, to.tasks.length));
  to.tasks.splice(idx, 0, task);
  await persist(null);
}
```

- [ ] **Step 2: Verificar typecheck** — vai falhar em `useMoveTask` (assinatura), corrigido na Task 4.

Run: `npx tsc --noEmit`
Expected: erro só em `src/queries/mutations.ts` (uso de `moveTask` sem `toIndex`). É esperado; seguir pra Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/api/tasks.ts
git commit -m "feat: moveTask insere na posição (toIndex)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: `useMoveTask` com índice (cache gerido pelos handlers)

**Files:** Modify `src/queries/mutations.ts`

**Interfaces:**
- Produces: `useMoveTask()` cuja mutação recebe `{ taskId, toColumnKey, toIndex }`.

- [ ] **Step 1: Substituir a função `useMoveTask` em `src/queries/mutations.ts`**

O preview otimista passa a ser responsabilidade dos handlers do DnD (que já setam o cache durante o arrasto). O hook só persiste e reconcilia.

```typescript
export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moveTask,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}
```

Se o import de `type Column` ficar sem uso após remover o `onMutate`, removê-lo da linha de import (`import { type Column } from '@/lib/data';`). Verificar com o typecheck.

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (moveTask agora casa; se sobrar `Column` sem uso e o TS reclamar, remover o import).

- [ ] **Step 3: Commit**

```bash
git add src/queries/mutations.ts
git commit -m "refactor: useMoveTask persiste com toIndex; cache gerido no DnD

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: `KanbanCard` com `useSortable`

**Files:** Modify `src/components/kanban-card.tsx`

**Interfaces:**
- Consumes: `useSortable` de `@dnd-kit/sortable`; `CSS` de `@dnd-kit/utilities`.
- Produces: `KanbanCard` sortable (mesma prop `onEdit`).

- [ ] **Step 1: Trocar imports no topo de `src/components/kanban-card.tsx`**

Trocar:
```typescript
import { useDraggable } from '@dnd-kit/core';
```
por:
```typescript
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

- [ ] **Step 2: Trocar o corpo do hook e o `style`**

Trocar:
```tsx
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 50 : undefined }
    : undefined;
```
por:
```tsx
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
```

Isso exige `React` para o tipo `React.CSSProperties` — adicionar no topo:
```typescript
import * as React from 'react';
```
(O restante do JSX — `ref={setNodeRef}`, `style`, `onClick={onEdit}`, `{...listeners}`, `{...attributes}` — permanece igual.)

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (mas o Kanban ainda usa o padrão antigo; a integração é a Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/components/kanban-card.tsx
git commit -m "feat: KanbanCard usa useSortable

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Kanban — multi-container sortable

**Files:** Modify `src/screens/kanban.tsx` (reescrita)

**Interfaces:**
- Consumes: `DndContext`, `DragOverlay`, `PointerSensor`, `useSensor`, `useSensors`, `closestCorners`, `useDroppable`, `type DragStartEvent`, `type DragOverEvent`, `type DragEndEvent` de `@dnd-kit/core`; `SortableContext`, `verticalListSortingStrategy` de `@dnd-kit/sortable`; `useQueryClient` de `@tanstack/react-query`; `moveTaskInColumns`, `findColumnKey`, `findTaskById` de `@/lib/reorder`; `queryKeys`.

- [ ] **Step 1: Substituir todo o conteúdo de `src/screens/kanban.tsx`**

```tsx
import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar } from '@/components/top-bar';
import { Button } from '@/components/ui/button';
import { KanbanCard } from '@/components/kanban-card';
import { useColumns } from '@/queries/hooks';
import { useMoveTask } from '@/queries/mutations';
import { queryKeys } from '@/queries/keys';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
import { TaskDialog } from '@/components/dialogs/task-dialog';
import { Select } from '@/components/ui/select';
import { FilterBar } from '@/components/filter-bar';
import { useFilterStore } from '@/stores/filter-store';
import { moveTaskInColumns, findColumnKey, findTaskById } from '@/lib/reorder';
import { cn } from '@/lib/utils';
import { type Column, type Task } from '@/lib/data';

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'Todas prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

function KanbanColumn({ col, onEditTask }: { col: Column; onEditTask: (task: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.key });
  return (
    <div
      ref={setNodeRef}
      className={cn('w-[250px] flex flex-col gap-2.5 shrink-0 rounded-lg transition-colors', isOver && 'bg-[var(--bg-hover)]')}
    >
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-xs font-semibold text-secondary uppercase tracking-wide">{col.label}</span>
        <span className="text-[11px] font-mono text-disabled">{col.tasks.length}</span>
      </div>
      <SortableContext items={col.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 min-h-[60px]">
          {col.tasks.map((t) => (
            <KanbanCard key={t.id} task={t} onEdit={() => onEditTask(t)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

type DialogState = null | { mode: 'create' } | { mode: 'edit'; task: Task };

export function KanbanBoard() {
  const { data: columns, isLoading, isError } = useColumns();
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const moveTask = useMoveTask();
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filter = useFilterStore((s) => s.kanban);
  const setFilter = useFilterStore((s) => s.setKanbanFilter);
  const clearFilter = useFilterStore((s) => s.clearKanban);

  const allTags = Array.from(new Set((columns ?? []).flatMap((c) => c.tasks.flatMap((t) => t.tags)))).sort();
  const allAssignees = Array.from(new Set((columns ?? []).flatMap((c) => c.tasks.flatMap((t) => t.assignees)))).sort();

  function matchTask(t: Task): boolean {
    const q = filter.text.trim().toLowerCase();
    if (q && !`${t.title} ${t.id}`.toLowerCase().includes(q)) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.tag && !t.tags.includes(filter.tag)) return false;
    if (filter.assignee && !t.assignees.includes(filter.assignee)) return false;
    return true;
  }

  const displayColumns = columns?.map((c) => ({ ...c, tasks: c.tasks.filter(matchTask) }));
  const hasActiveFilter = !!(filter.text || filter.priority || filter.tag || filter.assignee);
  const totalTasks = displayColumns?.reduce((sum, c) => sum + c.tasks.length, 0) ?? 0;

  function handleDragStart(event: DragStartEvent) {
    if (!columns) return;
    setActiveTask(findTaskById(columns, event.active.id as string));
  }

  function handleDragOver(event: DragOverEvent) {
    const overId = event.over?.id as string | undefined;
    if (!overId || !columns) return;
    const activeId = event.active.id as string;
    const fromKey = findColumnKey(columns, activeId);
    const toKey = findColumnKey(columns, overId);
    if (!fromKey || !toKey || fromKey === toKey) return; // só transfere entre colunas ao vivo
    const result = moveTaskInColumns(columns, activeId, overId);
    if (result) qc.setQueryData(queryKeys.columns, result.columns);
  }

  function handleDragEnd(event: DragEndEvent) {
    const overId = event.over?.id as string | undefined;
    setActiveTask(null);
    if (!overId || !columns) return;
    const activeId = event.active.id as string;
    const result = moveTaskInColumns(columns, activeId, overId);
    if (!result) return;
    qc.setQueryData(queryKeys.columns, result.columns);
    moveTask.mutate({ taskId: activeId, toColumnKey: result.toColumnKey, toIndex: result.toIndex });
  }

  return (
    <>
      <TopBar
        title="Kanban — Skyline Racer"
        subtitle={`${totalTasks} tarefas ativas`}
        actions={<Button onClick={() => setDialog({ mode: 'create' })}>+ Nova tarefa</Button>}
      />
      <FilterBar
        search={filter.text}
        onSearch={(v) => setFilter({ text: v })}
        onClear={clearFilter}
        hasActiveFilter={hasActiveFilter}
      >
        <Select
          className="w-[170px]"
          options={PRIORITY_FILTER_OPTIONS}
          value={filter.priority}
          onChange={(e) => setFilter({ priority: e.target.value })}
        />
        <Select
          className="w-[150px]"
          options={[{ value: '', label: 'Todas tags' }, ...allTags.map((t) => ({ value: t, label: t }))]}
          value={filter.tag}
          onChange={(e) => setFilter({ tag: e.target.value })}
        />
        <Select
          className="w-[170px]"
          options={[{ value: '', label: 'Todos responsáveis' }, ...allAssignees.map((a) => ({ value: a, label: a }))]}
          value={filter.assignee}
          onChange={(e) => setFilter({ assignee: e.target.value })}
        />
      </FilterBar>
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !columns ? (
          <ScreenError />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 min-w-max h-full">
              {displayColumns!.map((col) => (
                <KanbanColumn key={col.key} col={col} onEditTask={(task) => setDialog({ mode: 'edit', task })} />
              ))}
            </div>
            <DragOverlay>{activeTask ? <KanbanCard task={activeTask} /> : null}</DragOverlay>
          </DndContext>
        )}
      </div>
      <TaskDialog
        open={dialog !== null}
        task={dialog?.mode === 'edit' ? dialog.task : undefined}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
      />
    </>
  );
}
```

- [ ] **Step 2: Instalação já feita (Task 1); reiniciar dev server se necessário**

Como novas deps entraram (Task 1), se o preview acusar "Invalid hook call" ao abrir: `preview_stop`, `rm -rf node_modules/.vite`, `preview_start`.

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Verificar no preview (best-effort + visual)**

1. Board renderiza igual; cards arrastáveis (cursor-grab), clique curto ainda abre edição.
2. Best-effort de drag sintético: reordenar dois cards na mesma coluna; mover um card pra outra coluna.
3. Screenshot do board.

- [ ] **Step 5: Commit**

```bash
git add src/screens/kanban.tsx
git commit -m "feat: Kanban multi-container sortable (reorder + cross-column com índice)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Teste da função pura no console**

No preview (`preview_eval`), importar não é trivial; em vez disso, validar via um teste inline que reproduz a lógica OU (preferível) rodar um teste rápido no Node importando o módulo compilado não é viável com alias. Então: validar `moveTaskInColumns` reproduzindo casos no navegador não é direto — em vez disso, confiar no comportamento observável do board (reorder/cross/coluna vazia) + revisão da função. Documentar os casos exercitados:
- reorder dentro da coluna (dois cards trocam de ordem);
- mover pra outra coluna soltando sobre um card específico (entra na posição);
- soltar em coluna vazia (entra na coluna);
- soltar fora (over null) → nada muda.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 3: Regressão + best-effort no preview (server limpo)**

`preview_stop` → `rm -rf node_modules/.vite` → `preview_start`. Então:
1. Reordenar dentro da coluna (best-effort sintético) e conferir nova ordem persistir ao trocar de tela.
2. Mover entre colunas em posição.
3. Criar / editar (clique) / excluir seguem ok; filtro segue ok.
4. Console (`preview_console_logs`) sem erros/warnings.

- [ ] **Step 4: Commit final (se houver ajuste)**

---

## Self-Review

**Cobertura do spec:**
- Deps sortable/utilities → Task 1 ✓
- Função pura `moveTaskInColumns` (+ helpers) → Task 2 ✓
- `moveTask` com índice → Task 3 ✓
- `useMoveTask` com índice, cache no DnD → Task 4 ✓
- `KanbanCard` useSortable → Task 5 ✓
- DnD multi-container (SortableContext, droppable, onDragStart/Over/End, DragOverlay, closestCorners) → Task 6 ✓
- Convivência com filtro/clique-editar → preservado na Task 6 ✓
- Verificação (função pura/observável + build + best-effort + manual) → Tasks 6–7 ✓
- Fora de escopo (a11y teclado, persistência além da sessão) → respeitado ✓

**Placeholders:** nenhum; código completo.

**Consistência de tipos:** `moveTask({taskId,toColumnKey,toIndex})` (Task 3) casa com `useMoveTask` (Task 4) e com a chamada em `handleDragEnd` (Task 6, via `result.toColumnKey`/`result.toIndex`). `moveTaskInColumns` (Task 2) retorna `{columns,toColumnKey,toIndex}` consumido em `handleDragOver`/`handleDragEnd` (Task 6). `findColumnKey`/`findTaskById` (Task 2) usados na Task 6. `KanbanCard` (Task 5) usa `useSortable` e é renderizado dentro de `SortableContext` (Task 6) e no `DragOverlay`. `queryKeys.columns` já existe.

**Nota de risco:** o par `onDragOver` (transfere entre colunas) + `onDragEnd` (finaliza no índice) é o ponto sensível; a função pura isola a lógica pra reduzir erro. Verificação sintética é imprecisa pro sortable — validação fina do arrasto é manual (combinado com a Nathalia).
