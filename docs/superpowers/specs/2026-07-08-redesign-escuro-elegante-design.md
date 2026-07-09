# Design — Redesign profissional "Azul + Preto" (estilo Apex/FuelTech)

**Data:** 2026-07-08
**Projeto:** Origem Studio
**Autor:** Nathalia
**Status:** Aprovado (design) — revisado após referência visual do portal Apex/FuelTech

## Contexto

O primeiro reskin (índigo + Inter) mudou basicamente cores/fonte — leu como recolor.
A Nathalia trouxe uma referência (portal Apex/FuelTech) e pediu **cara de aplicativo
profissional**, com **paleta azul + preto** (sem o vermelho da marca). O objetivo é
adotar a **linguagem visual** da referência sobre as telas do Origem Studio.

## Direção (padrões extraídos da referência)

- **Paleta:** base **preto/near-black** (neutra, levemente fria), acento **azul** profissional usado com identidade (ícones de destaque, item ativo, ênfase). Semânticos mantidos (sucesso verde, aviso âmbar, erro vermelho).
- **Ícone em quadrado tonal:** padrão-assinatura — ícone dentro de quadrado arredondado com fundo tonal (azul no destaque, neutro em cards). Usado no cabeçalho de cada tela.
- **Sidebar profissional:**
  - Campo de **busca** no topo (com ícone).
  - Nav **agrupada por seção** com rótulos mutados em maiúsculas + tracking.
  - Item ativo = **pílula preenchida** (fundo tonal) + **barra de acento à esquerda**, largura total.
  - **Card de usuário** no rodapé (avatar + nome + e-mail).
- **Cabeçalho de tela (module header):** quadrado de ícone + **título grande bold** + subtítulo, ações à direita, **divisor fino** abaixo.
- **Cards:** fundo sutil, borda hairline, padding generoso, cantos ~14px, hover com leve realce.
- **Tipografia:** Inter, hierarquia forte (títulos grandes/bold, rótulos pequenos mutados).
- **Espaçamento:** generoso (respiro premium), densidade menor.

## Arquitetura da mudança

### 1. Paleta — `src/index.css`
- Grays → **near-black** mais profundo (canvas ~L0.13, hue ~255 baixa chroma).
- Acento → **azul** (hue ~255), escala 300–900; `--text-on-accent` near-white.
- `--info` distinto do acento (ou família próxima). Semânticos inalterados no significado.

### 2. Cabeçalho de tela — `src/components/top-bar.tsx` + telas
- `TopBar` ganha prop `icon` (quadrado tonal) e vira o "module header": ícone + título grande + subtítulo + ações; divisor abaixo.
- Cada tela passa seu ícone (os mesmos do NAV em `App.tsx`).

### 3. Sidebar — `src/App.tsx` + `src/components/nav-item.tsx`
- Adicionar campo de busca (filtra itens do NAV por rótulo — client-side, estado local).
- Agrupar itens por seção (ex.: "Projeto", "Trabalho") com rótulos.
- `NavItem` ativo: pílula preenchida + barra de acento à esquerda.
- Card de usuário no rodapé refinado (avatar + nome + e-mail).

### 4. Cards e Dashboard — `src/components/ui/card.tsx` + `src/screens/dashboard.tsx`
- `Card`: padding/raio/hover refinados.
- Stat cards do Painel: **ícone em quadrado tonal** + número grande + rótulo (visual de KPI).

### 5. Kanban — `src/components/kanban-card.tsx` + `src/screens/kanban.tsx`
- Cabeçalho de coluna com **contagem em pill**.
- Card com **faixa de prioridade à esquerda** e linha de meta (tags/assignees/comentários) limpa.

## Fora de escopo
- Seletor de idioma/tema, breadcrumb global (chrome que não faz sentido aqui).
- Mudar comportamento (mutações, DnD, filtros permanecem).
- Tema claro.

## Verificação
1. `tsc` + `build` limpos.
2. Screenshot de cada tela (Painel, Kanban, Bugs, GDD, Roadmap, Brainstorm, Assets, Equipe) — aprovação visual incremental (sidebar+header+paleta primeiro).
3. Contraste conferido (texto/superfícies, texto sobre azul, badges).
4. Console limpo.
