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
        target: 'https://oversoftly-untactile-joanna.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('➡️  Proxying:', req.method, req.url);
            proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Response:', proxyRes.statusCode, req.url);
          });
        }
      }
    },
    cors: true,
    port: 5173
  }
})