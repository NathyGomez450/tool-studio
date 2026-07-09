# Design — Busca/filtro global

**Data:** 2026-07-08
**Projeto:** Origem Studio
**Autor:** Nathalia
**Status:** Aprovado (design)
**Sub-projeto:** 2/3 do 3º passo. Anterior: CRUD editar/excluir. Próximo: reordenar dentro da coluna.

## Contexto

Kanban e Bugs listam todos os itens sem forma de buscar/filtrar. Este passo adiciona
busca por texto + filtros estruturados, com o critério guardado no Zustand (estado de UI,
persiste ao navegar entre telas).

## Decisões

- **Filtro independente por tela** (Kanban e Bugs têm seus próprios critérios).
- **4 dimensões**: busca por texto, prioridade/severidade, tag/status, responsável.
- **Filtragem client-side** sobre os dados do TanStack Query (match por substring, exato nos Selects).
- **Contadores refletem o resultado filtrado** (sem filtro = números atuais).

## Arquitetura

### 1. Store de filtros — `src/stores/filter-store.ts`

```typescript
interface KanbanFilter { text: string; priority: string; tag: string; assignee: string }
interface BugsFilter { text: string; severity: string; status: string; assignee: string }
```
`useFilterStore` (Zustand):
- `kanban: KanbanFilter` (inicial tudo `''`), `bugs: BugsFilter` (inicial tudo `''`)
- `setKanbanFilter(patch: Partial<KanbanFilter>)`, `setBugsFilter(patch: Partial<BugsFilter>)`
- `clearKanban()`, `clearBugs()`
- String vazia = "todos".

### 2. `FilterBar` — `src/components/filter-bar.tsx`

Casca reutilizável renderizada abaixo do `TopBar`:
- Props: `{ search: string; onSearch: (v: string) => void; onClear: () => void; hasActiveFilter: boolean; children?: React.ReactNode }`.
- Layout: `Input` de busca (placeholder "Buscar…") + `children` (os Selects da tela) + botão **Limpar** (renderizado só quando `hasActiveFilter`).
- Estilo alinhado ao design system (linha horizontal, gap, borda inferior sutil).

### 3. Kanban — `src/screens/kanban.tsx`

- Lê `kanban` filter + setter do `useFilterStore`.
- Deriva opções dinâmicas dos dados: `allTags` (união de `task.tags`), `allAssignees` (união de `task.assignees`).
- Função `matchTask(task)`: texto casa (`title`/`id`, lowercase includes) E `priority` (vazio ou igual) E `tag` (vazio ou em `tags`) E `assignee` (vazio ou em `assignees`).
- Colunas renderizam `col.tasks.filter(matchTask)`; header da coluna e `totalTasks` contam o filtrado.
- `FilterBar` com Selects: Prioridade (todas + low/medium/high/critical), Tag (todas + allTags), Responsável (todos + allAssignees).
- `hasActiveFilter` = qualquer campo do filtro não-vazio; `onClear` = `clearKanban()`.

### 4. Bugs — `src/screens/bugs.tsx`

- Lê `bugs` filter + setter do `useFilterStore`.
- Deriva `allAssignees` (união de `bug.assignee` != '—').
- Função `matchBug(bug)`: texto (`title`/`id`) E `severity` E `status` E `assignee`.
- Tabela renderiza `bugs.filter(matchBug)`; subtítulo conta o filtrado.
- `FilterBar` com Selects: Severidade, Status, Responsável.

### 5. Opções dos Selects

- Prioridade/severidade/status: listas fixas (as mesmas já usadas nos dialogs/status inline), com uma opção inicial "Todas/Todos" (`value: ''`).
- Tag/Responsável: `[{ value: '', label: 'Todos' }, ...derivados]`.

## Interação com o existente

- Drag-and-drop e clique-pra-editar seguem nos cards/linhas visíveis; mover/editar/excluir operam por ID, independentes do filtro.
- Filtro persiste ao navegar (Zustand); recarregar a página zera (estado em memória).

## Fora de escopo

- Persistência do filtro além da sessão; combinações salvas; busca fuzzy.
- Filtro no Dashboard/Roadmap/GDD/Assets/Team.

## Verificação (preview)

1. Kanban: digitar no busca filtra cards em tempo real (título/ID); contadores acompanham.
2. Kanban: cada Select (prioridade, tag, responsável) restringe; combinar dimensões afunila.
3. Kanban: "Limpar" reseta e some quando não há filtro.
4. Bugs: busca + severidade + status + responsável idem; subtítulo reflete filtrado.
5. Navegar pra outra tela e voltar mantém o filtro (Zustand).
6. Sob filtro: mover card (drag), editar e excluir continuam funcionando.
7. Console limpo.
