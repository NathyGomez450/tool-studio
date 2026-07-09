# Redesign "Escuro elegante" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin do app para um visual dark moderno e elegante (neutros quase-neutros, acento índigo, Inter, profundidade suave, badges tonais), sem mudar layout nem comportamento.

**Architecture:** Retune dos tokens OKLCH em `index.css` (`:root`) + fonte no `tailwind.config` propaga pras 8 telas; badge passa a ser 100% token-driven; refinamento pontual de card e sidebar.

**Tech Stack:** Tailwind 3.4 (tokens via CSS vars), OKLCH, Inter + IBM Plex Mono (Google Fonts), Vite 8.

## Global Constraints

- **Sem mudança de layout/estrutura/comportamento** — só aparência.
- **Tokens dirigem tudo**: retunar `:root` propaga; evitar hardcode novo — usar vars.
- **Acento** = índigo/violeta refinado (hue ~280), usado com parcimônia. **Sucesso** vira verde próprio (≠ acento).
- **Fonte UI** = Inter; **mono** = IBM Plex Mono.
- **Verificação:** `tsc` + `build` limpos; screenshot de cada tela; contraste conferido; console limpo.
- **Commits atômicos** em PT-BR com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Modificar:**
- `src/index.css` — tokens `:root` (grays, acento, verde, semânticos + soft/soft-border, texto, bg, borda, sombra), `@import` de fonte, `body` font
- `tailwind.config.js` — `fontFamily.sans` → Inter
- `src/components/ui/badge.tsx` — tonal, token-driven
- `src/components/ui/card.tsx` — padding/depth
- `src/App.tsx` — cor do texto do logo (contraste no acento índigo)

---

## Task 1: Reskin de tokens + fontes

**Files:**
- Modify: `src/index.css`, `tailwind.config.js`

**Interfaces:**
- Produces: novos valores de todos os tokens `:root`; novos tokens `--green-500`, `--green-400`, `--success-soft-border`, `--info-soft-border`, `--warning-soft-border`, `--danger-soft-border`, `--creative-soft-border`.

