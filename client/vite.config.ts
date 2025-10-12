import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

// Performance-optimized Vite Configuration for React 19
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isDevelopment = mode === 'development';

  return {
    base: '/',
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),

      // Bundle analyzer for development
      ...(isDevelopment && env.ANALYZE ? [visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })] : []),

      // Gzip and Brotli compression for production
      ...(isProduction ? [
        compression({
          algorithm: 'gzip',
          ext: '.gz',
        }),
        compression({
          algorithm: 'brotliCompress',
          ext: '.br',
        }),
      ] : []),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      port: 3000,
      host: true, // Allow external connections
      allowedHosts: ['lneducacional.com.br'],
      proxy: {
        '/api': {
          target: 'http://localhost:3333',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
      // Optimize dev server performance
      fs: {
        strict: false,
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: isProduction ? false : 'cheap-module-source-map',
      minify: 'esbuild',
      target: 'es2020',
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false, // Faster builds

      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          },
        },
      },

      commonjsOptions: {
        transformMixedEsModules: true,
      },

      // Optimize CSS
      cssCodeSplit: true,
      cssMinify: true,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-is',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-slot',
        'lucide-react',
        'sonner',
        'zod',
        'react-hook-form',
        '@hookform/resolvers/zod',
      ],
      exclude: ['@vite/client', '@vite/env'],
      esbuildOptions: {
        target: 'es2020',
        jsx: 'automatic',
        // Optimize dependencies
        treeShaking: true,
        minify: isProduction,
      },
      // Force re-optimization in development
      force: isDevelopment,
    },

    // CSS optimization
    css: {
      devSourcemap: isDevelopment,
    },

    // Define global constants
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      'process.env.NODE_ENV': JSON.stringify(mode),
    },

    // Experimental features for better performance
    // Worker optimizations
    worker: {
      format: 'es',
      plugins: () => [
        react(),
      ],
    },

    // Preview server configuration (for production builds)
    preview: {
      port: 3000,
      host: true,
    },
  };
});
