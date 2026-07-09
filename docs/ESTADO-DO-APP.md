# Origem Studio — Estado e funcionamento do app

> Documento de referência do estado atual (2026-07-08). Descreve arquitetura, o que cada
> tela faz (leitura vs escrita/CRUD), o design system e as limitações conhecidas.

## Visão geral

Protótipo de ferramenta de gestão de projeto de jogo (Roblox) — "Origem Studio",
projeto fictício "Skyline Racer". SPA React, sem backend real: os dados vivem em memória.

## Stack

| Camada            | Tecnologia |
|-------------------|------------|
| UI                | React 18 (componentes funcionais + hooks) |
| Build/dev         | Vite 8 |
| Linguagem         | TypeScript |
| Estilo            | Tailwind CSS 3.4 + tokens OKLCH (CSS vars) |
| Componentes       | shadcn/ui (Radix + Tailwind), `components.json` |
| Server state      | TanStack Query 5 |
| Client state (UI) | Zustand 5 |
| Drag-and-drop     | @dnd-kit (core + sortable) |

## Arquitetura de dados (sem backend)

```
data.ts (semente estática)
   │  structuredClone no load
   ▼
db.ts (banco MUTÁVEL em memória)        ← só p/ domínios com escrita (tarefas, bugs)
   │
   ▼
api/*.ts (fake API async: fetch* + write*)   ← simula latência; troca por fetch() = só o corpo
   │
   ▼
queries/hooks.ts (useQuery)  +  queries/mutations.ts (useMutation + invalidação/optimistic)
   │
   ▼
telas (src/screens/*) e componentes
```

- **Estado de servidor** (dados) → TanStack Query. Nunca `useState`/`useEffect` pra dados.
- **Estado de UI** (navegação, filtros, dialogs abertos) → Zustand (`stores/ui-store.ts`, `stores/filter-store.ts`) ou `useState` local.
- **Persistência é em memória**: recarregar a página zera tudo para o seed de `data.ts`. É o comportamento esperado do protótipo.

## Telas — o que cada uma faz

| Tela        | Leitura | Escrita (CRUD)                                              | Fonte de dados      |
|-------------|---------|------------------------------------------------------------|---------------------|
| **Painel**  | ✅      | —                                                          | `db`/`data.ts` (dashboard) |
| **Kanban**  | ✅      | **Criar, mover (drag), editar, excluir** tarefas           | `db` mutável        |
| **Bugs**    | ✅      | **Reportar, editar, excluir, mudar status**                | `db` mutável        |
| **GDD**     | ✅      | ❌ **somente-leitura** (troca de seção é estado local)     | `data.ts` (estático)|
| **Roadmap** | ✅      | ❌ somente-leitura                                         | `data.ts` (estático)|
| **Brainstorm** | ✅   | ❌ somente-leitura (botão "+ Nota" decorativo)             | `data.ts` (estático)|
| **Assets**  | ✅      | ❌ **somente-leitura** (botão "+ Upload" decorativo, sem handler) | `data.ts` (estático)|
| **Equipe**  | ✅      | ❌ somente-leitura                                         | `data.ts` (estático)|

### Detalhe: GDD e Assets

Ambas são **display-only** hoje:
- **Assets**: `useAssets()` lê de `data.ts`; renderiza o grid. O botão **"+ Upload" não tem
  `onClick`** — é decorativo. Não há criar/editar/excluir.
- **GDD**: `useGddSections()` lê de `data.ts`; a sidebar troca a seção ativa via `useState`
  local. Não há adicionar página, editar texto nem excluir.

Motivo: as mutações (criar/editar/excluir + `db` mutável) foram implementadas só para
**Kanban** e **Bugs**. Os demais domínios continuam lendo o seed direto, sem camada de escrita.

### Como adicionar CRUD a GDD/Assets (receita)

Replicar o padrão de Kanban/Bugs:
1. Semear o domínio no `db.ts` (ex.: `assets`, `gddSections`).
2. Adicionar `create*/update*/delete*` em `api/assets.ts` / `api/gdd.ts` (mutando o `db` + `persist`).
3. Criar hooks `useCreate*/useUpdate*/useDelete*` em `queries/mutations.ts` (invalidando a query).
4. UI: dialog + wiring (ex.: botão "+ Upload" abre dialog de novo asset).

## Busca e filtro

- **Kanban** e **Bugs** têm busca por texto + filtros (prioridade/severidade, tag/status, responsável).
- Critério fica no **Zustand** (`filter-store.ts`), persiste ao navegar; recarregar zera.
- Filtragem é client-side sobre os dados do Query; contadores refletem o resultado filtrado.
- Sem resultado → estado vazio ("Nenhuma tarefa/bug encontrado").

## Drag-and-drop (Kanban)

- `@dnd-kit/sortable` (multi-container): reordenar dentro da coluna **e** mover entre colunas
  na posição exata, com preview ao vivo.
- Lógica isolada em `lib/reorder.ts` (`moveTaskInColumns`, pura e testável).
- Clique curto no card abre edição; arrasto move (distingue via `activationConstraint` de 5px).

## Design system / tema

- Tema **escuro "profissional"** (referência: portal Apex/FuelTech): base **azul + preto**
  (near-black neutro + acento azul), fonte **Inter**, badges tonais.
- **Cor nos elementos visuais** (a base azul/preto fica no "chrome"):
  - KPIs do Painel: ícone colorido por métrica + barras por faixa de valor.
  - Cabeçalho de cada tela: quadrado de ícone na cor do módulo (Painel azul, Kanban ciano,
    Bugs vermelho, GDD roxo, Roadmap verde, Brainstorm âmbar).
  - Tags do Kanban: tingidas por categoria; bullets do Roadmap: por status.
- Tokens OKLCH em `src/index.css` (`:root`) dirigem tudo; `tailwind.config.js` mapeia.
- **Nota:** a API dos nossos componentes (`Badge` usa `tone`, `Button` usa `variant` com
  primary/secondary/ghost/danger) é **nossa** — os snippets do DS FuelTech foram usados só
  como inspiração de estilo, não copiados na API.

## Como rodar

```bash
npm install
npm run dev      # Vite em http://localhost:5173
npm run build    # tsc -b && vite build
```

## Limitações e pendências conhecidas

- **Persistência**: só em memória (recarregar zera). Sem backend/HTTP real.
- **GDD, Roadmap, Brainstorm, Assets, Equipe**: somente-leitura (sem CRUD).
- **Validação fina do drag**: o arrasto do Kanban deve ser validado manualmente
  (a verificação automatizada com pointer sintético não dirige o `@dnd-kit/sortable`).
- **Paridade com o DS FuelTech**: adotado o *estilo* (azul+preto, quadrados de ícone,
  sidebar), não os componentes/tokens exatos do design system.
- **Gotcha de dev**: instalar dependências com o dev server do Vite no ar pode causar
  "Invalid hook call" (React duplicado transiente); reiniciar o server + `rm -rf node_modules/.vite`.

## Histórico (docs)

Specs e planos de cada etapa estão em `docs/superpowers/specs/` e `docs/superpowers/plans/`
(migração de stack, mutações, CRUD, busca/filtro, reordenar, redesign, variedade de cor).
