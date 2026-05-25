import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [lit()],
  vite: {
    plugins: [tailwindcss()],
    esbuild: {
      // Avoid class-field-shadowing in Lit decorators
      // (lit.dev/msg/class-field-shadowing)
      target: 'es2021',
    },
  },
  output: 'static',
});
