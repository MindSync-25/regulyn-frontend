import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      name: 'RegulynWidget',
      fileName: 'regulyn-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        extend: true
      }
    }
  }
});
