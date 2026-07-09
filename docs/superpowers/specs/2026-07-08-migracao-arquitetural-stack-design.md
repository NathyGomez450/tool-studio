# Design — Migração arquitetural do Origem Studio

**Data:** 2026-07-08
**Projeto:** Origem Studio (design system / ferramenta de gestão de projeto de jogo Roblox)
**Autor:** Nathalia
**Status:** Aprovado (design)

## Contexto

O protótipo React (`react-app/`) hoje renderiza 8 telas (Painel, Kanban, Bugs, GDD,
Roadmap, Brainstorm, Assets, Equipe) a partir de dados **estáticos** importados
diretamente de `src/lib/data.ts`. A navegação entre telas é `React.useState` no
`App.tsx`. Os componentes de UI em `src/components/ui/*` são "shadcn-style"
(CVA + Radix + helper `cn`), mas o projeto nunca passou pelo init oficial do shadcn.

O objetivo é modernizar a arquitetura de estado para o stack alvo, **sem alterar
comportamento visual** (refac puro, 1º passo).

## Stack alvo

| Camada            | Biblioteca                                              |
|-------------------|---------------------------------------------------------|
| UI base           | React 18+ (componentes funcionais + hooks) — já presente |
| Build/dev         | Vite — já presente                                      |
| Linguagem         | TypeScript — já presente                                |
| Estilo            | Tailwind CSS — já presente                              |
| Componentes       | shadcn/ui (Radix + Tailwind)                            |
| Server state      | TanStack Query — nunca `useState`+`useEffect` p/ dados  |
| Client state (UI) | Zustand                                                 |

## Decisões

1. **Sem backend real** → camada de **fake API async**. Funções `async` que retornam
   os dados de `data.ts` com latência simulada. Migração futura para `fetch()` = trocar
   só o corpo da função.
2. **shadcn/ui** → rodar o **init oficial** (`components.json`, aliases, `cn`/utils) e
   **realinhar** os componentes existentes ao layout canônico. Não é reescrita — os
   componentes já seguem o padrão.
3. **Escopo** → **refac puro**. Mesmo comportamento visual; só troca a arquitetura de
   estado. Sem mutações, drag-and-drop ou features novas.

## Arquitetura

Fluxo de dados:

```
Screen  →  hook de query (src/queries)  →  função api (src/api)  →  data.ts (banco em memória)
```

Fronteiras:
- A **UI store** (Zustand) não conhece dados de API.
- As **queries** não conhecem navegação.
- Cada camada é entendível e testável isoladamente.

### 1. Camada de dados falsa — `src/api/`

- Um módulo por domínio: `tasks.ts`, `bugs.ts`, `roadmap.ts`, `gdd.ts`, `assets.ts`, `team.ts`.
- Helper compartilhado `src/api/client.ts` com `sleep(ms)` / wrapper de latência simulada.
- Cada função é `async` e retorna uma cópia dos dados de `data.ts`.
- `data.ts` deixa de ser importado pelas telas; passa a ser o "banco" em memória, consumido só pela camada `api`.
- Tipos (`Task`, `Column`, `Bug`, etc.) **permanecem em `data.ts`** e são importados pelas camadas `api`/`queries` conforme necessário (sem mover de arquivo neste passo, para minimizar diff).

### 2. Camada de queries — `src/queries/`

- Query keys centralizadas em `src/queries/keys.ts`.
- Hooks tipados: `useColumns()`, `useBugs()`, `useRoadmap()`, `useGddSections()`, `useAssets()`, `useTeam()`, `useBrainstormNotes()`.
- `QueryClient` + `QueryClientProvider` configurados em `main.tsx` (defaults sensatos: `staleTime`, `retry`, `refetchOnWindowFocus`).
- Cada tela consome o hook e trata **loading** (skeleton leve alinhado ao layout da tela) e **error** (mensagem discreta). O estado final renderizado é **visualmente idêntico** ao atual.

### 3. Client state (UI) — `src/stores/`

- `useUiStore` (Zustand) com `activeScreen: string` e `setActiveScreen(key)`.
- `App.tsx` deixa de usar `React.useState` para navegação e passa a ler/escrever na store.
- Estado local de tela (ex.: seção ativa do GDD, aba de progressão do Dashboard) **permanece `useState` local** — não é estado global de UI.
- **Regra dura:** nenhum dado vindo da camada `api` mora em `useState`/`useEffect`.

### 4. shadcn/ui

- Rodar o CLI de init do shadcn: gera `components.json`, confirma aliases (`@/components`, `@/lib/utils`), utilitário `cn`.
- Realinhar `src/components/ui/*` ao layout canônico do shadcn (mantendo aparência e API atuais).
- Corrigir o warning de CSS: mover o `@import` da fonte do Google para **antes** das diretivas `@tailwind` em `src/index.css`.

## Fora de escopo

- Mutações (`useMutation`), invalidação de cache por escrita.
- Drag-and-drop no Kanban.
- Backend HTTP real (MSW, json-server, API REST).
- Qualquer feature ou mudança visual nova.

## Verificação

O projeto é um protótipo e **não tem infra de teste**. A verificação é por
**paridade visual**: após a migração, dirigir o preview local (Vite em `:5173`)
tela a tela e confirmar que cada uma renderiza idêntica ao estado pré-refac,
incluindo transições de loading → conteúdo sem erros no console.
