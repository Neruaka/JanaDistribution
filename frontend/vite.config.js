import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Bind-mount Docker Desktop sur Windows : les événements fs natifs n'atteignent
    // pas toujours chokidar dans le conteneur Linux -> on force le polling pour que
    // le HMR reflète bien les fichiers modifiés côté hôte.
    watch: {
      usePolling: true,
      interval: 300
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
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
        manualChunks: {
          excel: ['exceljs']
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
