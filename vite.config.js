import { defineConfig } from 'vite';

// Served at the custom domain root: https://tomatocat.top/
export default defineConfig({
  base: '/',
  build: {
    chunkSizeWarningLimit: 900,
  },
});
