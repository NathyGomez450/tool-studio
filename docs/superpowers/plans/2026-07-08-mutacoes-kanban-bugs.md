# Mutações (Kanban + Bugs) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar escrita ao app (criar tarefa, mover card via drag-and-drop, reportar bug, mudar status de bug) usando `useMutation` com persistência num DB mutável em memória.

**Architecture:** `data.ts` (seed imutável) → `db.ts` (cópia mutável) → `api/*` (fetch + write) → `queries/mutations.ts` (useMutation + invalidação/optimistic) → telas/dialogs. Leituras via TanStack Query já existentes revalidam após cada escrita.

**Tech Stack:** React 18.3, Vite 5, TypeScript, Tailwind 3.4, @tanstack/react-query 5.101.2, zustand 5.0.14, @dnd-kit/core 6.3.1.

## Global Constraints

- **Persistência em memória:** recarregar a página zera para o seed de `data.ts`. É o comportamento esperado.
- **Optimistic update apenas em `moveTask`.** As demais mutações invalidam no `onSuccess`.
- **Proibido `useState`/`useEffect` para dados de servidor.** Estado de formulário (título digitado, etc.) e de UI (dialog aberto) é `useState` local — permitido.
- **Versão exata:** `@dnd-kit/core@6.3.1`.
- **Verificação de cada task:** `npx tsc --noEmit` passa; tasks com efeito visual → dirigir preview em `http://localhost:5173`.
- **Commits atômicos** ao fim de cada task, corpo em PT-BR, com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Criar:**
- `src/api/db.ts` — DB mutável semeado de `data.ts` + geradores de ID + helper `persist`
- `src/queries/mutations.ts` — hooks `useCreateTask`, `useMoveTask`, `useCreateBug`, `useUpdateBugStatus`
- `src/components/dialogs/create-task-dialog.tsx`
- `src/components/dialogs/report-bug-dialog.tsx`

**Modificar:**
- `src/api/tasks.ts` — `fetchColumns` lê do db; adiciona `createTask`, `moveTask`
- `src/api/bugs.ts` — `fetchBugs` lê do db; adiciona `createBug`, `updateBugStatus`
- `src/components/kanban-card.tsx` — suporte a `useDraggable`
- `src/screens/kanban.tsx` — `DndContext`, colunas `useDroppable`, botão abre dialog, contador dinâmico
- `src/screens/bugs.tsx` — status vira `Select`, botão abre dialog, contador dinâmico
- `package.json` — dependência `@dnd-kit/core`

---

## Task 1: DB mutável em memória

**Files:**
- Create: `src/api/db.ts`

**Interfaces:**
- Consumes: `columns`, `bugs`, tipos `Column`/`Bug` de `@/lib/data`; `sleep` de `@/api/client`.
- Produces:
  - `db: { columns: Column[]; bugs: Bug[] }` (mutável)
  - `nextTaskId(): string` — `TASK-<seq>`, seq começa em 200
  - `nextBugId(): string` — `BUG-<seq>`, seq começa em 2240
  - `persist<T>(data: T, ms?: number): Promise<T>` — espera latência e retorna `structuredClone(data)`

- [ ] **Step 1: Criar `src/api/db.ts`**

```typescript
import { sleep, FAKE_LATENCY } from './client';
import { columns, bugs, type Column, type Bug } from '@/lib/data';

export const db: { columns: Column[]; bugs: Bug[] } = {
  columns: structuredClone(columns),
  bugs: structuredClone(bugs),
};

let taskSeq = 200;
let bugSeq = 2240;

export function nextTaskId(): string {
  taskSeq += 1;
  return `TASK-${taskSeq}`;
}

export function nextBugId(): string {
  bugSeq += 1;
  return `BUG-${bugSeq}`;
}

/**
 * Confirma uma escrita: espera a latência simulada e devolve uma cópia
 * profunda do resultado (como um endpoint faria ao responder).
 */
export async function persist<T>(data: T, ms: number = FAKE_LATENCY): Promise<T> {
  await sleep(ms);
  return structuredClone(data);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/db.ts
git commit -m "feat: adiciona DB mutável em memória para escrita

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Escritas de tarefa na fake API

**Files:**
- Modify: `src/api/tasks.ts`

**Interfaces:**
- Consumes: `db`, `nextTaskId`, `persist` de `@/api/db`; `fake` de `@/api/client`; tipos `Column`/`Task` de `@/lib/data`.
- Produces:
  - `fetchColumns(): Promise<Column[]>` (passa a ler do `db`)
  - `createTask(input: { title: string; priority: Task['priority']; tag?: string }): Promise<Task>`
  - `moveTask(input: { taskId: string; toColumnKey: string }): Promise<void>`

- [ ] **Step 1: Reescrever `src/api/tasks.ts`**

```typescript
import { fake } from './client';
import { db, nextTaskId, persist } from './db';
import { type Column, type Task } from '@/lib/data';

