# Design — Reordenar dentro da coluna (multi-container sortable)

**Data:** 2026-07-08
**Projeto:** Origem Studio
**Autor:** Nathalia
**Status:** Aprovado (design)
**Sub-projeto:** 3/3 do 3º passo. Anteriores: CRUD editar/excluir, busca/filtro global.

## Contexto

O Kanban move cards entre colunas (append no destino) mas não permite ordenar dentro da
coluna nem escolher a posição ao mover. Este passo troca o DnD atual (`@dnd-kit/core`
draggable/droppable) pelo padrão **multi-container sortable** do `@dnd-kit/sortable`,
com reorder dentro da coluna, cross-column com índice e preview ao vivo.

## Decisões

- **Fidelidade completa**: reordenar dentro + mover entre colunas na posição exata, com preview ao vivo.
- **Verificação**: função pura de reorder testada no console + build/typecheck + visual + best-effort de drag sintético (honesto sobre o que o sintético não cobre; validação fina do arrasto é manual).

## Arquitetura

### 1. Dependências

- `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2` (helper `CSS.Transform`). `@dnd-kit/core@6.3.1` permanece.

### 2. API — `moveTask` com índice (`src/api/tasks.ts`)

- Assinatura passa a `moveTask({ taskId: string; toColumnKey: string; toIndex: number }): Promise<void>`.
- Remove a task da coluna atual e **insere em `toIndex`** na coluna destino (clamp em `[0, len]`).
- Reordenar dentro da mesma coluna é o caso `from === to` com novo índice.

### 3. Função pura de reorder — `src/lib/reorder.ts`

```
moveTaskInColumns(columns: Column[], activeId: string, overId: string): {
  columns: Column[];      // novo arranjo (imutável)
  toColumnKey: string;    // coluna destino
  toIndex: number;        // índice final na coluna destino
} | null                  // null se nada muda / ids inválidos
```
- `overId` pode ser um **id de task** (soltar sobre/perto de outro card) ou uma **key de coluna** (coluna vazia).
- Resolve a coluna/índice destino e devolve o arranjo já reordenado. Pura e determinística → **testável isolada** no console.
- Usada tanto no `onDragOver` (preview otimista) quanto no `onDragEnd` (persist).

### 4. Hook `useMoveTask` (`src/queries/mutations.ts`)

- `mutationFn` passa a receber `{ taskId, toColumnKey, toIndex }`.
- Optimistic update: aplica o mesmo cálculo de posição no cache de `columns` (insere no índice), rollback em erro, invalida no settled.

### 5. `KanbanCard` → `useSortable` (`src/components/kanban-card.tsx`)

- Troca `useDraggable` por `useSortable({ id: task.id })`.
- Aplica `transform` (via `CSS.Transform.toString`) e `transition`; `opacity` reduzida quando `isDragging`.
- Mantém `onClick={onEdit}` e o `cursor-grab`; o `activationConstraint: { distance: 5 }` do sensor segue separando clique de arrasto.

### 6. Kanban — padrão multi-container (`src/screens/kanban.tsx`)

- `DndContext` com `sensors` (PointerSensor distance 5), `collisionDetection={closestCorners}`, e handlers `onDragStart`, `onDragOver`, `onDragEnd`.
- `KanbanColumn`: `useDroppable({ id: col.key })` (captura drop em coluna vazia) envolvendo `SortableContext({ items: col.tasks.map(t => t.id), strategy: verticalListSortingStrategy })`.
- `onDragStart`: guarda o `activeTask` (para o `DragOverlay`).
- `onDragOver`: se o alvo está em outra coluna, aplica `moveTaskInColumns` no cache do Query (`setQueryData`) → preview ao vivo. (Só muda cache local; sem persistir ainda.)
- `onDragEnd`: calcula arranjo final via `moveTaskInColumns` e persiste com `moveTask.mutate({ taskId, toColumnKey, toIndex })`; limpa `activeTask`.
- `DragOverlay`: renderiza um `KanbanCard` "fantasma" do `activeTask` enquanto arrasta.

### 7. Convivência

- **Filtro**: as colunas renderizadas já vêm filtradas (`displayColumns`). O reorder opera sobre a lista visível; a posição calculada é relativa a ela — aceitável no escopo (não há reordenar preciso "por baixo" de itens ocultos).
- **Clique-pra-editar / criar / excluir**: inalterados.

## Fora de escopo

- Arraste por teclado / a11y além do padrão dnd-kit.
- Animações custom além do transform/transition do sortable.
- Persistência da ordem além da sessão (db em memória; recarregar zera).

## Verificação

1. **Função pura** (`moveTaskInColumns`) testada no console: reorder dentro da coluna; mover pra outra coluna em índice específico; soltar em coluna vazia; ids inválidos → null.
2. `npx tsc --noEmit` + `npm run build` limpos.
3. Preview: screenshots do board; best-effort de drag sintético (reorder e cross-column); console limpo.
4. Regressão: criar/editar/excluir/filtrar seguem funcionando; clique-pra-editar não conflita com o arrasto.
5. Validação fina do arrasto: manual pela Nathalia.
