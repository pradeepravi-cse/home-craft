import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  envDir: '../',  // load .env from the monorepo root
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
})
