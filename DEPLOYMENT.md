# Deploy na Vercel

Este projeto e um app React + Vite. Ele pode ser publicado como site estatico na Vercel, com protecao por Basic Auth via `middleware.js`.

## Basic Auth

No painel da Vercel, em **Project Settings > Environment Variables**, crie:

- `AUTH_USER`
- `AUTH_PASS`

Use valores reais apenas na Vercel. Nao coloque senha de homologacao direto no codigo.

O `middleware.js` fica na raiz, no mesmo nivel do `package.json`, e protege todas as rotas.

## Build

Na Vercel, use:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

## Banco vivo

Hoje o app usa dados em memoria em `src/api/db.ts`, inicializados a partir de `src/lib/data.ts`. Isso funciona para prototipo, mas nao persiste dados depois de refresh, novo deploy ou novo servidor.

Para banco vivo existem dois caminhos bons:

1. **Supabase direto no front-end**
   - Mais rapido para homologacao.
   - Usar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
   - Criar tabelas para tasks, columns, bugs, roadmap, gdd, assets, team e brainstorm.
   - Ativar RLS antes de producao real.

2. **Vercel Functions + Postgres/Neon/Supabase**
   - Mais profissional para producao.
   - O React chama endpoints em `/api/*`.
   - As credenciais do banco ficam somente no servidor.
   - Permite regras de permissao, validacao e auditoria sem expor acesso ao cliente.

Como este app ja concentra chamadas em `src/api/*` e usa React Query, a migracao deve trocar o corpo dessas funcoes por `fetch('/api/...')` ou chamadas do SDK escolhido, sem reescrever as telas.
