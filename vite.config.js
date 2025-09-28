import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true, // Allow all hosts for Replit proxy
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin"
    }
  },
  build: {
    target: 'es2020', // Updated to ES2020 which supports BigInt
    sourcemap: true,  // Enable source maps for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          transformers: ['@huggingface/transformers']
        }
      }
    },
    chunkSizeWarningLimit: 2000, // Increase chunk size limit for ML models
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'] // Prevent optimization of transformers.js
  }
});
