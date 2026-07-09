# Migração arquitetural do Origem Studio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o protótipo Origem Studio para o stack alvo (TanStack Query para dados, Zustand para estado de UI, shadcn/ui) sem alterar o comportamento visual.

**Architecture:** Fluxo `Screen → hook de query (src/queries) → função api (src/api) → data.ts (banco em memória)`. A camada `api` simula latência de rede sobre dados estáticos; TanStack Query gerencia cache/loading/error; Zustand guarda apenas estado global de UI (navegação). Nenhum dado de API vive em `useState`/`useEffect`.

**Tech Stack:** React 18.3, Vite 5, TypeScript, Tailwind 3.4, shadcn/ui, @tanstack/react-query 5.101.2, zustand 5.0.14.

## Global Constraints

- **Paridade visual:** o estado final renderizado de cada tela deve ser idêntico ao pré-refac. Verificação por preview, não por teste automatizado (projeto não tem infra de teste).
- **Proibido `useState`/`useEffect` para dados de API.** Dados sempre via TanStack Query.
- **Estado global de UI só via Zustand.** Estado local de tela (seção do GDD, etc.) permanece `useState` local.
- **Preservar os design tokens.** NÃO rodar o `shadcn init` destrutivo — ele sobrescreve `src/index.css` e `tailwind.config.js`, quebrando os tokens OKLCH custom. O `components.json` é criado manualmente.
- **Versões exatas:** `@tanstack/react-query@5.101.2`, `zustand@5.0.14`.
- **Verificação de cada task:** `npx tsc --noEmit` deve passar; para tasks com efeito visual, dirigir o preview em `http://localhost:5173`.
- **Commits atômicos** ao fim de cada task, em português no corpo, com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Criar:**
- `src/api/client.ts` — helper de latência simulada + cópia de dados
- `src/api/tasks.ts` — `fetchColumns()`
- `src/api/bugs.ts` — `fetchBugs()`
- `src/api/roadmap.ts` — `fetchRoadmap()`
- `src/api/gdd.ts` — `fetchGddSections()`
- `src/api/assets.ts` — `fetchAssets()`
- `src/api/team.ts` — `fetchTeam()`
- `src/api/brainstorm.ts` — `fetchBrainstormNotes()`
- `src/api/dashboard.ts` — `fetchDashboard()`
- `src/queries/keys.ts` — query keys centralizadas
- `src/queries/hooks.ts` — hooks tipados (`useColumns`, `useBugs`, …)
- `src/stores/ui-store.ts` — `useUiStore` (Zustand)
- `src/components/screen-state.tsx` — `<ScreenLoading/>`, `<ScreenError/>`
- `components.json` — config shadcn (autoria manual)

**Modificar:**
- `src/lib/data.ts` — adicionar tipos + dados do dashboard (hoje inline na tela)
- `src/main.tsx` — envolver App com `QueryClientProvider`
- `src/App.tsx` — navegação via `useUiStore` em vez de `useState`
- `src/screens/*.tsx` (8 telas) — consumir hooks de query com loading/error
- `src/index.css` — mover `@import` da fonte para antes de `@tailwind`

---

## Task 1: Fundação da fake API + dados do dashboard

**Files:**
- Create: `src/api/client.ts`
- Modify: `src/lib/data.ts` (adicionar tipos e dados do dashboard ao fim do arquivo)

**Interfaces:**
- Consumes: nada (primeira task).
- Produces:
  - `FAKE_LATENCY: number`
  - `sleep(ms: number): Promise<void>`
  - `fake<T>(data: T, ms?: number): Promise<T>` — retorna cópia profunda dos dados após latência
  - Em `data.ts`: `DashboardStat`, `SprintProgress`, `DashboardActivity`, `DashboardData` (tipos) e `dashboard: DashboardData` (dados)

- [ ] **Step 1: Criar `src/api/client.ts`**

