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
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) {
            return 'vendor';
          }
          if (id.includes('node_modules/jwt-decode') || id.includes('node_modules/axios')) {
            return 'auth';
          }
        }
      }
    }
  },
  // Base path if serving from subdirectory
  base: '/'
})