import { defineConfig } from 'vite'
import path from 'node:path'
import { viteSingleFile } from 'vite-plugin-singlefile'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react(), viteSingleFile()],
  root: path.resolve('src/app'),
  build: {
    minify: mode === 'production',
    cssMinify: mode === 'production',
    sourcemap: mode !== 'production' ? 'inline' : false,
    emptyOutDir: false,
    outDir: path.resolve('.'),
  },
  resolve: {
    alias: {
      '@common': path.resolve('src/common'),
      '@app': path.resolve('src/app'),
    },
  },
  define: {
    global: 'globalThis',
  },
}))