```typescript
export const FAKE_LATENCY = 300;

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simula uma chamada de rede: espera `ms` e devolve uma cópia profunda
 * dos dados, como um endpoint HTTP faria. Trocar por fetch() no futuro
 * é substituir só o corpo das funções em src/api/*.
 */
export async function fake<T>(data: T, ms: number = FAKE_LATENCY): Promise<T> {
  await sleep(ms);
  return structuredClone(data);
}
```

- [ ] **Step 2: Adicionar tipos e dados do dashboard ao fim de `src/lib/data.ts`**

Os dados abaixo hoje moram inline em `src/screens/dashboard.tsx` (constantes `stats`, sprint progress e `activity`). Mova-os para cá, verbatim.

```typescript
export interface DashboardStat {
  label: string;
  value: string;
}

export interface SprintProgress {
  label: string;
  value: number;
}

export interface DashboardActivity {
  who: string;
  what: string;
  when: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  sprint: SprintProgress[];
  activity: DashboardActivity[];
}

export const dashboard: DashboardData = {
  stats: [
    { label: 'Tarefas abertas', value: '38' },
    { label: 'Bugs críticos', value: '3' },
    { label: 'Sprint atual', value: '64%' },
    { label: 'Marcos no prazo', value: '5/6' },
  ],
  sprint: [
    { label: 'Mecânicas de corrida', value: 80 },
    { label: 'UI de progressão', value: 45 },
    { label: 'Sistema de loja', value: 20 },
  ],
  activity: [
    { who: 'Carlos Dias', what: 'moveu BUG-2231 para Em Revisão', when: 'há 12 min' },
    { who: 'Léo Ramos', what: 'comentou em TASK-142', when: 'há 40 min' },
    { who: 'Marina Souza', what: 'concluiu TASK-138', when: 'há 1h' },
    { who: 'Ana Prado', what: 'adicionou nova página ao GDD: Progressão', when: 'há 3h' },
  ],
};
```

