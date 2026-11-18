# Brinu Portfolio

Portfólio pessoal de **Bruno de Andrade Dinis (Brinu)**, Desenvolvedor Frontend & Full Stack, com direção de arte inspirada em Persona 5 e Cowboy Bebop. Site estático bilíngue (pt-br / en).

## Stack

- [Astro 7](https://astro.build) com `output: 'static'` e fontes self-hosted pelo `<Font />`
- React 19 para as ilhas interativas (`@astrojs/react`)
- Tailwind CSS v4 (`@tailwindcss/vite`), tokens em `src/styles/tokens.css`
- GSAP 3 + Lenis para motion e scroll suave
- Web Audio API para os efeitos sonoros (sem arquivos de áudio, mudo por padrão)
- TypeScript 6, Zod, Playwright + `node:test` para os testes

## Requisitos

- Node.js `>= 22.22.0`
- npm

## Comandos

```bash
npm install          # instala as dependências
npm run dev          # servidor local em http://localhost:4321
npm run build        # gera o site estático em dist/
npm run preview      # serve o build de dist/
npm run check        # checagem de tipos do Astro
npm test             # build + suíte completa (node:test + Playwright)
```

Na primeira vez, instale o Chromium do Playwright: `npx playwright install chromium`.

## Estrutura

```
src/
  pages/        rotas: /, /cases/[id], /whoami, /stickers, 404
  components/   seções da home, primitivas P5 (P5Panel, P5Badge, P5Title) e ilhas React
  data/         fonte única dos fatos: perfil, cases, carreira, arsenal, hobbies
  i18n/         dicionários pt-br / en e bindings reativos
  layouts/      BaseLayout (SEO, JSON-LD, fontes, lifecycle)
  styles/       tokens.css e global.css
  utils/        motion, áudio, terminal do /whoami, telemetria do console
public/         ícones, stickers, currículo em PDF
apps-script/    relay do formulário de contato (Google Apps Script)
tests/          testes unitários e e2e (*.test.mjs)
```

Todo conteúdo pessoal e profissional fica em `src/data/` e `src/i18n/dictionaries.ts`; os componentes não têm texto fixo.

## Formulário de contato

O formulário envia para um Web App do Google Apps Script (`apps-script/contact-relay.js`), cuja URL está em `src/data/contact-brief.ts`. Para trocar o destino, publique o script na sua conta Google e atualize essa URL.

## Deploy

O build gera HTML estático em `dist/`, publicável em qualquer host estático (Vercel, Netlify, Cloudflare Pages). O domínio de produção é `https://brinu.xyz`, definido em `site` no `astro.config.mjs`: dele saem as URLs canônicas, o `og:image` absoluto e o `sitemap.xml`. Ao trocar de domínio, atualize também `public/robots.txt`.

## Licença

Código e conteúdo © Bruno de Andrade Dinis. Todos os direitos reservados.
