import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',

  build: {
    outDir: 'www',
    emptyOutDir: true
  },

  server: {
    host: true,
    port: 5173
  }
})
