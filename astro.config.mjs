import { defineConfig, fontProviders } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [react()],
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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three/build/three.core')) {
              return 'three-core';
            }
            if (id.includes('node_modules/three/')) {
              return 'three-renderers';
            }
          },
        },
      },
    },
  },
});
