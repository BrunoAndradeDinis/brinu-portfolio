import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import { INLINE_SCRIPTS, INLINE_STYLES } from './src/utils/inline-scripts.mjs';
import { RUNTIME_STYLES } from './src/utils/runtime-styles.mjs';
import cspSharedHashes from './src/integrations/csp-shared-hashes.mjs';

const sha256 = (source) => `sha256-${createHash('sha256').update(source).digest('base64')}`;

export default defineConfig({
  site: 'https://brinu.xyz',
  output: 'static',
  build: {
    inlineStylesheets: 'always',
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "media-src 'self'",
        "connect-src 'self' data: https://script.google.com https://script.googleusercontent.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      scriptDirective: { resources: ["'self'"], hashes: INLINE_SCRIPTS.map(sha256) },
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
        hashes: [...INLINE_STYLES, ...RUNTIME_STYLES].map(sha256),
      },
    },
  },
  integrations: [react(), cspSharedHashes()],
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Syne',
      cssVariable: '--font-syne',
      weights: [700, 800],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: ['100 900'],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['sans-serif'],
      options: {
        experimental: {
          variableAxis: { wdth: [{ min: 62, max: 125 }] },
        },
      },
    },
    {
      provider: fontProviders.google(),
      name: 'Space Mono',
      cssVariable: '--font-space-mono',
      weights: [400, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['monospace'],
    },
    {
      provider: fontProviders.google(),
      name: 'Permanent Marker',
      cssVariable: '--font-permanent-marker',
      weights: [400],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['cursive'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
