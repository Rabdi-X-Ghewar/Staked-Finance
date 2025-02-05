import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/agent': {
        target: 'http://localhost:3000', // Backend URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/agent/, ''),
      },
    },
  },
});