- [ ] **Step 3: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros (o dashboard ainda usa suas constantes inline; a duplicação temporária é removida na Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/api/client.ts src/lib/data.ts
git commit -m "feat: adiciona helper de fake API e dados do dashboard no banco em memória

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Módulos da fake API por domínio

**Files:**
- Create: `src/api/tasks.ts`, `src/api/bugs.ts`, `src/api/roadmap.ts`, `src/api/gdd.ts`, `src/api/assets.ts`, `src/api/team.ts`, `src/api/brainstorm.ts`, `src/api/dashboard.ts`

**Interfaces:**
- Consumes: `fake<T>()` de `src/api/client.ts`; dados e tipos de `src/lib/data.ts`.
- Produces:
  - `fetchColumns(): Promise<Column[]>`
  - `fetchBugs(): Promise<Bug[]>`
  - `fetchRoadmap(): Promise<RoadmapQuarter[]>`
  - `fetchGddSections(): Promise<GddSection[]>`
  - `fetchAssets(): Promise<Asset[]>`
  - `fetchTeam(): Promise<TeamMember[]>`
  - `fetchBrainstormNotes(): Promise<typeof brainstormNotes>`
  - `fetchDashboard(): Promise<DashboardData>`

- [ ] **Step 1: Criar os módulos de fetch**

`src/api/tasks.ts`:
```typescript
import { fake } from './client';
import { columns, type Column } from '@/lib/data';

export function fetchColumns(): Promise<Column[]> {
  return fake(columns);
}
```

`src/api/bugs.ts`:
```typescript
import { fake } from './client';
import { bugs, type Bug } from '@/lib/data';

export function fetchBugs(): Promise<Bug[]> {
  return fake(bugs);
}
```

`src/api/roadmap.ts`:
```typescript
import { fake } from './client';
import { roadmap, type RoadmapQuarter } from '@/lib/data';

export function fetchRoadmap(): Promise<RoadmapQuarter[]> {
  return fake(roadmap);
}
```

`src/api/gdd.ts`:
```typescript
import { fake } from './client';
import { gddSections, type GddSection } from '@/lib/data';

export function fetchGddSections(): Promise<GddSection[]> {
  return fake(gddSections);
}
```

`src/api/assets.ts`:
```typescript
import { fake } from './client';
import { assets, type Asset } from '@/lib/data';

export function fetchAssets(): Promise<Asset[]> {
  return fake(assets);
}
```

`src/api/team.ts`:
```typescript
import { fake } from './client';
import { team, type TeamMember } from '@/lib/data';

export function fetchTeam(): Promise<TeamMember[]> {
  return fake(team);
}
```

`src/api/brainstorm.ts`:
```typescript
import { fake } from './client';
import { brainstormNotes } from '@/lib/data';

export function fetchBrainstormNotes(): Promise<typeof brainstormNotes> {
  return fake(brainstormNotes);
}
```

`src/api/dashboard.ts`:
```typescript
import { fake } from './client';
import { dashboard, type DashboardData } from '@/lib/data';

export function fetchDashboard(): Promise<DashboardData> {
  return fake(dashboard);
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/api/
git commit -m "feat: adiciona módulos de fetch da fake API por domínio

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Instalar libs + configurar TanStack Query + hooks

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/queries/keys.ts`, `src/queries/hooks.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: funções `fetch*` de `src/api/*`.
- Produces:
  - `queryKeys` (objeto com chaves por domínio)
  - Hooks: `useColumns()`, `useBugs()`, `useRoadmap()`, `useGddSections()`, `useAssets()`, `useTeam()`, `useBrainstormNotes()`, `useDashboard()` — cada um retorna o `UseQueryResult` tipado do TanStack Query.

- [ ] **Step 1: Instalar dependências**

Run:
```bash
npm install @tanstack/react-query@5.101.2 zustand@5.0.14
```
Expected: `package.json` passa a listar ambas em `dependencies`.

- [ ] **Step 2: Criar `src/queries/keys.ts`**

```typescript
export const queryKeys = {
  columns: ['columns'] as const,
  bugs: ['bugs'] as const,
  roadmap: ['roadmap'] as const,
  gdd: ['gdd'] as const,
  assets: ['assets'] as const,
  team: ['team'] as const,
  brainstorm: ['brainstorm'] as const,
  dashboard: ['dashboard'] as const,
};
```

- [ ] **Step 3: Criar `src/queries/hooks.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchColumns } from '@/api/tasks';
import { fetchBugs } from '@/api/bugs';
import { fetchRoadmap } from '@/api/roadmap';
import { fetchGddSections } from '@/api/gdd';
import { fetchAssets } from '@/api/assets';
import { fetchTeam } from '@/api/team';
import { fetchBrainstormNotes } from '@/api/brainstorm';
import { fetchDashboard } from '@/api/dashboard';

export function useColumns() {
  return useQuery({ queryKey: queryKeys.columns, queryFn: fetchColumns });
}

export function useBugs() {
  return useQuery({ queryKey: queryKeys.bugs, queryFn: fetchBugs });
}

export function useRoadmap() {
  return useQuery({ queryKey: queryKeys.roadmap, queryFn: fetchRoadmap });
}

export function useGddSections() {
  return useQuery({ queryKey: queryKeys.gdd, queryFn: fetchGddSections });
}

export function useAssets() {
  return useQuery({ queryKey: queryKeys.assets, queryFn: fetchAssets });
}

export function useTeam() {
  return useQuery({ queryKey: queryKeys.team, queryFn: fetchTeam });
}

export function useBrainstormNotes() {
  return useQuery({ queryKey: queryKeys.brainstorm, queryFn: fetchBrainstormNotes });
}

export function useDashboard() {
  return useQuery({ queryKey: queryKeys.dashboard, queryFn: fetchDashboard });
}
```

- [ ] **Step 4: Configurar o provider em `src/main.tsx`**

Substituir o conteúdo por:

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 5: Verificar typecheck e build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros; build conclui.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/queries/ src/main.tsx
git commit -m "feat: configura TanStack Query com provider e hooks de query tipados

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Zustand UI store + navegação

**Files:**
- Create: `src/stores/ui-store.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `create` de `zustand` (instalado na Task 3).
- Produces:
  - `useUiStore` — store com `{ activeScreen: string; setActiveScreen: (key: string) => void }`

- [ ] **Step 1: Criar `src/stores/ui-store.ts`**

```typescript
import { create } from 'zustand';

interface UiState {
  activeScreen: string;
  setActiveScreen: (key: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeScreen: 'dashboard',
  setActiveScreen: (key) => set({ activeScreen: key }),
}));
```

- [ ] **Step 2: Migrar `src/App.tsx` para a store**

Trocar o bloco de estado. Remover o import de `React` de estado e usar a store:

De:
```typescript
export default function App() {
  const [active, setActive] = React.useState<string>('dashboard');
  const current = NAV.find((n) => n.key === active) ?? NAV[0];
```

Para:
```typescript
export default function App() {
  const active = useUiStore((s) => s.activeScreen);
  const setActive = useUiStore((s) => s.setActiveScreen);
  const current = NAV.find((n) => n.key === active) ?? NAV[0];
```

Adicionar o import no topo (após os imports de screens):
```typescript
import { useUiStore } from '@/stores/ui-store';
```

O JSX que usa `active`/`setActive` (o `.map` da nav) permanece inalterado. O import `import * as React from 'react'` pode permanecer (JSX precisa dele no runtime clássico; com `react-jsx` é dispensável, mas mantê-lo não causa erro).

- [ ] **Step 3: Verificar typecheck e paridade no preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview: recarregar `http://localhost:5173`, clicar em cada item da nav (Painel, Kanban, Bugs, GDD, Roadmap, Brainstorm, Assets, Equipe) e confirmar que a troca de tela funciona igual a antes.

- [ ] **Step 4: Commit**

```bash
git add src/stores/ src/App.tsx
git commit -m "feat: move navegação para store Zustand de UI

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Componentes de loading/error + migração das telas de lista

**Files:**
- Create: `src/components/screen-state.tsx`
- Modify: `src/screens/bugs.tsx`, `src/screens/roadmap.tsx`, `src/screens/assets.tsx`, `src/screens/team.tsx`, `src/screens/gdd.tsx`, `src/screens/brainstorm.tsx`

**Interfaces:**
- Consumes: hooks de `src/queries/hooks.ts`.
- Produces:
  - `<ScreenLoading/>`, `<ScreenError/>` de `src/components/screen-state.tsx`

- [ ] **Step 1: Criar `src/components/screen-state.tsx`**

```tsx
export function ScreenLoading() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-tertiary">
      Carregando…
    </div>
  );
}

export function ScreenError() {
  return (
    <div className="flex items-center justify-center py-16 text-sm text-danger">
      Erro ao carregar dados.
    </div>
  );
}
```

- [ ] **Step 2: Migrar `src/screens/bugs.tsx`**

Trocar o import de dados e envolver a lista em estados de query. O `TopBar` continua sempre visível; só o conteúdo troca.

Remover:
```typescript
import { bugs, type Bug } from '@/lib/data';
```
Adicionar:
```typescript
import { type Bug } from '@/lib/data';
import { useBugs } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```

No corpo do componente, no topo do `Bugs()`:
```tsx
export function Bugs() {
  const { data: bugs, isLoading, isError } = useBugs();
  return (
    <>
      <TopBar title="Bug Tracker — Skyline Racer" subtitle="5 bugs · 2 críticos abertos" actions={<Button>+ Reportar bug</Button>} />
      <div className="flex-1 overflow-auto p-5 px-6">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !bugs ? (
          <ScreenError />
        ) : (
          <div className="flex flex-col border border-border rounded-md overflow-hidden">
            {/* ...conteúdo original da tabela, inalterado, usando `bugs`... */}
          </div>
        )}
      </div>
    </>
  );
}
```
O bloco da tabela (cabeçalho grid + `bugs.map(...)`) é o mesmo de hoje — apenas movido para dentro do ramo `else`.

- [ ] **Step 3: Migrar `src/screens/roadmap.tsx`**

Substituir `import { roadmap, type RoadmapQuarter } from '@/lib/data'` por:
```typescript
import { type RoadmapQuarter } from '@/lib/data';
import { useRoadmap } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```
No componente: `const { data: roadmap, isLoading, isError } = useRoadmap();`. Envolver o conteúdo (o que renderiza a partir de `roadmap`) no mesmo padrão ternário: `isLoading ? <ScreenLoading/> : isError || !roadmap ? <ScreenError/> : (<conteúdo original>)`, mantendo o `TopBar` sempre visível.

- [ ] **Step 4: Migrar `src/screens/assets.tsx`**

Substituir `import { assets } from '@/lib/data'` por:
```typescript
import { useAssets } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```
No componente: `const { data: assets, isLoading, isError } = useAssets();`. Envolver o conteúdo no mesmo padrão ternário (`!assets` → `<ScreenError/>`), `TopBar` sempre visível.

- [ ] **Step 5: Migrar `src/screens/team.tsx`**

Substituir `import { team } from '@/lib/data'` por:
```typescript
import { useTeam } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```
No componente: `const { data: team, isLoading, isError } = useTeam();`. Mesmo padrão ternário (`!team` → `<ScreenError/>`).

- [ ] **Step 6: Migrar `src/screens/gdd.tsx`**

Substituir `import { gddSections } from '@/lib/data'` por:
```typescript
import { useGddSections } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```
No componente: `const { data: gddSections, isLoading, isError } = useGddSections();`.

**Atenção — estado local:** o GDD tem estado de seção ativa em `useState` local. Esse estado permanece `useState` (é UI local, não dado de API). Como o valor inicial pode depender de `gddSections`, garantir que o cálculo da seção ativa só ocorra no ramo com dados carregados. Padrão:
```tsx
export function Gdd() {
  const { data: gddSections, isLoading, isError } = useGddSections();
  if (isLoading) return (<><TopBar .../><div className="flex-1 overflow-auto"><ScreenLoading /></div></>);
  if (isError || !gddSections) return (<><TopBar .../><div className="flex-1 overflow-auto"><ScreenError /></div></>);
  return <GddContent sections={gddSections} />;
}
```
Extrair o corpo atual (que usa `useState` de seção ativa + render) para um subcomponente `GddContent({ sections }: { sections: GddSection[] })` no mesmo arquivo, recebendo `sections` por prop. Isso mantém os hooks de estado local sempre chamados na mesma ordem (dentro de `GddContent`, que só monta com dados prontos). Importar `type GddSection` de `@/lib/data` para tipar a prop. Reaproveitar o `title`/`subtitle` originais do `TopBar` nos três ramos.

- [ ] **Step 7: Migrar `src/screens/brainstorm.tsx`**

Substituir `import { brainstormNotes } from '@/lib/data'` por:
```typescript
import { useBrainstormNotes } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```
No componente: `const { data: brainstormNotes, isLoading, isError } = useBrainstormNotes();`. Mesmo padrão ternário (`!brainstormNotes` → `<ScreenError/>`), `TopBar` sempre visível.

- [ ] **Step 8: Verificar typecheck e paridade no preview**

Run: `npx tsc --noEmit`
Expected: sem erros.

Preview: recarregar e visitar Bugs, Roadmap, Assets, Equipe, GDD e Brainstorm. Confirmar breve "Carregando…" seguido do conteúdo idêntico ao original, sem erros no console.

- [ ] **Step 9: Commit**

```bash
git add src/components/screen-state.tsx src/screens/bugs.tsx src/screens/roadmap.tsx src/screens/assets.tsx src/screens/team.tsx src/screens/gdd.tsx src/screens/brainstorm.tsx
git commit -m "feat: migra telas de lista para TanStack Query com loading/error

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Migração das telas compostas (Dashboard e Kanban)

