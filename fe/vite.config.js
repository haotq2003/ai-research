import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            // Bỏ qua lỗi ECONNRESET khi client hoặc server chủ động ngắt luồng SSE
            if (err.code === 'ECONNRESET' || err.message?.includes('ECONNRESET')) return;
            console.error('[Vite Proxy Error]:', err.message);
          });
        },
      },
    },
  },
})
