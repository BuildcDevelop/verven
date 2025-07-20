import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/database': path.resolve(__dirname, './src/database'),
      '@/convex': path.resolve(__dirname, './convex'),
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimalizace pro TypeScript
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          convex: ['convex']
        }
      }
    }
  },
  // TypeScript konfigurace
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})