- [ ] **Step 1: Substituir todo o conteúdo de `src/index.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ---- Origem Studio — tema "Escuro elegante" (tokens OKLCH) ---- */
:root {
  /* Neutros quase-neutros (chroma baixo, hue 275) */
  --gray-950: oklch(0.145 0.006 275);
  --gray-900: oklch(0.185 0.006 275);
  --gray-850: oklch(0.215 0.006 275);
  --gray-800: oklch(0.255 0.007 275);
  --gray-700: oklch(0.34 0.008 275);
  --gray-600: oklch(0.44 0.008 275);
  --gray-500: oklch(0.56 0.008 275);
  --gray-400: oklch(0.67 0.007 275);
  --gray-300: oklch(0.77 0.006 275);
  --gray-200: oklch(0.86 0.005 275);
  --gray-100: oklch(0.92 0.004 275);
  --gray-50:  oklch(0.97 0.003 275);

  /* Acento: índigo/violeta refinado (hue 280) */
  --accent-900: oklch(0.32 0.09 280);
  --accent-700: oklch(0.45 0.13 280);
  --accent-600: oklch(0.55 0.15 280);
  --accent-500: oklch(0.62 0.16 280);
  --accent-400: oklch(0.70 0.15 280);
  --accent-300: oklch(0.80 0.11 280);

  /* Semânticos (dessaturados) */
  --green-500: oklch(0.62 0.14 155);
  --green-400: oklch(0.72 0.13 155);
  --blue-500:  oklch(0.62 0.13 250);
  --blue-400:  oklch(0.72 0.11 250);
  --amber-500: oklch(0.76 0.13 75);
  --amber-400: oklch(0.83 0.11 75);
  --red-500:   oklch(0.62 0.17 25);
  --red-400:   oklch(0.71 0.15 25);
  --violet-500: oklch(0.60 0.15 300);
  --violet-400: oklch(0.71 0.13 300);

  --bg-canvas: var(--gray-950);
  --bg-surface: var(--gray-900);
  --bg-surface-2: var(--gray-850);
  --bg-surface-3: var(--gray-800);
  --bg-overlay: oklch(0.145 0.006 275 / 0.72);
  --bg-hover: oklch(1 0 0 / 0.04);
  --bg-pressed: oklch(1 0 0 / 0.07);

  --border-subtle: oklch(1 0 0 / 0.06);
  --border-default: oklch(1 0 0 / 0.10);
  --border-strong: oklch(1 0 0 / 0.16);
  --border-focus: var(--accent-400);

  --text-primary: var(--gray-50);
  --text-secondary: var(--gray-300);
  --text-tertiary: var(--gray-500);
  --text-disabled: var(--gray-600);
  --text-on-accent: oklch(0.98 0 0);

  --accent: var(--accent-500);
  --accent-hover: var(--accent-400);
  --accent-active: var(--accent-600);
  --accent-soft: oklch(0.62 0.16 280 / 0.16);
  --accent-soft-border: oklch(0.62 0.16 280 / 0.34);

  --success: var(--green-500);
  --success-soft: oklch(0.62 0.14 155 / 0.15);
  --success-soft-border: oklch(0.62 0.14 155 / 0.32);
  --warning: var(--amber-500);
  --warning-soft: oklch(0.76 0.13 75 / 0.14);
  --warning-soft-border: oklch(0.76 0.13 75 / 0.30);
  --danger: var(--red-500);
  --danger-soft: oklch(0.62 0.17 25 / 0.14);
  --danger-soft-border: oklch(0.62 0.17 25 / 0.30);
  --info: var(--blue-500);
  --info-soft: oklch(0.62 0.13 250 / 0.14);
  --info-soft-border: oklch(0.62 0.13 250 / 0.30);
  --creative: var(--violet-500);
  --creative-soft: oklch(0.60 0.15 300 / 0.14);
  --creative-soft-border: oklch(0.60 0.15 300 / 0.30);

  --focus-ring: oklch(0.62 0.16 280 / 0.40);

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 999px;

  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.25);
  --shadow-md: 0 6px 16px oklch(0 0 0 / 0.24), 0 1px 3px oklch(0 0 0 / 0.20);
  --shadow-lg: 0 16px 40px oklch(0 0 0 / 0.32), 0 4px 10px oklch(0 0 0 / 0.20);
  --shadow-focus: 0 0 0 3px var(--focus-ring);
}

* { box-sizing: border-box; }

html, body, #root { height: 100%; }

body {
  margin: 0;
  background: var(--bg-canvas);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--gray-700); border-radius: 999px; border: 2px solid var(--bg-canvas); }
```

- [ ] **Step 2: Atualizar `fontFamily.sans` em `tailwind.config.js`**

Trocar:
```javascript
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
```
por:
```javascript
        sans: ['Inter', 'system-ui', 'sans-serif'],
```

- [ ] **Step 3: Verificar typecheck e build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros; sem warning de `@import` (segue antes das diretivas @tailwind).

- [ ] **Step 4: Commit**

```bash
git add src/index.css tailwind.config.js
git commit -m "feat: reskin de tokens para tema escuro elegante (índigo + Inter)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Badge tonal token-driven

**Files:**
- Modify: `src/components/ui/badge.tsx`

**Interfaces:**
- Consumes: tokens `--<sem>-soft` / `--<sem>-soft-border` / `--green-400`/`--blue-400`/`--amber-400`/`--red-400`/`--violet-400`/`--accent-400` (Task 1).
- Produces: `Badge` inalterado em API.

- [ ] **Step 1: Substituir o objeto `tone` em `src/components/ui/badge.tsx`**

Trocar o bloco `tone: { ... }` inteiro por:
```tsx
      tone: {
        neutral: 'bg-surface3 text-secondary border-border',
        accent: 'bg-accent-soft text-[var(--accent-400)] border-[var(--accent-soft-border)]',
        success: 'bg-[var(--success-soft)] text-[var(--green-400)] border-[var(--success-soft-border)]',
        info: 'bg-[var(--info-soft)] text-[var(--blue-400)] border-[var(--info-soft-border)]',
        warning: 'bg-[var(--warning-soft)] text-[var(--amber-400)] border-[var(--warning-soft-border)]',
        danger: 'bg-[var(--danger-soft)] text-[var(--red-400)] border-[var(--danger-soft-border)]',
        creative: 'bg-[var(--creative-soft)] text-[var(--violet-400)] border-[var(--creative-soft-border)]',
      },