**Files:**
- Modify: `src/screens/dashboard.tsx`, `src/screens/kanban.tsx`

**Interfaces:**
- Consumes: `useDashboard()`, `useColumns()` de `src/queries/hooks.ts`; `<ScreenLoading/>`, `<ScreenError/>`.
- Produces: nada novo.

- [ ] **Step 1: Migrar `src/screens/dashboard.tsx`**

Remover as constantes inline `stats` e `activity` (linhas 7–19) — os dados agora vêm de `useDashboard()` (movidos para `data.ts` na Task 1). O array de sprint progress inline vira `dashboardData.sprint`.

Adicionar imports:
```typescript
import { useDashboard } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```

Corpo:
```tsx
export function Dashboard() {
  const { data, isLoading, isError } = useDashboard();
  return (
    <>
      <TopBar title="Painel — Skyline Racer" subtitle="Visão geral do projeto" />
      <div className="p-6 overflow-auto flex flex-col gap-5">
        {isLoading ? (
          <ScreenLoading />
        ) : isError || !data ? (
          <ScreenError />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3.5">
              {data.stats.map((s) => (
                <Card key={s.label}>
                  <div className="text-xs text-tertiary mb-2">{s.label}</div>
                  <div className="text-[28px] font-bold text-primary tracking-tight">{s.value}</div>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-[1.4fr_1fr] gap-4">
              <Card>
                <div className="text-[13px] font-semibold text-primary mb-3.5">Progresso do sprint 14</div>
                <div className="flex flex-col gap-3">
                  {data.sprint.map((p) => (
                    <div key={p.label}>
                      <div className="flex justify-between text-xs text-secondary mb-1.5">
                        <span>{p.label}</span>
                        <span className="font-mono text-tertiary">{p.value}%</span>
                      </div>
                      <ProgressBar value={p.value} />
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <div className="text-[13px] font-semibold text-primary mb-3.5">Atividade recente</div>
                <div className="flex flex-col gap-3">
                  {data.activity.map((a) => (
                    <div key={a.when + a.who} className="flex gap-2.5 items-start">
                      <Avatar name={a.who} size={26} />
                      <div className="text-xs text-secondary leading-relaxed">
                        <span className="text-primary font-semibold">{a.who}</span> {a.what}
                        <div className="text-disabled text-[11px]">{a.when}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Migrar `src/screens/kanban.tsx`**

Substituir `import { columns } from '@/lib/data'` por:
```typescript
import { useColumns } from '@/queries/hooks';
import { ScreenLoading, ScreenError } from '@/components/screen-state';
```
No componente: `const { data: columns, isLoading, isError } = useColumns();`. Envolver o conteúdo do board (o que itera sobre `columns`) no padrão ternário (`!columns` → `<ScreenError/>`), mantendo o `TopBar`/cabeçalho sempre visível como no original. O `KanbanCard` e o mapeamento das colunas permanecem inalterados dentro do ramo com dados.

- [ ] **Step 3: Verificar typecheck, build e paridade no preview**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros; build conclui.

Preview: recarregar, abrir Painel e Kanban. Confirmar conteúdo idêntico ao original após o loading, sem erros no console. Conferir que não há mais nenhuma constante de dados inline nessas telas.

- [ ] **Step 4: Commit**

```bash
git add src/screens/dashboard.tsx src/screens/kanban.tsx
git commit -m "feat: migra Painel e Kanban para TanStack Query

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Setup shadcn/ui (components.json) + fix do @import CSS

