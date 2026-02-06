import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('exceljs')) {
            return 'excel';
          }

          if (id.includes('recharts')) {
            return 'charts';
          }

          if (id.includes('framer-motion') || id.includes('lucide-react')) {
            return 'ui';
          }

          if (
            id.includes('react-router-dom') ||
            id.includes('react-dom') ||
            id.includes('/react/')
          ) {
            return 'vendor';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
