import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    watch: {
      // Prevent full server restart when config or TypeScript files change
      ignored: ['**/vite.config.ts', '**/tsconfig.json'],
      // ✅ CRITICAL FIX: Enable polling AND set interval for HMR to work  
      usePolling: true, // ✅ Must be explicit in config to work with env vars
      interval: 50, // ✅ Reduced from 100ms to 50ms
    },
    hmr: {
      overlay: true,
      timeout: 60000,
    },
  },
});