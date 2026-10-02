import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the site from /aviora-travista/; the deploy workflow sets BASE_PATH.
  // Other hosts (Netlify, Vercel, a custom domain) serve from the root, so the default is '/'.
  base: process.env.BASE_PATH || '/',
  worker: { format: 'es' },
  build: {
    // the MapLibre chunk (~300 kB gzipped) is lazy-loaded only near the Track My Tour map
    chunkSizeWarningLimit: 1200,
  },
});
