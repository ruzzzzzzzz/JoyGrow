import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin to import .sql files as raw text
    {
      name: 'sql-loader',
      transform(code, id) {
        if (id.endsWith('.sql')) {
          return {
            code: `export default ${JSON.stringify(code)}`,
            map: null,
          };
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@components': path.resolve(__dirname, './components'),
      '@contexts': path.resolve(__dirname, './contexts'),
      '@hooks': path.resolve(__dirname, './hooks'),
      '@utils': path.resolve(__dirname, './utils'),
      '@data': path.resolve(__dirname, './data'),
      '@styles': path.resolve(__dirname, './styles'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            'lucide-react',
            'motion',
            'sonner',
          ],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-progress',
            '@radix-ui/react-avatar',
            '@radix-ui/react-scroll-area',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      'motion',
      'recharts',
      'date-fns',
      'sonner',
    ],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  css: {
    devSourcemap: false,
  },
});