export function fetchColumns(): Promise<Column[]> {
  return fake(db.columns);
}

export async function createTask(input: {
  title: string;
  priority: Task['priority'];
  tag?: string;
}): Promise<Task> {
  const task: Task = {
    id: nextTaskId(),
    title: input.title,
    priority: input.priority,
    tags: input.tag ? [input.tag] : [],
    assignees: ['Marina Souza'],
    comments: 0,
  };
  const backlog = db.columns.find((c) => c.key === 'backlog');
  if (backlog) backlog.tasks.push(task);
  return persist(task);
}

export async function moveTask(input: { taskId: string; toColumnKey: string }): Promise<void> {
  const from = db.columns.find((c) => c.tasks.some((t) => t.id === input.taskId));
  const to = db.columns.find((c) => c.key === input.toColumnKey);
  if (!from || !to || from.key === to.key) {
    await persist(null);
    return;
  }
  const idx = from.tasks.findIndex((t) => t.id === input.taskId);
  const [task] = from.tasks.splice(idx, 1);
  to.tasks.push(task);
  await persist(null);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/tasks.ts
git commit -m "feat: createTask e moveTask na fake API (leitura do db)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Escritas de bug na fake API

**Files:**
- Modify: `src/api/bugs.ts`

**Interfaces:**
- Consumes: `db`, `nextBugId`, `persist` de `@/api/db`; `fake` de `@/api/client`; tipo `Bug` de `@/lib/data`.
- Produces:
  - `fetchBugs(): Promise<Bug[]>` (passa a ler do `db`)
  - `createBug(input: { title: string; severity: Bug['severity'] }): Promise<Bug>`
  - `updateBugStatus(input: { bugId: string; status: Bug['status'] }): Promise<Bug>`

- [ ] **Step 1: Reescrever `src/api/bugs.ts`**

```typescript
import { fake } from './client';
import { db, nextBugId, persist } from './db';
import { type Bug } from '@/lib/data';

export function fetchBugs(): Promise<Bug[]> {
  return fake(db.bugs);
}

export async function createBug(input: { title: string; severity: Bug['severity'] }): Promise<Bug> {
  const bug: Bug = {
    id: nextBugId(),
    title: input.title,
    severity: input.severity,
    status: 'aberto',
    assignee: 'Marina Souza',
    when: 'agora',
  };
  db.bugs.unshift(bug);
  return persist(bug);
}

export async function updateBugStatus(input: { bugId: string; status: Bug['status'] }): Promise<Bug> {
  const bug = db.bugs.find((b) => b.id === input.bugId);
  if (!bug) throw new Error(`Bug ${input.bugId} não encontrado`);
  bug.status = input.status;
  return persist(bug);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/bugs.ts
git commit -m "feat: createBug e updateBugStatus na fake API (leitura do db)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Hooks de mutação

**Files:**
- Create: `src/queries/mutations.ts`

**Interfaces:**
- Consumes: `useMutation`, `useQueryClient` de `@tanstack/react-query`; `queryKeys` de `./keys`; `createTask`, `moveTask` de `@/api/tasks`; `createBug`, `updateBugStatus` de `@/api/bugs`; tipo `Column` de `@/lib/data`.
- Produces: `useCreateTask()`, `useCreateBug()`, `useUpdateBugStatus()`, `useMoveTask()`.

- [ ] **Step 1: Criar `src/queries/mutations.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { createTask, moveTask } from '@/api/tasks';
import { createBug, updateBugStatus } from '@/api/bugs';
import { type Column } from '@/lib/data';

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useCreateBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBug,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}

