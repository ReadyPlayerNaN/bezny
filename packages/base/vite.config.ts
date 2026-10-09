import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'style',
    },
    sourcemap: true,
    rolldownOptions: {
      external: /^react(?:\/.*)?$/,
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.tsx'],
  },
});
