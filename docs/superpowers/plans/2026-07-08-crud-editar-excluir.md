# CRUD editar/excluir (tarefa + bug) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o CRUD — editar e excluir tarefas e bugs — reusando `db`, mutações e dialogs existentes.

**Architecture:** Novas escritas em `api/*` sobre o `db` mutável → hooks `useUpdate*`/`useDelete*` (invalidação) → dialogs generalizados (criar+editar+excluir) → clique-pra-editar nas telas (Kanban via activationConstraint; Bugs via título clicável).

**Tech Stack:** React 18.3, TypeScript, TanStack Query 5, Zustand 5, @dnd-kit/core 6.3.1, Vite 8.

## Global Constraints

- **Persistência em memória** (recarregar zera pro seed) — comportamento esperado.
- **Proibido `useState`/`useEffect` para dados de servidor.** Estado de dialog/formulário é `useState` local — permitido.
- **Clique abre edição, arrasto move** no Kanban (activationConstraint distance 5).
- **Excluir com confirmação inline** dentro do dialog (2 cliques), sem dialog extra.
- **Verificação por task:** `npx tsc --noEmit` passa; efeito visual → dirigir preview em `http://localhost:5173`.
- **Ao instalar/rodar após mexer em deps não há novas deps aqui**, mas se o preview der "Invalid hook call", reiniciar o dev server (limpar `node_modules/.vite`).
- **Commits atômicos** em PT-BR com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Criar:**
- `src/components/dialogs/task-dialog.tsx` (generaliza o create-task-dialog: criar+editar+excluir)
- `src/components/dialogs/bug-dialog.tsx` (generaliza o report-bug-dialog)

**Modificar:**
- `src/api/tasks.ts` — `updateTask`, `deleteTask`
- `src/api/bugs.ts` — `updateBug`, `deleteBug`
- `src/queries/mutations.ts` — `useUpdateTask`, `useDeleteTask`, `useUpdateBug`, `useDeleteBug`
- `src/components/kanban-card.tsx` — prop `onEdit`
- `src/screens/kanban.tsx` — sensors, estado `dialog`, click-to-edit, usar `TaskDialog`
- `src/screens/bugs.tsx` — estado `dialog`, título clicável, usar `BugDialog`

**Remover:**
- `src/components/dialogs/create-task-dialog.tsx` (substituído por task-dialog.tsx)
- `src/components/dialogs/report-bug-dialog.tsx` (substituído por bug-dialog.tsx)

---

## Task 1: Escritas update/delete de tarefa

**Files:**
- Modify: `src/api/tasks.ts`

**Interfaces:**
- Consumes: `db`, `persist` de `@/api/db`; tipo `Task`.
- Produces:
  - `updateTask(input: { taskId: string; title: string; priority: Task['priority']; tags: string[] }): Promise<Task>`
  - `deleteTask(input: { taskId: string }): Promise<void>`

- [ ] **Step 1: Acrescentar ao fim de `src/api/tasks.ts`**

```typescript
export async function updateTask(input: {
  taskId: string;
  title: string;
  priority: Task['priority'];
  tags: string[];
}): Promise<Task> {
  let found: Task | undefined;
  for (const col of db.columns) {
    const t = col.tasks.find((x) => x.id === input.taskId);
    if (t) {
      t.title = input.title;
      t.priority = input.priority;
      t.tags = input.tags;
      found = t;
      break;
    }
  }
  if (!found) throw new Error(`Task ${input.taskId} não encontrada`);
  return persist(found);
}

export async function deleteTask(input: { taskId: string }): Promise<void> {
  const col = db.columns.find((c) => c.tasks.some((t) => t.id === input.taskId));
  if (col) {
    const idx = col.tasks.findIndex((t) => t.id === input.taskId);
    col.tasks.splice(idx, 1);
  }
  await persist(null);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/tasks.ts
git commit -m "feat: updateTask e deleteTask na fake API

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Escritas update/delete de bug

**Files:**
- Modify: `src/api/bugs.ts`

**Interfaces:**
- Consumes: `db`, `persist` de `@/api/db`; tipo `Bug`.
- Produces:
  - `updateBug(input: { bugId: string; title: string; severity: Bug['severity'] }): Promise<Bug>`
  - `deleteBug(input: { bugId: string }): Promise<void>`

- [ ] **Step 1: Acrescentar ao fim de `src/api/bugs.ts`**

```typescript
export async function updateBug(input: {
  bugId: string;
  title: string;
  severity: Bug['severity'];
}): Promise<Bug> {
  const bug = db.bugs.find((b) => b.id === input.bugId);
  if (!bug) throw new Error(`Bug ${input.bugId} não encontrado`);
  bug.title = input.title;
  bug.severity = input.severity;
  return persist(bug);
}

