import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: ['es2017', 'chrome63', 'firefox58', 'safari11', 'edge79'],
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          cannon: ['cannon-es']
        }
      }
    }
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  }
});
