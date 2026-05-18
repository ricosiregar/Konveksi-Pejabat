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
        target: 'http://202.155.143.186:5678',
        changeOrigin: true,
        secure: false,
      }
    },
    cors: true,
    port: 5173
  }
})