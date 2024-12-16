import { defineConfig } from 'vitest/config.js';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    typecheck: {
      tsconfig: './tsconfig.json',
    },
    fileParallelism: false,
  },
});