```

- [ ] **Step 2: Verificar typecheck**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "refactor: badges tonais 100% token-driven

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Refinamento de card e sidebar

**Files:**
- Modify: `src/components/ui/card.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: token `--text-on-accent` (Task 1).
- Produces: nada novo.

- [ ] **Step 1: `src/components/ui/card.tsx` — padding maior**

Trocar:
```tsx
        'bg-surface border border-border rounded-md p-4 shadow-sm transition-colors hover:border-border-strong',
```
por:
```tsx
        'bg-surface border border-border rounded-lg p-5 shadow-sm transition-colors hover:border-border-strong',
```

- [ ] **Step 2: `src/App.tsx` — texto do logo legível sobre o acento índigo**

Trocar (no bloco do logo "O"):
```tsx
          <div className="w-[26px] h-[26px] rounded-lg bg-[var(--accent-500)] flex items-center justify-center font-bold text-[13px] text-[var(--gray-950)]">
            O
          </div>
```
por:
```tsx
          <div className="w-[26px] h-[26px] rounded-lg bg-[var(--accent-500)] flex items-center justify-center font-bold text-[13px] text-[var(--text-on-accent)]">
            O
          </div>
```

- [ ] **Step 3: Verificar typecheck e build**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/card.tsx src/App.tsx
git commit -m "feat: refina card (padding/raio) e contraste do logo

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Verificação visual final

**Files:** nenhum (verificação).

- [ ] **Step 1: `tsc` + `build` limpos**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

- [ ] **Step 2: Reiniciar dev server limpo e percorrer todas as telas**

`preview_stop` → `rm -rf node_modules/.vite` → `preview_start` (fonte nova). Então:
1. Screenshot de: Painel, Kanban, Bugs, GDD, Roadmap, Brainstorm, Assets, Equipe.
2. Conferir: acento índigo no botão primário/nav ativo; badges tonais legíveis; texto sobre superfícies com contraste; logo legível.
3. Abrir um dialog (TaskDialog) e a FilterBar → coerentes com o tema.
4. `preview_console_logs` sem erros/warnings.

- [ ] **Step 3: Ajustes finos**

Se algum contraste/tom ficar fraco (ex.: texto tertiary sobre surface, ou acento muito escuro/claro), ajustar o token correspondente em `index.css` e re-verificar. Commit do ajuste se houver.

---

## Self-Review

**Cobertura do spec:**
- Neutros quase-neutros + canvas near-black → Task 1 ✓
- Acento índigo, sucesso verde próprio, semânticos dessaturados → Task 1 ✓
- Inter (UI) + IBM Plex Mono → Task 1 (import + body) + tailwind sans ✓
- Sombras suaves, bordas hairline → Task 1 ✓
- Tokens soft-border por semântico → Task 1 ✓
- Badges tonais token-driven → Task 2 ✓
- Refinamento card/sidebar → Task 3 ✓
- Verificação por screenshots + contraste + console → Task 4 ✓
- Fora de escopo (layout, comportamento, tema claro) → respeitado ✓

**Placeholders:** nenhum; CSS/JSX completos.

**Consistência de tipos/tokens:** os tokens novos referenciados no badge (Task 2) — `--green-400`, `--success-soft-border`, `--info-soft-border`, `--warning-soft-border`, `--danger-soft-border`, `--creative-soft-border` — são todos definidos na Task 1. `--text-on-accent` usado na Task 3 é definido na Task 1. `tailwind.config` `fontFamily.sans` → Inter casa com o `@import` e o `body` (Task 1). Classes Tailwind existentes (`bg-canvas`, `text-primary`, `accent`, `shadow-sm`…) continuam mapeando os mesmos nomes de var — só os valores mudam.
