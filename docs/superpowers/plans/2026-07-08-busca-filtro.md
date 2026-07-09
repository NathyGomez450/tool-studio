# Busca/filtro global — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar busca por texto + filtros (prioridade/severidade, tag/status, responsável) ao Kanban e ao Bug Tracker, com critério no Zustand e contadores refletindo o resultado.

**Architecture:** `useFilterStore` (Zustand) guarda o critério por tela → `FilterBar` (UI reutilizável abaixo do TopBar) → cada tela filtra os dados do TanStack Query client-side e conta o filtrado.

**Tech Stack:** React 18.3, TypeScript, TanStack Query 5, Zustand 5, @dnd-kit/core, Vite 8.

## Global Constraints

- **Filtro é estado de UI → Zustand** (persiste ao navegar; recarregar zera).
- **Proibido `useState`/`useEffect` para dados de servidor.** Filtro no Zustand; dados via Query.
- **String vazia = "todos"** em cada dimensão.
- **Match:** texto por substring case-insensitive (título ou ID); Selects por igualdade exata.
- **Contadores refletem o filtrado** (sem filtro = números atuais).
- **Verificação por task:** `npx tsc --noEmit` passa; efeito visual → dirigir preview em `http://localhost:5173`.
- **Se o preview der "Invalid hook call" após mexer em deps:** reiniciar dev server (limpar `node_modules/.vite`). (Não há dep nova neste plano.)
- **Commits atômicos** em PT-BR com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Criar:**
- `src/stores/filter-store.ts` — `useFilterStore`
- `src/components/filter-bar.tsx` — `FilterBar`

**Modificar:**
- `src/screens/kanban.tsx` — filtro + FilterBar + contadores filtrados
- `src/screens/bugs.tsx` — filtro + FilterBar + contadores filtrados

---

## Task 1: Store de filtros

**Files:**
- Create: `src/stores/filter-store.ts`

**Interfaces:**
- Consumes: `create` de `zustand`.
- Produces:
  - `useFilterStore` com `kanban`, `bugs`, `setKanbanFilter`, `setBugsFilter`, `clearKanban`, `clearBugs`.
  - Tipos `KanbanFilter`, `BugsFilter` exportados.

- [ ] **Step 1: Criar `src/stores/filter-store.ts`**

