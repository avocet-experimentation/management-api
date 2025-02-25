import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    typecheck: {
      tsconfig: './tsconfig.json',
    },
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
