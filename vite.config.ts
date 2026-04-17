import { defineConfig } from 'vite'

export default defineConfig({
  base: '/',
  build: {
    outDir: 'www',
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173
  },
  publicDir: 'public'
})