import { defineConfig } from 'vite';

// Deployed as a GitHub Pages project site: https://ninepoin4.github.io/zlx-portfolio/
export default defineConfig({
  base: '/zlx-portfolio/',
  build: {
    chunkSizeWarningLimit: 900,
  },
});
