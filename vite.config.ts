import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep heavy OCR / PDF / Excel libs out of the initial bundle.
          vendor: ['react', 'react-dom', 'react-router-dom'],
          xlsx: ['xlsx'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
})