**Files:**
- Create: `components.json`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: nada.
- Produces: `components.json` compatível com shadcn CLI (para `shadcn add` futuro).

- [ ] **Step 1: Corrigir a ordem do `@import` em `src/index.css`**

Mover a linha do `@import` da fonte do Google para o **topo do arquivo**, antes das diretivas `@tailwind`. Resultado das primeiras linhas:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---- Origem Studio design tokens (ported from the design system's tokens/*.css) ---- */
```
Nada mais no arquivo muda. Isso elimina o warning `@import must precede all other statements`.

- [ ] **Step 2: Criar `components.json` na raiz do `react-app`**

> Autoria manual deliberada: NÃO rodar `npx shadcn init`, que sobrescreveria `src/index.css` e `tailwind.config.js` com os tokens padrão do shadcn e quebraria o design system OKLCH. Este arquivo reflete a estrutura já existente e habilita `npx shadcn add <componente>` no futuro.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "utils": "@/lib/utils",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Verificar build e ausência do warning**

Run: `npm run build`
Expected: build conclui sem o warning de `@import`.

Preview: recarregar e confirmar que as fontes (Space Grotesk / IBM Plex Mono) continuam carregando e o visual está idêntico.

- [ ] **Step 4: Commit**

```bash
git add components.json src/index.css
git commit -m "chore: adiciona components.json do shadcn e corrige ordem do @import

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Verificação final de paridade

**Files:** nenhum (verificação).

- [ ] **Step 1: Typecheck + build limpos**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 2: Varredura de resíduos**

Run: `grep -rn "from '@/lib/data'" src/screens/`
Expected: nenhuma tela importa dados de `data.ts` diretamente (só tipos, se houver). Todo consumo de dado passa pelos hooks de query.

Run: `grep -rn "useState\|useEffect" src/screens/`
Expected: apenas estado de UI local (ex.: seção do GDD, abas). Nenhum uso guardando dados de API.

- [ ] **Step 3: Paridade visual tela a tela no preview**

Recarregar `http://localhost:5173` e percorrer as 8 telas (Painel, Kanban, Bugs, GDD, Roadmap, Brainstorm, Assets, Equipe). Para cada uma: confirmar loading breve → conteúdo idêntico ao baseline, console sem erros/warnings.

- [ ] **Step 4: Commit final (se houver ajuste) e resumo**

Se algum ajuste de paridade foi necessário, commitar. Caso contrário, a task encerra a implementação.

---

## Self-Review

**Cobertura do spec:**
- Fake API async → Tasks 1–2 ✓
- TanStack Query (provider, keys, hooks, loading/error, sem useState/useEffect p/ dados) → Tasks 3, 5, 6 ✓
- Zustand para navegação → Task 4 ✓
- shadcn init/realinhamento → Task 7 (components.json manual, preservando tokens) ✓
- Fix do `@import` CSS → Task 7 ✓
- Paridade visual + verificação por preview → verificação em cada task + Task 8 ✓
- Fora de escopo (mutações, DnD, backend real) → respeitado, nada disso no plano ✓

**Placeholders:** nenhum "TBD/TODO"; código completo em cada step. Onde o corpo é grande e imutável (tabela de bugs, board do kanban), a instrução é explicitamente "mover o bloco original inalterado para dentro do ramo else".

**Consistência de tipos:** `Column`, `Bug`, `RoadmapQuarter`, `GddSection`, `Asset`, `TeamMember`, `DashboardData` usados de forma idêntica em `api/*` (Task 2) e `queries/hooks.ts` (Task 3). Nomes de funções `fetch*` batem entre Task 2 (produz) e Task 3 (consome). Nomes de hooks `use*` batem entre Task 3 (produz) e Tasks 5–6 (consomem). `useUiStore` consistente entre Task 4 (produz) e App.tsx (consome).
