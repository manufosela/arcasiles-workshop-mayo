import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  integrations: [lit()],
  vite: {
    plugins: [tailwindcss()],
  },
  output: 'static',
});
