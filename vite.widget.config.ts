/**
 * @fileoverview Vite configuration for widget UMD bundle
 * 
 * Builds the embeddable widget as a UMD bundle for external integration.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'frontend/src/widget/index.ts'),
      name: 'SurvAIWidget',
      formats: ['umd'],
      fileName: 'survai-widget'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        exports: 'named'
      }
    },
    outDir: 'dist',
    // Size analysis
    reportCompressedSize: true,
    chunkSizeWarningLimit: 250, // 250kB warning limit as per PRP
    // Build for production
    target: 'es2017', // Compatibility target
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src'),
      '@survai/shared': resolve(__dirname, 'shared/src')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});