export async function deleteBug(input: { bugId: string }): Promise<void> {
  const idx = db.bugs.findIndex((b) => b.id === input.bugId);
  if (idx >= 0) db.bugs.splice(idx, 1);
  await persist(null);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/bugs.ts
git commit -m "feat: updateBug e deleteBug na fake API

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Hooks de mutação update/delete

**Files:**
- Modify: `src/queries/mutations.ts`

**Interfaces:**
- Consumes: `updateTask`, `deleteTask` de `@/api/tasks`; `updateBug`, `deleteBug` de `@/api/bugs`.
- Produces: `useUpdateTask()`, `useDeleteTask()`, `useUpdateBug()`, `useDeleteBug()`.

- [ ] **Step 1: Atualizar imports no topo de `src/queries/mutations.ts`**

Trocar:
```typescript
import { createTask, moveTask } from '@/api/tasks';
import { createBug, updateBugStatus } from '@/api/bugs';
```
por:
```typescript
import { createTask, moveTask, updateTask, deleteTask } from '@/api/tasks';
import { createBug, updateBugStatus, updateBug, deleteBug } from '@/api/bugs';
```

- [ ] **Step 2: Acrescentar os 4 hooks ao fim de `src/queries/mutations.ts`**

```typescript
export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.columns }),
  });
}

export function useUpdateBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBug,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}

export function useDeleteBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBug,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bugs }),
  });
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/queries/mutations.ts
git commit -m "feat: hooks useUpdate/useDelete para task e bug

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: TaskDialog (criar + editar + excluir)

**Files:**
- Create: `src/components/dialogs/task-dialog.tsx`
- Delete: `src/components/dialogs/create-task-dialog.tsx`
- Modify: `src/screens/kanban.tsx` (só o import + uso do dialog; wiring de click-to-edit vem na Task 5)

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `Input`, `Select`, `Button`; `useCreateTask`, `useUpdateTask`, `useDeleteTask`; tipo `Task`.
- Produces: `TaskDialog({ open, onOpenChange, task? }: { open: boolean; onOpenChange: (v: boolean) => void; task?: Task })`.

- [ ] **Step 1: Criar `src/components/dialogs/task-dialog.tsx`**

```tsx
import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateTask, useUpdateTask, useDeleteTask } from '@/queries/mutations';
import { type Task } from '@/lib/data';