export function useUpdateBugStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBugStatus,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moveTask,
    onMutate: async (input: { taskId: string; toColumnKey: string }) => {
      await qc.cancelQueries({ queryKey: queryKeys.columns });
      const previous = qc.getQueryData<Column[]>(queryKeys.columns);
      if (previous) {
        const next = structuredClone(previous);
        const from = next.find((c) => c.tasks.some((t) => t.id === input.taskId));
        const to = next.find((c) => c.key === input.toColumnKey);
        if (from && to && from.key !== to.key) {
          const idx = from.tasks.findIndex((t) => t.id === input.taskId);
          const [task] = from.tasks.splice(idx, 1);
          to.tasks.push(task);
        }
        qc.setQueryData(queryKeys.columns, next);
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) qc.setQueryData(queryKeys.columns, context.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/queries/mutations.ts
git commit -m "feat: hooks de mutação (create/move task, create/update bug)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Dialog de criar tarefa + wiring no Kanban

**Files:**
- Create: `src/components/dialogs/create-task-dialog.tsx`
- Modify: `src/screens/kanban.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent` de `@/components/ui/dialog`; `Input`, `Select`, `Button`; `useCreateTask` de `@/queries/mutations`.
- Produces: `CreateTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void })`

- [ ] **Step 1: Criar `src/components/dialogs/create-task-dialog.tsx`**

```tsx
import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateTask } from '@/queries/mutations';
import { type Task } from '@/lib/data';

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function CreateTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<Task['priority']>('medium');
  const [tag, setTag] = React.useState('');
  const createTask = useCreateTask();

  function reset() {
    setTitle('');
    setPriority('medium');
    setTag('');
  }

  function submit() {
    if (!title.trim()) return;
    createTask.mutate(
      { title: title.trim(), priority, tag: tag.trim() || undefined },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent
        title="Nova tarefa"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? 'Criando…' : 'Criar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Balancear economia" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Prioridade</label>
            <Select
              options={PRIORITIES}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task['priority'])}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Tag (opcional)</label>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Ex.: gameplay" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Wire no `src/screens/kanban.tsx`** — abrir dialog pelo botão e contador dinâmico

Adicionar imports no topo:
```typescript
import * as React from 'react';
import { CreateTaskDialog } from '@/components/dialogs/create-task-dialog';
```
(o `import * as React` já existe no arquivo; não duplicar.)

Dentro de `KanbanBoard()`, após o hook `useColumns`:
```typescript
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const totalTasks = columns?.reduce((sum, c) => sum + c.tasks.length, 0) ?? 0;
```

Trocar a linha do `TopBar` para usar contador dinâmico e abrir o dialog:
```tsx
      <TopBar
        title="Kanban — Skyline Racer"
        subtitle={`${totalTasks} tarefas ativas`}
        actions={<Button onClick={() => setDialogOpen(true)}>+ Nova tarefa</Button>}
      />
```

Adicionar o dialog logo antes do fechamento do fragmento `</>` (após o `</div>` do conteúdo):
```tsx
      <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
```

- [ ] **Step 3: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview: no Kanban, clicar "+ Nova tarefa", preencher título "Teste QA", prioridade Alta, criar. Confirmar: dialog fecha, card "Teste QA" aparece no Backlog, contador de tarefas sobe.

- [ ] **Step 4: Commit**

```bash
git add src/components/dialogs/create-task-dialog.tsx src/screens/kanban.tsx
git commit -m "feat: dialog de criar tarefa no Kanban com contador dinâmico

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Drag-and-drop de cards entre colunas

**Files:**
- Modify: `package.json` (via npm install), `src/components/kanban-card.tsx`, `src/screens/kanban.tsx`

**Interfaces:**
- Consumes: `@dnd-kit/core` (`DndContext`, `useDraggable`, `useDroppable`, `DragEndEvent`); `useMoveTask` de `@/queries/mutations`.
- Produces: `KanbanCard` aceita props opcionais `draggable`; comportamento de DnD no board.

- [ ] **Step 1: Instalar `@dnd-kit/core`**

Run:
```bash
npm install @dnd-kit/core@6.3.1
```
Expected: `package.json` lista `@dnd-kit/core` em `dependencies`.

- [ ] **Step 2: Tornar `KanbanCard` arrastável — `src/components/kanban-card.tsx`**

Adicionar import:
```typescript
import { useDraggable } from '@dnd-kit/core';
```

Substituir a assinatura e o `<div>` externo para usar o hook. O corpo interno (id, título, tags, assignees, comments) permanece idêntico:

```tsx
export function KanbanCard({ task, className }: { task: Task; className?: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 50 : undefined }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-surface border border-border rounded-md p-3 flex flex-col gap-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-border-strong transition-colors',
        className,
      )}
    >
      {/* corpo interno inalterado: id + prioridade, título, tags, assignees, comments */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] text-tertiary">{task.id}</span>
        <svg width="9" height="9" viewBox="0 0 10 10">
          <path d="M5 0L10 10H0Z" fill={priorityColor[task.priority]} />
        </svg>
      </div>
      <div className="text-[13px] font-medium text-primary leading-snug">{task.title}</div>
      {task.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {task.tags.map((t) => (
            <span key={t} className="text-[10px] font-semibold uppercase tracking-wide text-tertiary bg-surface3 rounded px-1.5 py-0.5">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex">
          {task.assignees.map((n, i) => (
            <div key={n} style={{ marginLeft: i === 0 ? 0 : -8 }}>
              <Avatar name={n} size={22} />
            </div>
          ))}
        </div>
        {task.comments > 0 && <span className="text-[11px] text-tertiary font-mono">💬 {task.comments}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Envolver o board com DnD — `src/screens/kanban.tsx`**

Adicionar imports:
```typescript
import { DndContext, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { useMoveTask } from '@/queries/mutations';
```

Dentro de `KanbanBoard()`, adicionar:
```typescript
  const moveTask = useMoveTask();

  function handleDragEnd(event: DragEndEvent) {
    const taskId = event.active.id as string;
    const toColumnKey = event.over?.id as string | undefined;
    if (toColumnKey) {
      moveTask.mutate({ taskId, toColumnKey });
    }
  }
```

Envolver o `<div className="flex gap-4 min-w-max h-full">` (dentro do ramo de dados) com `<DndContext onDragEnd={handleDragEnd}>...</DndContext>`.

Extrair a coluna para um subcomponente droppable no mesmo arquivo:
```tsx
function KanbanColumn({ col }: { col: Column }) {
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
      <div className="flex flex-col gap-2.5 min-h-[40px]">
        {col.tasks.map((t) => (
          <KanbanCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}
```

Adicionar os imports que o subcomponente precisa (topo do arquivo): `import { cn } from '@/lib/utils';` e `import { type Column } from '@/lib/data';`. O `.map` das colunas passa a renderizar `<KanbanColumn key={col.key} col={col} />` dentro do `DndContext`.

- [ ] **Step 4: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview: arrastar um card do Backlog para "A Fazer". Confirmar: o card se move sem "piscar" (optimistic), a coluna destino destaca ao passar por cima, e ao trocar de tela e voltar o card continua na nova coluna (persistência no db).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/kanban-card.tsx src/screens/kanban.tsx
git commit -m "feat: drag-and-drop de cards entre colunas com optimistic update

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Reportar bug (dialog) + status inline + contador

**Files:**
- Create: `src/components/dialogs/report-bug-dialog.tsx`
- Modify: `src/screens/bugs.tsx`

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `Input`, `Select`, `Button`; `useCreateBug`, `useUpdateBugStatus` de `@/queries/mutations`; tipo `Bug`.
- Produces: `ReportBugDialog({ open, onOpenChange })`.

- [ ] **Step 1: Criar `src/components/dialogs/report-bug-dialog.tsx`**

```tsx
import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateBug } from '@/queries/mutations';
import { type Bug } from '@/lib/data';

const SEVERITIES: { value: Bug['severity']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function ReportBugDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = React.useState('');
  const [severity, setSeverity] = React.useState<Bug['severity']>('medium');
  const createBug = useCreateBug();

  function reset() {
    setTitle('');
    setSeverity('medium');
  }

  function submit() {
    if (!title.trim()) return;
    createBug.mutate(
      { title: title.trim(), severity },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent
        title="Reportar bug"
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || createBug.isPending}>
              {createBug.isPending ? 'Reportando…' : 'Reportar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Crash ao entrar no lobby" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Severidade</label>
            <Select
              options={SEVERITIES}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Bug['severity'])}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Modificar `src/screens/bugs.tsx`** — botão abre dialog, status vira Select, contador dinâmico

Adicionar imports:
```typescript
import * as React from 'react';
import { ReportBugDialog } from '@/components/dialogs/report-bug-dialog';
import { useUpdateBugStatus } from '@/queries/mutations';
```
(`import * as React` já existe; não duplicar.)

Definir as opções de status (após os `Record` de tones, fora do componente):
```typescript
const STATUS_OPTIONS: { value: Bug['status']; label: string }[] = [
  { value: 'aberto', label: 'aberto' },
  { value: 'em análise', label: 'em análise' },
  { value: 'em correção', label: 'em correção' },
  { value: 'corrigido', label: 'corrigido' },
];
```

No topo de `Bugs()`, após `useBugs`:
```typescript
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const updateStatus = useUpdateBugStatus();
  const criticosAbertos = bugs?.filter((b) => b.severity === 'critical' && b.status !== 'corrigido').length ?? 0;
```

Trocar o `TopBar` para contador dinâmico + abrir dialog:
```tsx
      <TopBar
        title="Bug Tracker — Skyline Racer"
        subtitle={`${bugs?.length ?? 0} bugs · ${criticosAbertos} críticos`}
        actions={<Button onClick={() => setDialogOpen(true)}>+ Reportar bug</Button>}
      />
```

Na célula de status (hoje `<Badge tone={statusTone[b.status]}>{b.status}</Badge>`), trocar por um `Select`:
```tsx
              <div>
                <Select
                  options={STATUS_OPTIONS}
                  value={b.status}
                  onChange={(e) => updateStatus.mutate({ bugId: b.id, status: e.target.value as Bug['status'] })}
                />
              </div>
```
Adicionar `import { Select } from '@/components/ui/select';` no topo. (O `statusTone` deixa de ser usado na célula; pode ser removido — remover o `const statusTone` e o import de `Badge` se `Badge` não for mais usado. `Badge` ainda é usado na coluna Severidade, então **manter** o import de `Badge` e remover apenas `statusTone`.)

Adicionar o dialog antes do fechamento do fragmento:
```tsx
      <ReportBugDialog open={dialogOpen} onOpenChange={setDialogOpen} />
```

- [ ] **Step 3: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview no Bug Tracker:
1. Trocar o status de um bug pelo Select → muda; sair e voltar da tela mantém.
2. "+ Reportar bug" → título "Bug de teste", severidade Alta, reportar → aparece no topo da lista; contador de bugs sobe.

- [ ] **Step 4: Commit**

```bash
git add src/components/dialogs/report-bug-dialog.tsx src/screens/bugs.tsx
git commit -m "feat: reportar bug e mudar status inline no Bug Tracker

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Typecheck + build limpos**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 2: Fluxo completo no preview**

Recarregar `http://localhost:5173` e executar em sequência:
1. Kanban: criar tarefa → aparece no Backlog, contador sobe.
2. Kanban: arrastar a nova tarefa para "Em Progresso" → move sem piscar; trocar de tela e voltar → persistiu.
3. Bugs: mudar status de um bug via Select → persiste ao trocar de tela.
4. Bugs: reportar bug → aparece no topo, contador sobe.
5. Console (`preview_console_logs`) sem erros/warnings em nenhum fluxo.

- [ ] **Step 3: Commit final (se houver ajuste)**

Se algum ajuste foi necessário, commitar. Caso contrário, encerra a implementação.

---

## Self-Review

**Cobertura do spec:**
- DB mutável semeado de data.ts → Task 1 ✓
- createTask/moveTask + fetch do db → Task 2 ✓
- createBug/updateBugStatus + fetch do db → Task 3 ✓
- Hooks de mutação, optimistic só no move → Task 4 ✓
- Criar tarefa (dialog) + contador Kanban → Task 5 ✓
- DnD real com @dnd-kit/core → Task 6 ✓
- Reportar bug (dialog) + status inline (Select) + contador Bugs → Task 7 ✓
- Verificação por preview → cada task + Task 8 ✓
- Fora de escopo (reordenar, editar/excluir, undo, persistência real) → respeitado ✓

**Placeholders:** nenhum "TBD/TODO"; todo código presente. Onde o corpo do KanbanCard é grande e imutável, ele é reproduzido por inteiro (Task 6) para não depender de leitura fora de ordem.

**Consistência de tipos:** `createTask`/`moveTask` (Task 2) e `createBug`/`updateBugStatus` (Task 3) têm assinaturas idênticas às consumidas em `mutations.ts` (Task 4) e nos dialogs/telas (Tasks 5–7). `queryKeys.columns`/`queryKeys.bugs` já existem de `keys.ts`. `Column`, `Task`, `Bug` importados de `@/lib/data` em todas as camadas. `useDroppable` id = `col.key` casa com `toColumnKey` de `moveTask`; `useDraggable` id = `task.id` casa com `taskId`.
