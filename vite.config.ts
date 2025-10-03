import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI component libraries (Radix UI)
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator',
          ],

          // Data fetching and state management
          'query-vendor': ['@tanstack/react-query'],

          // Supabase client
          'supabase-vendor': ['@supabase/supabase-js'],

          // Charts and visualization
          'chart-vendor': ['recharts'],

          // Icons
          'icon-vendor': ['lucide-react'],

          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Socket.io
          'socket-vendor': ['socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
}));