const PRIORITIES: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function TaskDialog({ open, onOpenChange, task }: { open: boolean; onOpenChange: (v: boolean) => void; task?: Task }) {
  const isEdit = !!task;
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<Task['priority']>('medium');
  const [tags, setTags] = React.useState('');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Sincroniza o formulário quando abre em modo edição (ou reseta ao criar).
  React.useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setPriority(task?.priority ?? 'medium');
      setTags(task?.tags.join(', ') ?? '');
      setConfirmingDelete(false);
    }
  }, [open, task]);

  const pending = createTask.isPending || updateTask.isPending || deleteTask.isPending;

  function submit() {
    if (!title.trim()) return;
    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (isEdit && task) {
      updateTask.mutate(
        { taskId: task.id, title: title.trim(), priority, tags: parsedTags },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createTask.mutate(
        { title: title.trim(), priority, tag: parsedTags[0] },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  function remove() {
    if (!task) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteTask.mutate({ taskId: task.id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Editar tarefa' : 'Nova tarefa'}
        footer={
          <>
            {isEdit && (
              <Button variant="secondary" onClick={remove} disabled={pending} className="mr-auto text-danger">
                {confirmingDelete ? 'Confirmar exclusão?' : 'Excluir'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || pending}>
              {isEdit ? 'Salvar' : 'Criar'}
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
            <Select options={PRIORITIES} value={priority} onChange={(e) => setPriority(e.target.value as Task['priority'])} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-tertiary">Tags (separadas por vírgula)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Ex.: gameplay, ui" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Atualizar `src/screens/kanban.tsx` para usar `TaskDialog`** (mantendo o comportamento atual de só criar — click-to-edit vem na Task 5)

Trocar o import:
```typescript
import { CreateTaskDialog } from '@/components/dialogs/create-task-dialog';
```
por:
```typescript
import { TaskDialog } from '@/components/dialogs/task-dialog';
```

Trocar o uso no JSX:
```tsx
      <CreateTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
```
por:
```tsx
      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
```

- [ ] **Step 3: Remover o arquivo antigo**

Run: `git rm src/components/dialogs/create-task-dialog.tsx`

- [ ] **Step 4: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview: no Kanban, "+ Nova tarefa" ainda cria normalmente (título "Salvar" só aparece em edição; aqui deve mostrar "Criar").

- [ ] **Step 5: Commit**

```bash
git add src/components/dialogs/task-dialog.tsx src/screens/kanban.tsx
git commit -m "refactor: generaliza CreateTaskDialog em TaskDialog (criar+editar+excluir)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Kanban — clique-pra-editar (sensors + onEdit)

**Files:**
- Modify: `src/components/kanban-card.tsx`, `src/screens/kanban.tsx`

**Interfaces:**
- Consumes: `PointerSensor`, `useSensor`, `useSensors` de `@dnd-kit/core`; `TaskDialog`.
- Produces: `KanbanCard` aceita `onEdit?: () => void`.

- [ ] **Step 1: `src/components/kanban-card.tsx` — adicionar `onEdit`**

Trocar a assinatura:
```tsx
export function KanbanCard({ task, className }: { task: Task; className?: string }) {
```
por:
```tsx
export function KanbanCard({ task, className, onEdit }: { task: Task; className?: string; onEdit?: () => void }) {
```

Adicionar `onClick={onEdit}` no `<div>` externo do card (junto de `ref`/`style`/`listeners`/`attributes`):
```tsx
    <div
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      {...listeners}
      {...attributes}
      className={cn(
        'bg-surface border border-border rounded-md p-3 flex flex-col gap-2 shadow-sm cursor-grab active:cursor-grabbing hover:border-border-strong transition-colors',
        className,
      )}
    >
```

- [ ] **Step 2: `src/screens/kanban.tsx` — sensors, estado `dialog`, wiring**

Atualizar imports do dnd-kit:
```typescript
import { DndContext, useDroppable, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
```

`KanbanColumn` passa a receber e repassar `onEdit`:
```tsx
function KanbanColumn({ col, onEditTask }: { col: Column; onEditTask: (task: Column['tasks'][number]) => void }) {
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
          <KanbanCard key={t.id} task={t} onEdit={() => onEditTask(t)} />
        ))}
      </div>
    </div>
  );
}
```

No `KanbanBoard()`, trocar o estado do dialog e adicionar sensores. Substituir:
```typescript
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const moveTask = useMoveTask();
```
por:
```typescript
  type DialogState = null | { mode: 'create' } | { mode: 'edit'; task: Task };
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const moveTask = useMoveTask();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
```

Adicionar o import do tipo `Task` (já importa `Column`):
```typescript
import { type Column, type Task } from '@/lib/data';
```

Passar `sensors` ao `DndContext` e `onEditTask` às colunas:
```tsx
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max h-full">
              {columns.map((col) => (
                <KanbanColumn key={col.key} col={col} onEditTask={(task) => setDialog({ mode: 'edit', task })} />
              ))}
            </div>
          </DndContext>
```

Trocar o botão "+ Nova tarefa" para abrir em modo create:
```tsx
        actions={<Button onClick={() => setDialog({ mode: 'create' })}>+ Nova tarefa</Button>}
```

Trocar o `<TaskDialog>` no fim:
```tsx
      <TaskDialog
        open={dialog !== null}
        task={dialog?.mode === 'edit' ? dialog.task : undefined}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
      />
```

- [ ] **Step 3: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview no Kanban:
1. Clique curto num card → abre "Editar tarefa" pré-preenchido; mudar título → Salvar → card atualiza; trocar de tela e voltar → persistiu.
2. Arrastar um card ainda move entre colunas (não abre edição).
3. Abrir edição → "Excluir" → "Confirmar exclusão?" → card some; contador cai.
4. "+ Nova tarefa" cria normalmente.

- [ ] **Step 4: Commit**

```bash
git add src/components/kanban-card.tsx src/screens/kanban.tsx
git commit -m "feat: clique-pra-editar no Kanban (activationConstraint + onEdit)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: BugDialog (criar + editar + excluir)

**Files:**
- Create: `src/components/dialogs/bug-dialog.tsx`
- Delete: `src/components/dialogs/report-bug-dialog.tsx`
- Modify: `src/screens/bugs.tsx` (só import + uso; wiring de click-to-edit na Task 7)

**Interfaces:**
- Consumes: `Dialog`, `DialogContent`, `Input`, `Select`, `Button`; `useCreateBug`, `useUpdateBug`, `useDeleteBug`; tipo `Bug`.
- Produces: `BugDialog({ open, onOpenChange, bug? })`.

- [ ] **Step 1: Criar `src/components/dialogs/bug-dialog.tsx`**

```tsx
import * as React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateBug, useUpdateBug, useDeleteBug } from '@/queries/mutations';
import { type Bug } from '@/lib/data';

const SEVERITIES: { value: Bug['severity']; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

export function BugDialog({ open, onOpenChange, bug }: { open: boolean; onOpenChange: (v: boolean) => void; bug?: Bug }) {
  const isEdit = !!bug;
  const [title, setTitle] = React.useState('');
  const [severity, setSeverity] = React.useState<Bug['severity']>('medium');
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const createBug = useCreateBug();
  const updateBug = useUpdateBug();
  const deleteBug = useDeleteBug();

  React.useEffect(() => {
    if (open) {
      setTitle(bug?.title ?? '');
      setSeverity(bug?.severity ?? 'medium');
      setConfirmingDelete(false);
    }
  }, [open, bug]);

  const pending = createBug.isPending || updateBug.isPending || deleteBug.isPending;

  function submit() {
    if (!title.trim()) return;
    if (isEdit && bug) {
      updateBug.mutate({ bugId: bug.id, title: title.trim(), severity }, { onSuccess: () => onOpenChange(false) });
    } else {
      createBug.mutate({ title: title.trim(), severity }, { onSuccess: () => onOpenChange(false) });
    }
  }

  function remove() {
    if (!bug) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteBug.mutate({ bugId: bug.id }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={isEdit ? 'Editar bug' : 'Reportar bug'}
        footer={
          <>
            {isEdit && (
              <Button variant="secondary" onClick={remove} disabled={pending} className="mr-auto text-danger">
                {confirmingDelete ? 'Confirmar exclusão?' : 'Excluir'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={!title.trim() || pending}>
              {isEdit ? 'Salvar' : 'Reportar'}
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
            <Select options={SEVERITIES} value={severity} onChange={(e) => setSeverity(e.target.value as Bug['severity'])} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Atualizar `src/screens/bugs.tsx` import/uso**

Trocar:
```typescript
import { ReportBugDialog } from '@/components/dialogs/report-bug-dialog';
```
por:
```typescript
import { BugDialog } from '@/components/dialogs/bug-dialog';
```
E o uso no JSX:
```tsx
      <ReportBugDialog open={dialogOpen} onOpenChange={setDialogOpen} />
```
por:
```tsx
      <BugDialog open={dialogOpen} onOpenChange={setDialogOpen} />
```

- [ ] **Step 3: Remover o arquivo antigo**

Run: `git rm src/components/dialogs/report-bug-dialog.tsx`

- [ ] **Step 4: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/components/dialogs/bug-dialog.tsx src/screens/bugs.tsx
git commit -m "refactor: generaliza ReportBugDialog em BugDialog (criar+editar+excluir)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Bugs — clique-pra-editar no título

**Files:**
- Modify: `src/screens/bugs.tsx`

**Interfaces:**
- Consumes: `BugDialog`; tipo `Bug`.
- Produces: nada novo.

- [ ] **Step 1: Trocar o estado do dialog em `src/screens/bugs.tsx`**

Substituir:
```typescript
  const [dialogOpen, setDialogOpen] = React.useState(false);
```
por:
```typescript
  type DialogState = null | { mode: 'create' } | { mode: 'edit'; bug: Bug };
  const [dialog, setDialog] = React.useState<DialogState>(null);
```

- [ ] **Step 2: Botão abre create**

Trocar:
```tsx
        actions={<Button onClick={() => setDialogOpen(true)}>+ Reportar bug</Button>}
```
por:
```tsx
        actions={<Button onClick={() => setDialog({ mode: 'create' })}>+ Reportar bug</Button>}
```

- [ ] **Step 3: Título clicável abre edição**

Trocar a célula do título:
```tsx
                <div className="text-[13px] text-primary font-medium">{b.title}</div>
```
por:
```tsx
                <div
                  className="text-[13px] text-primary font-medium cursor-pointer hover:text-accent"
                  onClick={() => setDialog({ mode: 'edit', bug: b })}
                >
                  {b.title}
                </div>
```

- [ ] **Step 4: Trocar o `<BugDialog>` no fim**

```tsx
      <BugDialog
        open={dialog !== null}
        bug={dialog?.mode === 'edit' ? dialog.bug : undefined}
        onOpenChange={(v) => { if (!v) setDialog(null); }}
      />
```

- [ ] **Step 5: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview no Bug Tracker:
1. Clicar no título de um bug → "Editar bug" pré-preenchido; mudar severidade/título → Salvar → linha atualiza; trocar de tela e voltar → persistiu.
2. O `Select` de status inline continua funcionando (não abre o dialog).
3. Editar → Excluir (2 cliques) → bug some; contador cai.
4. "+ Reportar bug" cria normalmente.

- [ ] **Step 6: Commit**

```bash
git add src/screens/bugs.tsx
git commit -m "feat: clique-pra-editar no título do bug

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Typecheck + build limpos**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 2: Fluxo CRUD completo no preview**

Recarregar `http://localhost:5173` e executar:
1. Kanban: criar tarefa → editar (título/prioridade/tags) → mover (drag) → excluir. Cada passo persiste ao trocar de tela.
2. Bugs: reportar → editar (título/severidade) → mudar status inline → excluir.
3. Confirmar que clique curto no card edita e arrasto move (sem conflito).
4. Console (`preview_console_logs`) sem erros/warnings.

- [ ] **Step 3: Commit final (se houver ajuste)**

---

## Self-Review

**Cobertura do spec:**
- updateTask/deleteTask → Task 1 ✓; updateBug/deleteBug → Task 2 ✓
- 4 hooks → Task 3 ✓
- TaskDialog (criar+editar+excluir, tags CSV, confirmação inline) → Task 4 ✓
- Kanban clique-pra-editar (activationConstraint + onEdit) → Task 5 ✓
- BugDialog → Task 6 ✓
- Bugs título clicável → Task 7 ✓
- Verificação → cada task + Task 8 ✓
- Fora de escopo (assignees, reordenar, massa, undo) → respeitado ✓

**Placeholders:** nenhum; todo código presente.

**Consistência de tipos:** `updateTask`/`deleteTask` (Task 1), `updateBug`/`deleteBug` (Task 2) batem com os hooks (Task 3) e com os dialogs (Tasks 4, 6). `TaskDialog`/`BugDialog` props (`task?`/`bug?`) batem com o uso nas telas (Tasks 5, 7). `DialogState` idêntico em Kanban (Task 5) e Bugs (Task 7), variando só task/bug. `useEffect` nos dialogs sincroniza formulário — é estado de UI (formulário), não dado de servidor, então não viola a regra.
