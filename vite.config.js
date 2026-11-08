import { defineConfig } from 'vite';

// base: './' zorgt dat alle paden relatief zijn, zodat de build in elke
// (sub)map van een statische host of in een iframe werkt.
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
});
