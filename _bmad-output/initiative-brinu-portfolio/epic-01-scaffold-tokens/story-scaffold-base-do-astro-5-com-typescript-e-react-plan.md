---
title: 'Scaffold base do Astro 5 com TypeScript e React'
type: 'feature'
ticket: 1
created: '2026-10-12'
status: 'built'
baseline_revision: '244a09afbab7513e430d6c20fc8749c109a1d858'
route: 'full'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O repositório atual possui apenas documentação de planejamento e especificações, sem a infraestrutura base de código do Astro 5 e TypeScript necessária para construir o portfólio.

**Approach:** Inicializar a raiz do projeto com o Astro 5, integração oficial do React (`@astrojs/react`), TypeScript com checagem estrita e a árvore de diretórios canônica em `src/`, garantindo build estático limpo e sem dependências supérfluas.

## Boundaries & Constraints

**Always:**
- Utilizar Astro 5.x com `@astrojs/react` e React 19.x.
- Manter `strict: true` no `tsconfig.json`.
- Preservar todos os arquivos existentes na raiz (`_bmad/`, `_bmad-output/`, `assets/`, `init.md`, `brainstorm-data.md`).

**Never:**
- Não instalar Tailwind CSS nem bibliotecas utilitárias de estilo (Vanilla CSS / Custom Properties será adotado conforme `DESIGN.md`).
- Não adicionar bibliotecas pesadas de animação ou Three.js nesta story (elas pertencem às histórias subsequentes).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Build Estático | `npm run build` | Geração limpa da pasta `dist/` com HTML estático puro | Falha com código de erro diferente de 0 se houver erro de tipagem ou sintaxe |
| Servidor de Desenvolvimento | `npm run dev` | Servidor local sobe em `http://localhost:4321` servindo a página inicial | Mensagem clara de porta em uso se ocupada |

</frozen-after-approval>

## Code Map

- `.gitignore` -- Arquivo de exclusão de artefatos temporários e dependências (`node_modules/`, `dist/`, `.astro/`)
- `package.json` -- Manifest de dependências do Node.js (scripts dev, build, preview e dependências base do Astro 5 + React)
- `astro.config.mjs` -- Arquivo de configuração do Astro com plugin `react()` habilitado e saída estática
- `tsconfig.json` -- Configuração do TypeScript estendendo `"astro/tsconfigs/strict"` com suporte JSX para React
- `src/env.d.ts` -- Declaração de tipos de ambiente do Astro (`astro/client`) para o TypeScript
- `public/favicon.svg` -- Favicon vetorial padrão para prevenir 404 em requisições de navegador
- `src/layouts/BaseLayout.astro` -- Layout shell básico HTML5 com meta tags iniciais
- `src/pages/index.astro` -- Ponto de entrada da landing page renderizando o layout básico

## Tasks & Acceptance

**Execution:**
- [x] `.gitignore` -- Criar `.gitignore` com regras para `node_modules/`, `dist/`, `.astro/`, `.env*` e arquivos de log do sistema -- Previne poluição de versionamento acidental.
- [x] `package.json` -- Criar package.json com scripts (`dev`, `build`, `preview`, `check`), dependências de runtime (`astro`, `@astrojs/react`, `react`, `react-dom`) e devDependencies (`@astrojs/check`, `@types/react`, `@types/react-dom`, `typescript`) -- Permite gerenciamento determinístico de pacotes e checagem de tipos via CLI.
- [x] `astro.config.mjs` -- Configurar integração do React no Astro com `output: 'static'` explícito -- Habilita a Arquitetura de Ilhas para componentes React e garante compilação estática pura.
- [x] `tsconfig.json` -- Configurar TypeScript estendendo `"astro/tsconfigs/strict"` com suporte a `jsx: "react-jsx"` e `jsxImportSource: "react"` -- Garante segurança de tipos para Astro e arquivos `.tsx`.
- [x] `src/env.d.ts` -- Adicionar arquivo de tipos de ambiente referenciando `astro/client` -- Garante reconhecimento de tipos do Astro no editor e CLI.
- [x] `public/favicon.svg` -- Criar ícone SVG vetorial minimalista temático -- Evita requisições 404 ao servir a aplicação.
- [x] `src/layouts/BaseLayout.astro` -- Implementar layout shell com viewport, lang="pt-BR", charset="UTF-8", title/description dinâmicos via Astro.props e slot principal -- Base estrutural para todas as páginas.
- [x] `src/pages/index.astro` -- Criar landing page mínima conectada ao BaseLayout com título temático -- Permite validação visual e de build.

**Acceptance Criteria:**
- Given o repositório configurado, when executado `npm install` e `npm run build`, then o Astro compila o projeto gerando `dist/` com sucesso e sem warnings de tipagem.
- Given o comando `npm run check` executado, then o diagnóstico do Astro e TypeScript reporta zero erros.
- Given o servidor iniciado com `npm run dev`, when requisitado `GET /`, then o HTML estático do BaseLayout é retornado com código de status HTTP 200 contendo as meta tags e o slot renderizado.
- Given o arquivo `.gitignore`, when executados comandos de build e instalação, then `node_modules/`, `.astro/` e `dist/` permanecem ignorados pelo git.

## Implementation Notes

## Plan Change Log

- Adicionada dependência `@astrojs/check` e script `check` ao `package.json` para suportar o comando de verificação automatizada.
- Especificada configuração de `jsx` no `tsconfig.json` para assegurar compatibilidade estrita com React 19.

## Review Triage Log

- **Higiene de Versionamento:** Adicionado `.gitignore` com regras para `node_modules/`, `dist/` e `.astro/` (o repositório não possuía `.gitignore` e corria risco de comitar dependências).
- **Tipagem de Ambiente:** Adicionado `src/env.d.ts` com referência a `astro/client` para assegurar que `npm run check` e o compilador TS resolvam tipos nativos do Astro sem advertências.
- **Asset Base:** Adicionado `public/favicon.svg` para evitar chamadas quebradas e erros 404 no navegador durante o teste do `BaseLayout.astro`.
- **Formatação:** Removida duplicação acidental do cabeçalho `## Tasks & Acceptance`.

## Verification

**Commands:**
- `npm run check` -- expected: diagnóstico do Astro/TypeScript retorna zero erros
- `npm run build` -- expected: compilação estática com sucesso gerando a pasta `dist/`


