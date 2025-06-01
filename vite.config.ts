
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Service-Worker-Allowed': '/',
    },
  },
  plugins: [
    react(),
    // Only add componentTagger in development mode
    ...(mode === 'development' ? [componentTagger()] : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Ensure single React instance
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    // Ensure React is deduplicated
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    // Force pre-bundling of React to avoid version conflicts
    include: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    sourcemap: true,
    modulePreload: {
      polyfill: true
    },
    assetsDir: 'assets',
    base: './',
    // Ensure consistent React handling
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
}));