```typescript
import { create } from 'zustand';

export interface KanbanFilter {
  text: string;
  priority: string;
  tag: string;
  assignee: string;
}

export interface BugsFilter {
  text: string;
  severity: string;
  status: string;
  assignee: string;
}

const EMPTY_KANBAN: KanbanFilter = { text: '', priority: '', tag: '', assignee: '' };
const EMPTY_BUGS: BugsFilter = { text: '', severity: '', status: '', assignee: '' };

interface FilterState {
  kanban: KanbanFilter;
  bugs: BugsFilter;
  setKanbanFilter: (patch: Partial<KanbanFilter>) => void;
  setBugsFilter: (patch: Partial<BugsFilter>) => void;
  clearKanban: () => void;
  clearBugs: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  kanban: EMPTY_KANBAN,
  bugs: EMPTY_BUGS,
  setKanbanFilter: (patch) => set((s) => ({ kanban: { ...s.kanban, ...patch } })),
  setBugsFilter: (patch) => set((s) => ({ bugs: { ...s.bugs, ...patch } })),
  clearKanban: () => set({ kanban: EMPTY_KANBAN }),
  clearBugs: () => set({ bugs: EMPTY_BUGS }),
}));
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/stores/filter-store.ts
git commit -m "feat: store Zustand de filtros por tela

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Componente FilterBar

**Files:**
- Create: `src/components/filter-bar.tsx`

**Interfaces:**
- Consumes: `Input`, `Button`.
- Produces: `FilterBar({ search, onSearch, onClear, hasActiveFilter, children })`.

- [ ] **Step 1: Criar `src/components/filter-bar.tsx`**

```tsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function FilterBar({
  search,
  onSearch,
  onClear,
  hasActiveFilter,
  children,
}: {
  search: string;
  onSearch: (v: string) => void;
  onClear: () => void;
  hasActiveFilter: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 px-6 py-3 border-b border-border-subtle shrink-0">
      <Input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Buscar…"
        className="max-w-[220px]"
      />
      {children}
      {hasActiveFilter && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Limpar
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/filter-bar.tsx
git commit -m "feat: componente FilterBar (busca + slot de selects + limpar)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Filtro no Kanban

**Files:**
- Modify: `src/screens/kanban.tsx`

**Interfaces:**
- Consumes: `useFilterStore`, `FilterBar`, `Select`, tipo `Task`/`Column`.
- Produces: nada novo.

- [ ] **Step 1: Adicionar imports em `src/screens/kanban.tsx`**

```typescript
import { Select } from '@/components/ui/select';
import { FilterBar } from '@/components/filter-bar';
import { useFilterStore } from '@/stores/filter-store';
```

- [ ] **Step 2: Adicionar constante de opções de prioridade (fora do componente, junto ao `DialogState`)**

```typescript
const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'Todas prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];
```

- [ ] **Step 3: No `KanbanBoard()`, ler filtro, derivar opções e filtrar**

Após os hooks existentes (`useColumns`, `useState` do dialog, `useMoveTask`, `sensors`), adicionar:

```typescript
  const filter = useFilterStore((s) => s.kanban);
  const setFilter = useFilterStore((s) => s.setKanbanFilter);
  const clearFilter = useFilterStore((s) => s.clearKanban);

  const allTags = Array.from(new Set((columns ?? []).flatMap((c) => c.tasks.flatMap((t) => t.tags)))).sort();
  const allAssignees = Array.from(new Set((columns ?? []).flatMap((c) => c.tasks.flatMap((t) => t.assignees)))).sort();

  function matchTask(t: Task): boolean {
    const q = filter.text.trim().toLowerCase();
    if (q && !(`${t.title} ${t.id}`.toLowerCase().includes(q))) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    if (filter.tag && !t.tags.includes(filter.tag)) return false;
    if (filter.assignee && !t.assignees.includes(filter.assignee)) return false;
    return true;
  }

  const displayColumns = columns?.map((c) => ({ ...c, tasks: c.tasks.filter(matchTask) }));
  const hasActiveFilter = !!(filter.text || filter.priority || filter.tag || filter.assignee);
```

Trocar o cálculo de `totalTasks` para usar `displayColumns`:
```typescript
  const totalTasks = displayColumns?.reduce((sum, c) => sum + c.tasks.length, 0) ?? 0;
```

- [ ] **Step 4: Renderizar a `FilterBar` entre o `TopBar` e o board, e iterar sobre `displayColumns`**

Inserir logo após o `</TopBar>` (antes do `<div className="flex-1 overflow-auto p-5 px-6">`):

```tsx
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
```

Trocar o `.map` do board de `columns` para `displayColumns` (dentro do ramo com dados; `displayColumns` é garantido não-nulo nesse ramo porque `columns` existe):

```tsx
            <div className="flex gap-4 min-w-max h-full">
              {displayColumns!.map((col) => (
                <KanbanColumn key={col.key} col={col} onEditTask={(task) => setDialog({ mode: 'edit', task })} />
              ))}
            </div>
```

- [ ] **Step 5: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview no Kanban:
1. Digitar "loja" na busca → só cards com "loja" no título aparecem; contadores caem.
2. Select Prioridade = Crítica → só críticos; combinar com busca afunila.
3. Select Tag / Responsável restringem.
4. "Limpar" aparece com filtro ativo e reseta tudo.
5. Navegar pra Bugs e voltar → filtro do Kanban preservado.
6. Sob filtro, arrastar e editar um card ainda funcionam.

- [ ] **Step 6: Commit**

```bash
git add src/screens/kanban.tsx
git commit -m "feat: busca e filtros no Kanban (texto, prioridade, tag, responsável)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Filtro nos Bugs

**Files:**
- Modify: `src/screens/bugs.tsx`

**Interfaces:**
- Consumes: `useFilterStore`, `FilterBar`, `Select` (já importado), tipo `Bug`.
- Produces: nada novo.

- [ ] **Step 1: Adicionar imports em `src/screens/bugs.tsx`**

```typescript
import { FilterBar } from '@/components/filter-bar';
import { useFilterStore } from '@/stores/filter-store';
```
(`Select` já é importado neste arquivo.)

- [ ] **Step 2: Adicionar constantes de opções de filtro (fora do componente, junto ao `STATUS_OPTIONS`)**

```typescript
const SEVERITY_FILTER_OPTIONS = [
  { value: '', label: 'Todas severidades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];
const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos status' },
  { value: 'aberto', label: 'aberto' },
  { value: 'em análise', label: 'em análise' },
  { value: 'em correção', label: 'em correção' },
  { value: 'corrigido', label: 'corrigido' },
];
```

- [ ] **Step 3: No `Bugs()`, ler filtro, derivar responsáveis e filtrar**

Após `useBugs`, `useState` do dialog e `useUpdateBugStatus`, adicionar:

```typescript
  const filter = useFilterStore((s) => s.bugs);
  const setFilter = useFilterStore((s) => s.setBugsFilter);
  const clearFilter = useFilterStore((s) => s.clearBugs);

  const allAssignees = Array.from(new Set((bugs ?? []).map((b) => b.assignee).filter((a) => a !== '—'))).sort();

  function matchBug(b: Bug): boolean {
    const q = filter.text.trim().toLowerCase();
    if (q && !(`${b.title} ${b.id}`.toLowerCase().includes(q))) return false;
    if (filter.severity && b.severity !== filter.severity) return false;
    if (filter.status && b.status !== filter.status) return false;
    if (filter.assignee && b.assignee !== filter.assignee) return false;
    return true;
  }

  const filteredBugs = bugs?.filter(matchBug) ?? [];
  const hasActiveFilter = !!(filter.text || filter.severity || filter.status || filter.assignee);
```

Trocar `criticosAbertos` para contar sobre o filtrado:
```typescript
  const criticosAbertos = filteredBugs.filter((b) => b.severity === 'critical' && b.status !== 'corrigido').length;
```

- [ ] **Step 4: Ajustar subtítulo, FilterBar e a lista renderizada**

Trocar o subtítulo do `TopBar` para contar o filtrado:
```tsx
        subtitle={`${filteredBugs.length} bugs · ${criticosAbertos} críticos`}
```

Inserir a `FilterBar` logo após o `</TopBar>` (antes do `<div className="flex-1 overflow-auto p-5 px-6">`):
```tsx
      <FilterBar
        search={filter.text}
        onSearch={(v) => setFilter({ text: v })}
        onClear={clearFilter}
        hasActiveFilter={hasActiveFilter}
      >
        <Select
          className="w-[180px]"
          options={SEVERITY_FILTER_OPTIONS}
          value={filter.severity}
          onChange={(e) => setFilter({ severity: e.target.value })}
        />
        <Select
          className="w-[160px]"
          options={STATUS_FILTER_OPTIONS}
          value={filter.status}
          onChange={(e) => setFilter({ status: e.target.value })}
        />
        <Select
          className="w-[180px]"
          options={[{ value: '', label: 'Todos responsáveis' }, ...allAssignees.map((a) => ({ value: a, label: a }))]}
          value={filter.assignee}
          onChange={(e) => setFilter({ assignee: e.target.value })}
        />
      </FilterBar>
```

Trocar o `.map` da lista de `bugs.map((b, i) => ...)` para `filteredBugs.map((b, i) => ...)` (só a fonte do map muda; o conteúdo de cada linha permanece idêntico).

- [ ] **Step 5: Verificar typecheck e preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview no Bug Tracker:
1. Busca por texto filtra linhas; subtítulo acompanha.
2. Severidade / Status / Responsável restringem; combinam.
3. "Limpar" reseta.
4. Navegar e voltar mantém o filtro.
5. Sob filtro, mudar status inline, editar e excluir seguem ok.

- [ ] **Step 6: Commit**

```bash
git add src/screens/bugs.tsx
git commit -m "feat: busca e filtros no Bug Tracker (texto, severidade, status, responsável)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Verificação final

**Files:** nenhum (verificação).

- [ ] **Step 1: Typecheck + build limpos**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 2: Fluxo completo no preview**

Recarregar `http://localhost:5173`:
1. Kanban: busca + cada Select + combinação + Limpar; contadores acompanham; persistência ao navegar.
2. Bugs: idem.
3. Sob filtro: criar/editar/excluir/mover (Kanban) e status/editar/excluir (Bugs) seguem funcionando.
4. Console (`preview_console_logs`) sem erros/warnings.

- [ ] **Step 3: Commit final (se houver ajuste)**

---

## Self-Review

**Cobertura do spec:**
- Store por tela → Task 1 ✓
- FilterBar reutilizável → Task 2 ✓
- Kanban: 4 dimensões + contadores filtrados + opções derivadas → Task 3 ✓
- Bugs: 4 dimensões + subtítulo filtrado + responsáveis derivados → Task 4 ✓
- Persistência via Zustand, filtragem client-side, match substring → coberto nas tasks 3–4 ✓
- Verificação → cada task + Task 5 ✓
- Fora de escopo (persistência além da sessão, fuzzy, outras telas) → respeitado ✓

**Placeholders:** nenhum; código completo.

**Consistência de tipos:** `KanbanFilter`/`BugsFilter` (Task 1) usados via `useFilterStore` nas telas (Tasks 3–4); `setKanbanFilter`/`setBugsFilter` recebem `Partial<...>` — chamadas passam `{ text }`, `{ priority }`, etc. (subconjuntos válidos). `FilterBar` props (Task 2) batem com o uso nas telas. `matchTask`/`matchBug` retornam boolean e filtram `Task[]`/`Bug[]`. `Select` recebe `options`+`value`+`onChange` (mesma API já usada no status inline).
