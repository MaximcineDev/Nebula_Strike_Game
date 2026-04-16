import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'www',
    emptyOutDir: true
  },

  server: {
    host: true,
    port: 5173
  }
})
