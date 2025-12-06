import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plugin to serve WASM files with correct MIME type
const wasmPlugin = () => ({
  name: 'wasm-plugin',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      }
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), wasmPlugin()],
  server: {
    // Configure headers for WASM files
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Ensure the browser gets the UMD/dist build of `long` (not the
      // CommonJS `src/long.js` which uses `module.exports` and breaks in
      // the browser runtime). This forces imports of `long` to use the
      // prebuilt UMD file.
      "long": path.resolve(__dirname, "./node_modules/long/dist/long.js"),
  // Serve the browser-safe UMD/minified build of seedrandom instead of
  // the CommonJS `index.js` which uses `require`/`module.exports` and
  // crashes in the browser runtime.
  "seedrandom": path.resolve(__dirname, "./node_modules/seedrandom/seedrandom.min.js"),
    },
  },
  build: {
    rollupOptions: {
      external: ['@mediapipe/face_detection'], // Mark as external since we use tfjs runtime
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
      // Prebundle long so Vite serves the browser-safe build
      'long',
      // Prebundle seedrandom so Vite serves the browser-safe UMD build
      'seedrandom',
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-converter',
      '@tensorflow-models/face-detection',
    ],
    exclude: ['@tensorflow/tfjs-backend-webgl'],
  },
})
