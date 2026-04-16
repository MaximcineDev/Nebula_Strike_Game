import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'www',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    host: true,
    port: 5173
  },
  publicDir: 'public'
})