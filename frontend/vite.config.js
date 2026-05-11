import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5001,
    host: true  // Optional: allows external access
  },
  // Add production build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,  // Disable source maps for production
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          auth: ['jwt-decode', 'axios']
        }
      }
    }
  },
  // Base path if serving from subdirectory
  base: '/'
})