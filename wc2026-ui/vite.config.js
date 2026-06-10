import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // On GitHub Pages a project repo is served from /<repo>/, so assets must be
  // requested with that prefix. CI sets VITE_BASE=/<repo>/; locally it's '/'.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
})
