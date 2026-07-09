# Origem Studio — App (React + Vite + Tailwind + Radix)

Implementação real em React do design system Origem Studio (ferramenta interna de dev para jogos Roblox), recriando a mesma UI do protótipo em `ui_kits/app/index.html`.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** — cores/spacing/radius mapeados diretamente dos tokens do design system (`tailwind.config.js` + `src/index.css`)
- **Radix UI** (`@radix-ui/react-*`) — primitivos acessíveis sem estilo para Dialog, Tabs, Tooltip, Checkbox, Switch — estilizados no padrão shadcn/ui (`class-variance-authority` + `clsx` + `tailwind-merge`)
- **lucide-react** — ícones reais, substituindo os glyphs Unicode usados no protótipo HTML original (era um placeholder documentado no `readme.md` do design system)

## Rodar localmente

```bash
cd react-app
npm install
npm run dev
```

Abre em `http://localhost:5173`.

## Estrutura

- `src/index.css` — tokens de cor/tipografia/spacing (portados de `tokens/*.css`) como CSS custom properties
- `tailwind.config.js` — mapeia essas variáveis para classes Tailwind (`bg-canvas`, `text-secondary`, `border-subtle`, `rounded-md`, etc.)
- `src/components/ui/` — primitivos reutilizáveis: button, badge, card, avatar, input, select, checkbox, switch, tabs, dialog, tooltip, progress
- `src/components/` — componentes específicos do domínio: `kanban-card.tsx`, `nav-item.tsx`, `top-bar.tsx`
- `src/screens/` — as 8 telas: Painel, Kanban, Bugs, GDD, Roadmap, Brainstorm, Assets, Equipe
- `src/lib/data.ts` — dados de exemplo (projeto fictício "Skyline Racer")
- `src/App.tsx` — shell com sidebar de navegação

## O que ainda falta para produção

- **Sem backend**: os dados em `lib/data.ts` são estáticos. Trocar por chamadas reais (REST/GraphQL/Supabase/etc.) e mover para hooks de data-fetching (React Query é uma boa escolha).
- **Sem rotas**: navegação é `useState` simples no `App.tsx`. Para URLs reais, adicionar `react-router-dom`.
- **Select simplificado**: usa `<select>` nativo estilizado em vez do `@radix-ui/react-select` completo (mais componente, mesmo padrão visual) — trocar se precisar de opções ricas (ícones, busca).
- **Testes**: nenhum incluído.

## Design system de origem

Este código implementa o design system definido no restante do projeto (`../styles.css`, `../tokens/`, `../components/`, `../guidelines/`). Qualquer mudança de token deve ser feita nos dois lugares (CSS do design system e `src/index.css` deste app) até que exista um pipeline de build compartilhado entre eles.
