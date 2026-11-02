import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [react()],
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
