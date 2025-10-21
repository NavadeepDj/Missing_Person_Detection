import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          'tensorflow': ['@tensorflow/tfjs', '@tensorflow/tfjs-converter', '@tensorflow-models/face-detection'],
        },
      },
    },
    // Optimize build for Vercel
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-converter',
      '@tensorflow-models/face-detection',
    ],
    exclude: ['@tensorflow/tfjs-backend-webgl'],
  },
})
