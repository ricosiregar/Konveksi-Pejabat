import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/webhook-test': {
        target: 'https://n8n.konveksipejabat.my.id',
        changeOrigin: true,
        secure: true,
      }
    },
    cors: true,
    port: 5173
  }
})